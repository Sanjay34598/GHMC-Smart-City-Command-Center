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
  const first = incidents.length > 0 ? incidents[0] : null
  const firstLat = first ? (typeof first.latitude === 'number' ? first.latitude : parseFloat(first.latitude as unknown as string)) : 17.3850
  const firstLng = first ? (typeof first.longitude === 'number' ? first.longitude : parseFloat(first.longitude as unknown as string)) : 78.4867
  const center: [number, number] = [isNaN(firstLat) ? 17.3850 : firstLat, isNaN(firstLng) ? 78.4867 : firstLng]

  return (
    <MapContainer
      center={center}
      zoom={incidents.length > 0 ? 11 : 3}
      style={{ height: '100%', width: '100%' }}
      className="z-0 bg-[#0d1117]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidents.map((inc) => {
        const lat = typeof inc.latitude === 'number' ? inc.latitude : parseFloat(inc.latitude as unknown as string)
        const lng = typeof inc.longitude === 'number' ? inc.longitude : parseFloat(inc.longitude as unknown as string)
        if (isNaN(lat) || isNaN(lng)) return null

        return (
          <CircleMarker
            key={inc.id}
            center={[lat, lng]}
            radius={inc.severity === 'Critical' ? 14 : inc.severity === 'High' ? 11 : 8}
            pathOptions={{
              color: SEVERITY_COLOR[inc.severity] ?? '#64748b',
              fillColor: SEVERITY_COLOR[inc.severity] ?? '#64748b',
              fillOpacity: 0.75,
              weight: 2,
            }}
          >
            <Popup>
              <div className="min-w-[200px] bg-primary text-textPrimary p-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono font-bold text-textSecondary uppercase tracking-widest">{inc.id}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${inc.severity === 'Critical' ? 'bg-critical/10 text-critical border border-critical/20' : inc.severity === 'High' ? 'bg-high/10 text-high border border-high/20' : 'bg-medium/10 text-medium border border-medium/20'}`}>
                    {inc.severity}
                  </span>
                </div>
                <p className="font-bold text-sm mb-2">{inc.title}</p>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-textSecondary uppercase tracking-widest text-[8px]">Status</span>
                    <span className="font-mono text-high">{inc.status}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-textSecondary uppercase tracking-widest text-[8px]">Ward</span>
                    <span className="font-mono">{inc.ward || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 col-span-2">
                    <span className="font-bold text-textSecondary uppercase tracking-widest text-[8px]">Department</span>
                    <span className="font-mono">{inc.department || 'Unassigned'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 col-span-2">
                    <span className="font-bold text-textSecondary uppercase tracking-widest text-[8px]">Created Time</span>
                    <span className="font-mono text-textSecondary">{new Date(inc.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <Link
                  to={`/incidents/${inc.id}`}
                  className="block text-center bg-info/10 border border-info/30 text-info py-1 text-[9px] font-bold uppercase tracking-widest hover:bg-info hover:text-white transition-colors"
                >
                  View Incident
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
