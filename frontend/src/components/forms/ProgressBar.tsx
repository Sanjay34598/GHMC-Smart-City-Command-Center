type ProgressBarProps = { value: number; label?: string }

export function ProgressBar({ value, label = 'Uploading report image' }: ProgressBarProps) {
  return <div aria-label={label}><div className="mb-2 flex justify-between text-xs text-slate-400"><span>{label}</span><span>{Math.round(value)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-300" style={{ width: `${value}%` }} /></div></div>
}
