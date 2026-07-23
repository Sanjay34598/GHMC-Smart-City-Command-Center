"""Dashboard aggregate statistics and filtered incident listing endpoints."""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.incidents.models import Incident
from app.modules.analyses.models import Analysis, AnalysisStatus

router = APIRouter(prefix="/dashboard")


# ---------------------------------------------------------------------------
# Schemas (inline – lightweight, no need for a separate file)
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Stats endpoint
# ---------------------------------------------------------------------------


@router.get("/stats", summary="Aggregate dashboard statistics")
def get_dashboard_stats(db: Session = Depends(get_db)) -> dict:
    """Return incident counts grouped by status and severity."""
    total = db.query(func.count(Incident.id)).scalar() or 0
    active = (
        db.query(func.count(Incident.id))
        .filter(Incident.status.in_(["reported", "under_review", "responding"]))
        .scalar()
        or 0
    )
    critical = (
        db.query(func.count(Incident.id))
        .filter(Incident.severity == "Critical")
        .scalar()
        or 0
    )
    resolved = (
        db.query(func.count(Incident.id))
        .filter(Incident.status == "resolved")
        .scalar()
        or 0
    )
    pending_verification = (
        db.query(func.count(Incident.id))
        .filter(Incident.status.in_(["Pending Verification", "pending", "reported"]))
        .scalar()
        or 0
    )

    latest_obj = db.query(Incident).order_by(Incident.created_at.desc()).first()
    latest_incident = None
    if latest_obj:
        latest_incident = {
            "id": latest_obj.id,
            "title": latest_obj.title,
            "category": latest_obj.category,
            "severity": latest_obj.severity,
            "status": latest_obj.status,
            "created_at": latest_obj.created_at.isoformat(),
        }

    # Average processing time from completed analyses (ms → seconds)
    avg_ms = (
        db.query(func.avg(Analysis.processing_time))
        .filter(Analysis.status == AnalysisStatus.COMPLETED)
        .scalar()
    )
    avg_response_time = round(avg_ms / 1000, 2) if avg_ms else None

    # Severity distribution
    severity_rows = (
        db.query(Incident.severity, func.count(Incident.id))
        .group_by(Incident.severity)
        .all()
    )
    severity_distribution = [
        {"severity": row[0], "count": row[1]} for row in severity_rows
    ]

    # Category distribution
    category_rows = (
        db.query(Incident.category, func.count(Incident.id))
        .group_by(Incident.category)
        .all()
    )
    category_distribution = [
        {"category": row[0], "count": row[1]} for row in category_rows
    ]

    # Incidents over the past 7 days (daily trend)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    trend_rows = (
        db.query(
            func.date(Incident.created_at).label("day"),
            func.count(Incident.id).label("count"),
        )
        .filter(Incident.created_at >= seven_days_ago)
        .group_by(func.date(Incident.created_at))
        .order_by(func.date(Incident.created_at))
        .all()
    )
    daily_trend = [{"date": str(row.day), "count": row.count} for row in trend_rows]

    # Ward distribution
    ward_rows = (
        db.query(Incident.ward, func.count(Incident.id))
        .filter(Incident.ward.is_not(None))
        .group_by(Incident.ward)
        .all()
    )
    ward_distribution = [{"ward": row[0], "count": row[1]} for row in ward_rows]

    # Department distribution
    dept_rows = (
        db.query(Incident.department, func.count(Incident.id))
        .filter(Incident.department.is_not(None))
        .group_by(Incident.department)
        .all()
    )
    department_distribution = [{"department": row[0], "count": row[1]} for row in dept_rows]

    return {
        "total": total,
        "active": active,
        "critical": critical,
        "resolved": resolved,
        "pending_verification": pending_verification,
        "latest_incident": latest_incident,
        "avg_response_time": avg_response_time,
        "severity_distribution": severity_distribution,
        "category_distribution": category_distribution,
        "daily_trend": daily_trend,
        "ward_distribution": ward_distribution,
        "department_distribution": department_distribution,
    }


# ---------------------------------------------------------------------------
# Recent incidents with optional filtering
# ---------------------------------------------------------------------------


@router.get("/incidents", summary="Filtered, paginated incident list for dashboard")
def get_dashboard_incidents(
    db: Session = Depends(get_db),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Full-text search on title/description"),
    is_civic_issue: Optional[bool] = Query(None, description="Filter by civic issue vs emergency"),
    days: Optional[int] = Query(None, description="Only incidents from last N days"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> dict:
    """Return filtered incidents newest-first with total count for pagination."""
    q = db.query(Incident)

    if severity:
        q = q.filter(Incident.severity == severity)
    if category:
        q = q.filter(Incident.category == category)
    if status:
        q = q.filter(Incident.status == status)
    if search:
        term = f"%{search}%"
        q = q.filter(
            Incident.title.ilike(term) | Incident.description.ilike(term)
        )
    if is_civic_issue is not None:
        q = q.filter(Incident.is_civic_issue == is_civic_issue)
    if days:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        q = q.filter(Incident.created_at >= cutoff)

    total = q.count()
    incidents = (
        q.order_by(Incident.created_at.desc()).offset(offset).limit(limit).all()
    )

    return {
        "total": total,
        "items": [
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
                "is_civic_issue": inc.is_civic_issue,
                "ward": inc.ward,
                "department": inc.department,
                "estimated_resolution": inc.estimated_resolution,
                "created_at": inc.created_at.isoformat(),
                "updated_at": inc.updated_at.isoformat(),
            }
            for inc in incidents
        ],
    }
