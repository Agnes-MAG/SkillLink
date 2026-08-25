export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/50">
      {Icon && (
        <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-200">
          <Icon className="size-7" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
