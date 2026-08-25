import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
          <Compass className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-bold text-slate-900 dark:text-slate-50">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          The page you are looking for does not exist or has moved.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
