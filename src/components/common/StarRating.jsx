import clsx from 'clsx'
import { Star } from 'lucide-react'

export function StarRating({ value = 0, onChange, size = 'md', label }) {
  const readOnly = !onChange
  const starSize = size === 'lg' ? 'size-7' : size === 'sm' ? 'size-3.5' : 'size-5'

  if (readOnly) {
    return (
      <span className="inline-flex items-center gap-0.5" aria-label={label ?? `${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            aria-hidden="true"
            className={clsx(
              starSize,
              star <= Math.round(value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300 dark:text-slate-600',
            )}
          />
        ))}
      </span>
    )
  }

  return (
    <div role="radiogroup" aria-label={label ?? 'Rating'} className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          onClick={() => onChange(star)}
          className="rounded-md p-0.5 transition hover:scale-110"
        >
          <Star
            aria-hidden="true"
            className={clsx(
              starSize,
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600',
            )}
          />
        </button>
      ))}
    </div>
  )
}
