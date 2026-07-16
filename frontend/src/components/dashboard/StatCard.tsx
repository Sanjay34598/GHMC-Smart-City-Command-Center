import { motion } from 'framer-motion'

type Props = {
  label: string
  value: string | number | null
  sub?: string
  icon: React.ElementType
  color: string
  index?: number
}

export function StatCard({ label, value, sub, icon: Icon, color, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-white">
            {value ?? <span className="text-slate-600">—</span>}
          </p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl"
          style={{ background: color + '22', color }}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </motion.div>
  )
}
