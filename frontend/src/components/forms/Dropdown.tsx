import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Option = { label: string; value: string }
type DropdownProps = SelectHTMLAttributes<HTMLSelectElement> & { options: Option[]; error?: boolean }

export function Dropdown({ options, className, error, ...props }: DropdownProps) {
  return <div className="relative"><select className={cn('h-11 w-full appearance-none rounded-lg border bg-slate-950/60 px-3 pr-10 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20', error ? 'border-red-500' : 'border-slate-700', className)} aria-invalid={error} {...props}>{options.map((option) => <option key={option.value} value={option.value} className="bg-slate-900">{option.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-5 text-slate-400" /></div>
}
