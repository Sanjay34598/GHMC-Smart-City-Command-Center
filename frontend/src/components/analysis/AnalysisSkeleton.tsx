/** Pulsing skeleton shown while the analysis pipeline is running. */
export function AnalysisSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Analyzing incident image">
      {/* Image placeholder */}
      <div className="h-64 w-full rounded-xl bg-slate-800/60" />

      {/* Status badge */}
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-2.5 rounded-full bg-cyan-400/50" />
        <div className="h-4 w-36 rounded bg-slate-700/60" />
      </div>

      {/* Detection cards */}
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-24 rounded bg-slate-700/60" />
            <div className="h-4 w-10 rounded bg-slate-700/60" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800" />
        </div>
      ))}
    </div>
  )
}
