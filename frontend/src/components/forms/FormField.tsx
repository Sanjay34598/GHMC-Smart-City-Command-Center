import type { ReactNode } from 'react'

type FormFieldProps = { id: string; label: string; hint?: string; error?: string; children: ReactNode }

export function FormField({ id, label, hint, error, children }: FormFieldProps) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-200">{label}</label>{children}{hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}{error && <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-400" role="alert">{error}</p>}</div>
}
