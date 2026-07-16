import { motion } from 'framer-motion'

/**
 * Skeleton shimmer for cards that are still loading.
 */
export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Stat cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-slate-800 bg-slate-900/50" />
        ))}
      </div>
      {/* Content rows */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          <div className="h-72 rounded-xl border border-slate-800 bg-slate-900/50" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-slate-800 bg-slate-900/50" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-56 rounded-xl border border-slate-800 bg-slate-900/50" />
          <div className="h-56 rounded-xl border border-slate-800 bg-slate-900/50" />
        </div>
      </div>
    </div>
  )
}

/** Shimmer for individual feed items */
export function FeedSkeleton() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="animate-pulse space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4"
        >
          <div className="size-14 shrink-0 rounded-lg bg-slate-800" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-2/5 rounded bg-slate-800" />
            <div className="h-3 w-4/5 rounded bg-slate-800" />
            <div className="h-3 w-3/5 rounded bg-slate-800" />
          </div>
        </div>
      ))}
    </motion.div>
  )
}
