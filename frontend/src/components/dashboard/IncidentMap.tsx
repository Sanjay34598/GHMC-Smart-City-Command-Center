import 'leaflet/dist/leaflet.css'
import 'leaflet-defaulticon-compatibility'
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import type { DashboardIncident } from '@/lib/dashboard'

const SEVERITY_COLOR: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
}

type Props = {
  incidents: DashboardIncident[]
}

export function IncidentMap({ incidents }: Props) {
  const center: [number, number] =
    incidents.length > 0
      ? [incidents[0].latitude, incidents[0].longitude]
      : [20, 0]

  return (
    <MapContainer
      center={center}
      zoom={incidents.length > 0 ? 5 : 2}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidents.map((inc) => (
        <CircleMarker
          key={inc.id}
          center={[inc.latitude, inc.longitude]}
          radius={inc.severity === 'Critical' ? 14 : inc.severity === 'High' ? 11 : 8}
          pathOptions={{
            color: SEVERITY_COLOR[inc.severity] ?? '#64748b',
            fillColor: SEVERITY_COLOR[inc.severity] ?? '#64748b',
            fillOpacity: 0.75,
            weight: 2,
          }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <p className="font-bold text-sm">{inc.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{inc.category} · {inc.severity}</p>
              <Link
                to={`/incidents/${inc.id}`}
                className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
              >
                View details →
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
