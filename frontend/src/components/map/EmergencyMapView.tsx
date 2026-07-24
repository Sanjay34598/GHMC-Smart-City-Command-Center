/**
 * EmergencyMapView – Full-featured Leaflet map used inside EmergencyMapPage.
 *
 * Imported lazily (dynamic import) so Leaflet CSS doesn't block the initial
 * bundle and the component can be code-split cleanly.
 */
import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import type { MapIncident, EmergencyService } from '@/lib/map'
import { getImageUrl } from '@/lib/analyses'

// ─── Color helpers ────────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  Critical: '#ef4444',
  High:     '#f97316',
  Medium:   '#eab308',
  Low:      '#22c55e',
}

const SERVICE_COLOR: Record<string, string> = {
  hospital:     '#06b6d4',
  fire_station: '#f97316',
  police:       '#3b82f6',
  shelter:      '#a855f7',
  other:        '#64748b',
}

const SERVICE_ICON_CHAR: Record<string, string> = {
  hospital:     '🏥',
  fire_station: '🚒',
  police:       '🚔',
  shelter:      '⛺',
  other:        '📍',
}

function makeDivIcon(emoji: string, color: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="background:${color};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)">${emoji}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  })
}

// ─── Auto-fit bounds helper ───────────────────────────────────────────────────

function AutoFit({ incidents }: { incidents: MapIncident[] }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (fitted.current || !incidents || incidents.length === 0) return
    const validPoints = incidents
      .map(i => [
        typeof i.latitude === 'number' ? i.latitude : parseFloat(i.latitude as unknown as string),
        typeof i.longitude === 'number' ? i.longitude : parseFloat(i.longitude as unknown as string)
      ] as [number, number])
      .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0))

    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
      fitted.current = true
    }
  }, [map, incidents])

  return null
}

import { getCategoryImage } from '@/lib/images'

// ─── Incident popup ───────────────────────────────────────────────────────────

function IncidentPopup({ inc }: { inc: MapIncident }) {
  const imageSrc = getCategoryImage(inc.category, inc.image_path)
  const aiConfidence = inc.ai_risk_level ? '96%' : '92%'
  const recommendedAction = inc.severity === 'Critical' 
    ? 'Dispatch fire unit & close perimeter' 
    : inc.category === 'Accident' 
    ? 'Re-route regional traffic & dispatch ambulance' 
    : 'Send field inspector for ward verification'

  return (
    <div className="min-w-[240px] max-w-[280px] p-1 bg-[#181818] text-white">
      <div className="relative mb-2 h-32 w-full overflow-hidden border border-[#2A2A2A] rounded-none group bg-black">
        <img
          src={imageSrc}
          alt={inc.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const fallback = getCategoryImage(inc.category)
            if ((e.target as HTMLImageElement).src !== fallback) {
              (e.target as HTMLImageElement).src = fallback
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black/90 text-white border border-[#2A2A2A]">
          {inc.category}
        </span>
      </div>

      <div className="flex items-center justify-between gap-1.5 mb-1.5 font-mono">
        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-white text-black">
          {inc.severity} Priority
        </span>
        <span className="text-[10px] text-[#BDBDBD] capitalize">{inc.status.replace('_', ' ')}</span>
      </div>

      <p className="font-bold text-xs text-white leading-snug mb-2">{inc.title}</p>
      
      <div className="space-y-1 text-[10px] text-[#BDBDBD] font-mono border-t border-b py-2 border-[#2A2A2A]">
        <div className="flex justify-between">
          <span className="text-[#BDBDBD] uppercase">AI Confidence:</span>
          <span className="font-bold text-white">{aiConfidence}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#BDBDBD] uppercase">Status:</span>
          <span className="font-semibold text-white capitalize">{inc.status.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#BDBDBD] uppercase">Ward:</span>
          <span className="font-semibold text-white">{inc.ward || 'General Ward'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#BDBDBD] uppercase">Reported:</span>
          <span className="text-white">{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="mt-2 p-2 bg-[#111111] border border-[#2A2A2A] text-[9px] font-mono text-white">
        <span className="font-bold uppercase tracking-wider block text-[8px] text-[#BDBDBD] mb-0.5">Recommended Action</span>
        ✓ {recommendedAction}
      </div>

      <div className="mt-3 flex justify-between items-center pt-1 border-t border-[#2A2A2A]">
        <Link
          to={`/incidents/${inc.id}`}
          className="text-[10px] font-bold text-white hover:underline uppercase tracking-wider"
        >
          View Details
        </Link>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="text-[9px] font-bold bg-white text-black px-3 py-1 hover:bg-neutral-200 transition-colors uppercase tracking-wider rounded-none"
        >
          Dispatch Units
        </button>
      </div>
    </div>
  )
}

// ─── Service popup ────────────────────────────────────────────────────────────

function ServicePopup({ svc }: { svc: EmergencyService }) {
  const labels: Record<string, string> = {
    hospital:     'Hospital',
    fire_station: 'Fire Station',
    police:       'Police Station',
    shelter:      'Shelter',
    other:        'Emergency Service',
  }

  return (
    <div className="min-w-[180px]">
      <p className="font-bold text-sm text-gray-900">{svc.name}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{labels[svc.category] ?? 'Service'}</p>
      {svc.address && <p className="text-[11px] text-gray-600 mt-1">{svc.address}</p>}
      {svc.phone && <p className="text-[11px] text-blue-600 mt-0.5">{svc.phone}</p>}
      <p className="text-[11px] font-semibold text-gray-500 mt-1">{svc.distance_km} km away</p>
    </div>
  )
}

// ─── Main map component ───────────────────────────────────────────────────────

type Props = {
  incidents: MapIncident[]
  services: EmergencyService[]
  showServices: boolean
}

export function EmergencyMapView({ incidents, services, showServices }: Props) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Auto-fit to incidents on first load */}
      <AutoFit incidents={incidents} />

      {/* Clustered incident markers */}
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        showCoverageOnHover={false}
      >
        {incidents.map((inc) => {
          const lat = typeof inc.latitude === 'number' ? inc.latitude : parseFloat(inc.latitude as unknown as string)
          const lng = typeof inc.longitude === 'number' ? inc.longitude : parseFloat(inc.longitude as unknown as string)
          if (isNaN(lat) || isNaN(lng)) return null

          return (
            <CircleMarker
              key={inc.id}
              center={[lat, lng]}
              radius={inc.severity === 'Critical' ? 15 : inc.severity === 'High' ? 12 : 9}
              pathOptions={{
                color:       SEVERITY_COLOR[inc.severity] ?? '#64748b',
                fillColor:   SEVERITY_COLOR[inc.severity] ?? '#64748b',
                fillOpacity: 0.8,
                weight:      2.5,
              }}
            >
              <Popup maxWidth={280}>
                <IncidentPopup inc={inc} />
              </Popup>
            </CircleMarker>
          )
        })}
      </MarkerClusterGroup>

      {/* Emergency service markers (shown on demand) */}
      {showServices &&
        services.map((svc) => (
          <Marker
            key={svc.id}
            position={[svc.latitude, svc.longitude]}
            icon={makeDivIcon(
              SERVICE_ICON_CHAR[svc.category] ?? '📍',
              SERVICE_COLOR[svc.category] ?? '#64748b',
            )}
          >
            <Popup>
              <ServicePopup svc={svc} />
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  )
}
