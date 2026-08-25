import { Loader2 } from 'lucide-react'

export function FullPageLoader({ label = 'Loading' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950"
    >
      <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
        <Loader2 className="size-7 animate-spin text-brand-600" aria-hidden="true" />
        <p className="text-sm font-medium">{label}…</p>
      </div>
    </div>
  )
}
