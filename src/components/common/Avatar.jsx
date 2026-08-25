import clsx from 'clsx'
import { initials } from '../../lib/format'

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-lg',
  xl: 'size-24 text-2xl',
}

export function Avatar({ url, name, size = 'md', className }) {
  const classes = clsx(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700 ring-2 ring-white dark:bg-brand-900 dark:text-brand-100 dark:ring-slate-900',
    SIZES[size],
    className,
  )

  if (url) {
    return <img src={url} alt={name ? `${name}'s avatar` : 'Avatar'} className={classes} />
  }

  return (
    <span className={classes} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
