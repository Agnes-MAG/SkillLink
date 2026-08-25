import clsx from 'clsx'

const TONES = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-100',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-100',
  excellent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100',
  good: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-100',
  possible: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export function Badge({ tone = 'neutral', icon: Icon, children, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        TONES[tone] ?? TONES.neutral,
        className,
      )}
    >
      {Icon && <Icon aria-hidden="true" className="size-3.5" />}
      {children}
    </span>
  )
}
