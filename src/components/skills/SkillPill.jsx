import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '../common/Badge'

export function SkillPill({ skill, onEdit, onDelete }) {
  return (
    <div className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-slate-900 dark:text-slate-50">{skill.name}</p>
          <Badge tone={skill.type === 'offer' ? 'brand' : 'warning'}>{skill.category}</Badge>
        </div>
        {skill.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
            {skill.description}
          </p>
        )}
      </div>
      {(onEdit || onDelete) && (
        <div className="flex shrink-0 gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(skill)}
              aria-label={`Edit ${skill.name}`}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(skill)}
              aria-label={`Delete ${skill.name}`}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
