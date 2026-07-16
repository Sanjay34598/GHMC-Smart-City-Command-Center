import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, MapPin } from 'lucide-react'
import type { DashboardIncident } from '@/lib/dashboard'
import { getImageUrl } from '@/lib/analyses'

const SEVERITY_STYLES: Record<string, string> = {
  Critical: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  High: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  Medium: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  Low: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
}

const SEVERITY_DOT: Record<string, string> = {
  Critical: 'bg-rose-500',
  High: 'bg-orange-500',
  Medium: 'bg-amber-400',
  Low: 'bg-emerald-500',
}

type Props = { incidents: DashboardIncident[] }

export function IncidentFeed({ incidents }: Props) {
  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-600">
        <MapPin className="size-10 mb-3 opacity-30" />
        <p className="text-sm">No incidents match the current filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {incidents.map((inc, i) => (
        <motion.div
          key={inc.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
        >
          <Link
            to={`/incidents/${inc.id}`}
            className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 hover:bg-slate-900"
          >
            {/* Thumbnail */}
            <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-slate-700">
              <img
                src={getImageUrl(inc.image_path)}
                alt={inc.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22 fill=%22%231e293b%22%3E%3Crect width=%2256%22 height=%2256%22/%3E%3C/svg%3E'
                }}
              />
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLES[inc.severity] ?? 'border-slate-700 bg-slate-800 text-slate-400'}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${SEVERITY_DOT[inc.severity] ?? 'bg-slate-500'}`}
                  />
                  {inc.severity}
                </span>
                <span className="rounded border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400">
                  {inc.category}
                </span>
              </div>
              <p className="mt-1.5 truncate text-sm font-semibold text-white">{inc.title}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{inc.description}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {new Date(inc.created_at).toLocaleString()}
                </span>
                <span className="capitalize">{inc.status.replace('_', ' ')}</span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
