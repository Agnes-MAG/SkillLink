import clsx from 'clsx'
import { useId } from 'react'

const CONTROL_CLASSES =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-brand-900'

function Wrapper({ id, label, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  )
}

export function Input({ label, error, hint, className, ...props }) {
  const generatedId = useId()
  const id = props.id ?? generatedId
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={clsx(CONTROL_CLASSES, error && 'border-rose-400 focus:ring-rose-200', className)}
        {...props}
      />
    </Wrapper>
  )
}

export function Textarea({ label, error, hint, className, ...props }) {
  const generatedId = useId()
  const id = props.id ?? generatedId
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={clsx(CONTROL_CLASSES, 'min-h-24 resize-y', error && 'border-rose-400', className)}
        {...props}
      />
    </Wrapper>
  )
}

export function Select({ label, error, hint, options = [], placeholder, className, ...props }) {
  const generatedId = useId()
  const id = props.id ?? generatedId
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <select
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={clsx(CONTROL_CLASSES, error && 'border-rose-400', className)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Wrapper>
  )
}
