import clsx from 'clsx'

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={clsx('skeleton h-4 w-full', className)} />
}

export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-1/2" />
          <Skeleton className="w-1/3" />
        </div>
      </div>
      <Skeleton className="w-full" />
      <Skeleton className="w-2/3" />
    </div>
  )
}

export function ListSkeleton({ count = 3 }) {
  return (
    <div role="status" aria-live="polite" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  )
}
