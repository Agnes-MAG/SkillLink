import clsx from 'clsx'

export function ProgressBar({ value, label, tone = 'brand', showValue = true }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value ?? 0)))
  const barTone = tone === 'success' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-brand-600'

  return (
    <div className="space-y-1.5">
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
          {label && <span>{label}</span>}
          {showValue && <span>{clamped}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      >
        <div
          className={clsx('h-full rounded-full transition-[width] duration-500', barTone)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
