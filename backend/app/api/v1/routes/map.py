"""
Map data endpoints.

GET /api/v1/map/incidents         – All incidents for the full map view (with AI summary).
GET /api/v1/map/emergency-services – Nearby hospitals, fire stations, police, shelters.

OpenStreetMap / Overpass API results are in-process cached for 1 hour so we
never hammer the external API repeatedly.  The cache is intentionally
process-scoped (simple dict + TTL) – no Redis dependency needed here.
"""
from __future__ import annotations

import time
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.incidents.models import Incident
from app.llm.models import LLMAnalysis

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/map")

# ---------------------------------------------------------------------------
# In-process Overpass cache  (key → (payload, expiry_ts))
# ---------------------------------------------------------------------------
_OVERPASS_CACHE: dict[str, tuple[list, float]] = {}
_CACHE_TTL = 3600  # seconds — 1 hour

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Map Overpass OSM tags → our service category labels
_SERVICE_TAGS = {
    "hospital": ("amenity", "hospital"),
    "fire_station": ("amenity", "fire_station"),
    "police": ("amenity", "police"),
    "shelter": ("amenity", "shelter"),
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _cache_key(lat: float, lon: float, radius: int) -> str:
    return f"{lat:.3f},{lon:.3f},{radius}"


def _overpass_query(lat: float, lon: float, radius: int) -> str:
    """Build an Overpass QL query for all emergency service types."""
    parts = []
    for _, (k, v) in _SERVICE_TAGS.items():
        parts.append(f'node["{k}"="{v}"](around:{radius},{lat},{lon});')
        parts.append(f'way["{k}"="{v}"](around:{radius},{lat},{lon});')
    union = "\n".join(parts)
    return f"[out:json][timeout:25];\n(\n{union}\n);\nout center tags;"


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return approximate distance in km between two lat/lon pairs."""
    import math
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


def _category_from_tags(tags: dict) -> str:
    amenity = tags.get("amenity", "")
    mapping = {
        "hospital": "hospital",
        "fire_station": "fire_station",
        "police": "police",
        "shelter": "shelter",
    }
    return mapping.get(amenity, "other")


def _fetch_overpass(lat: float, lon: float, radius: int) -> list[dict]:
    """Call Overpass API and normalise into a flat list of service dicts."""
    query = _overpass_query(lat, lon, radius)
    try:
        resp = httpx.post(OVERPASS_URL, data={"data": query}, timeout=30.0)
        resp.raise_for_status()
        elements = resp.json().get("elements", [])
    except Exception as exc:
        logger.warning("Overpass API call failed: %s", exc)
        return []

    services = []
    for el in elements:
        tags = el.get("tags", {})
        # nodes have lat/lon directly; ways have a centre
        if el.get("type") == "way":
            centre = el.get("center", {})
            el_lat = centre.get("lat")
            el_lon = centre.get("lon")
        else:
            el_lat = el.get("lat")
            el_lon = el.get("lon")

        if el_lat is None or el_lon is None:
            continue

        dist = _haversine_km(lat, lon, el_lat, el_lon)
        services.append(
            {
                "id": str(el.get("id", "")),
                "name": tags.get("name") or tags.get("amenity", "Unknown"),
                "category": _category_from_tags(tags),
                "latitude": el_lat,
                "longitude": el_lon,
                "distance_km": round(dist, 2),
                "address": ", ".join(
                    filter(
                        None,
                        [
                            tags.get("addr:housenumber"),
                            tags.get("addr:street"),
                            tags.get("addr:city"),
                        ],
                    )
                )
                or None,
                "phone": tags.get("phone") or tags.get("contact:phone"),
            }
        )

    # Sort nearest first
    services.sort(key=lambda s: s["distance_km"])
    return services


def _get_cached_services(lat: float, lon: float, radius: int) -> list[dict]:
    """Return cached results or fetch fresh from Overpass."""
    key = _cache_key(lat, lon, radius)
    cached = _OVERPASS_CACHE.get(key)
    if cached:
        payload, expiry = cached
        if time.time() < expiry:
            logger.debug("Overpass cache hit for %s", key)
            return payload

    logger.info("Fetching Overpass data for %s", key)
    services = _fetch_overpass(lat, lon, radius)
    _OVERPASS_CACHE[key] = (services, time.time() + _CACHE_TTL)
    return services


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/incidents", summary="All incidents enriched for map display")
def get_map_incidents(
    db: Session = Depends(get_db),
    severity: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    days: Optional[int] = Query(None),
) -> dict:
    """Return every incident (optionally filtered) with its latest AI summary."""
    from datetime import datetime, timedelta, timezone

    q = db.query(Incident)
    if severity:
        q = q.filter(Incident.severity == severity)
    if category:
        q = q.filter(Incident.category == category)
    if status:
        q = q.filter(Incident.status == status)
    if days:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        q = q.filter(Incident.created_at >= cutoff)

    incidents = q.order_by(Incident.created_at.desc()).all()

    # Batch-load LLM analyses so we don't N+1
    incident_ids = [inc.id for inc in incidents]
    llm_map: dict[str, LLMAnalysis] = {}
    if incident_ids:
        rows = (
            db.query(LLMAnalysis)
            .filter(LLMAnalysis.incident_id.in_(incident_ids))
            .all()
        )
        # Keep only the first (most recent) per incident
        for row in rows:
            if row.incident_id not in llm_map:
                llm_map[row.incident_id] = row

    items = []
    for inc in incidents:
        llm = llm_map.get(inc.id)
        items.append(
            {
                "id": inc.id,
                "title": inc.title,
                "description": inc.description,
                "category": inc.category,
                "severity": inc.severity,
                "status": inc.status,
                "latitude": inc.latitude,
                "longitude": inc.longitude,
                "image_path": inc.image_path,
                "created_at": inc.created_at.isoformat(),
                "updated_at": inc.updated_at.isoformat(),
                # AI summary fields (null when not yet generated)
                "ai_summary": llm.summary if llm else None,
                "ai_risk_level": llm.risk_level if llm else None,
                "ai_warning": llm.warning if llm else None,
            }
        )

    return {"total": len(items), "items": items}


@router.get("/emergency-services", summary="Nearby emergency services from OpenStreetMap")
def get_emergency_services(
    lat: float = Query(..., description="Centre latitude"),
    lon: float = Query(..., description="Centre longitude"),
    radius: int = Query(5000, ge=500, le=50000, description="Search radius in metres"),
    category: Optional[str] = Query(
        None, description="Filter: hospital|fire_station|police|shelter"
    ),
) -> dict:
    """
    Query OpenStreetMap Overpass API for emergency services near a coordinate.
    Results are cached per (lat, lon, radius) for 1 hour.
    """
    services = _get_cached_services(lat, lon, radius)

    if category:
        services = [s for s in services if s["category"] == category]

    return {
        "centre": {"lat": lat, "lon": lon},
        "radius_m": radius,
        "total": len(services),
        "items": services,
    }
