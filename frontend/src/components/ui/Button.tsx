import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: 'primary' | 'secondary' }
export function Button({ children, className, variant = 'primary', ...props }: Props) {
  return <button className={cn('inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50', variant === 'primary' ? 'bg-primary text-white hover:bg-blue-500' : 'border border-slate-700 bg-slate-900/60 text-slate-100 hover:border-slate-500 hover:bg-slate-800', className)} {...props}>{children}</button>
}
