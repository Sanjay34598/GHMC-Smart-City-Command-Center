import { motion } from 'framer-motion'
import type { Detection } from '@/lib/analyses'

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  High: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  Medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  Low: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  Unknown: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
}

type Props = {
  detection: Detection
  severity?: string | null
  index: number
}

export function DetectionCard({ detection, severity, index }: Props) {
  const pct = Math.round(detection.confidence * 100)
  const sevColor = SEVERITY_COLORS[severity ?? 'Unknown'] ?? SEVERITY_COLORS.Unknown

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-100">{detection.label}</p>
          {severity && index === 0 && (
            <span
              className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${sevColor}`}
            >
              {severity}
            </span>
          )}
        </div>
        <span className="shrink-0 text-lg font-bold tabular-nums text-cyan-300">{pct}%</span>
      </div>

      {/* Confidence bar */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: index * 0.07 + 0.2, duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            pct >= 85 ? 'bg-cyan-400' : pct >= 60 ? 'bg-amber-400' : 'bg-slate-500'
          }`}
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        bbox [{detection.bbox.join(', ')}]
      </p>
    </motion.div>
  )
}
