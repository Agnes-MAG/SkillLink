import { Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Logo({ to = '/dashboard' }) {
  return (
    <Link to={to} className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-md shadow-brand-500/30">
        <Link2 className="size-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Skill<span className="text-brand-600 dark:text-brand-400">Link</span>
      </span>
    </Link>
  )
}
