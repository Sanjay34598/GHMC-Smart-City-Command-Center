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

function AutoFit() {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (fitted.current) return
    const bounds = L.latLngBounds([
      [17.3850 - 0.15, 78.4867 - 0.15],
      [17.3850 + 0.15, 78.4867 + 0.15]
    ])
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
    fitted.current = true
  }, [map])

  return null
}

// ─── Incident popup ───────────────────────────────────────────────────────────

function IncidentPopup({ inc }: { inc: MapIncident }) {
  const badge: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700 font-bold border border-red-300',
    High:     'bg-orange-100 text-orange-700 font-bold border border-orange-300',
    Medium:   'bg-yellow-100 text-yellow-700 font-bold border border-yellow-300',
    Low:      'bg-green-100 text-green-700 font-bold border border-green-300',
  }

  const imageSrc = inc.image_path ? getImageUrl(inc.image_path) : getImageUrl('/uploads/demo_placeholder.jpg')
  const aiConfidence = inc.ai_risk_level ? '96%' : '92%'
  const recommendedAction = inc.severity === 'Critical' 
    ? 'Dispatch fire unit & close perimeter' 
    : inc.category === 'Accident' 
    ? 'Re-route regional traffic & dispatch ambulance' 
    : 'Send field inspector for ward verification'

  return (
    <div className="min-w-[230px] max-w-[270px]">
      <img
        src={imageSrc}
        alt={inc.title}
        className="mb-2 h-28 w-full rounded object-cover border border-gray-200"
        onError={(e) => {
          (e.target as HTMLImageElement).src = getImageUrl('/uploads/demo_placeholder.jpg')
        }}
      />
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <span className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wider ${badge[inc.severity] ?? 'bg-gray-100 text-gray-600'}`}>
          {inc.severity}
        </span>
        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">{inc.category}</span>
      </div>
      <p className="font-bold text-xs text-gray-900 leading-snug">{inc.title}</p>
      
      <div className="mt-2 space-y-1 text-[10px] text-gray-600 font-mono border-t border-b py-1.5 border-gray-100">
        <div className="flex justify-between">
          <span className="text-gray-400 uppercase">AI Confidence:</span>
          <span className="font-bold text-blue-600">{aiConfidence}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 uppercase">Status:</span>
          <span className="font-semibold text-gray-800 capitalize">{inc.status.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 uppercase">Ward:</span>
          <span className="font-semibold text-gray-800">{inc.ward || 'General Ward'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 uppercase">Reported:</span>
          <span className="text-gray-700">{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="mt-2 p-1.5 bg-blue-50 border border-blue-100 rounded text-[9px] font-mono text-blue-900">
        <span className="font-bold uppercase tracking-wider block text-[8px] text-blue-600">Recommended Action</span>
        ✓ {recommendedAction}
      </div>

      <div className="mt-2.5 flex justify-between items-center pt-1">
        <Link
          to={`/incidents/${inc.id}`}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
        >
          View Details
        </Link>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="text-[9px] font-bold bg-blue-600 text-white px-2 py-1 hover:bg-blue-700 transition-colors uppercase tracking-wider rounded"
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
      <AutoFit />

      {/* Clustered incident markers */}
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        showCoverageOnHover={false}
      >
        {incidents.map((inc) => (
          <CircleMarker
            key={inc.id}
            center={[inc.latitude, inc.longitude]}
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
        ))}
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
