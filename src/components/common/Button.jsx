import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 disabled:bg-brand-300 dark:disabled:bg-brand-800',
  secondary:
    'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-5 py-3 text-base gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150',
        'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        Icon && <Icon aria-hidden="true" className="size-4" />
      )}
      {children}
    </button>
  )
}
