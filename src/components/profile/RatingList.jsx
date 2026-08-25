import { MessagesSquare } from 'lucide-react'
import { timeAgo } from '../../lib/format'
import { Avatar } from '../common/Avatar'
import { EmptyState } from '../common/EmptyState'
import { StarRating } from '../common/StarRating'

export function RatingList({ ratings }) {
  if (!ratings?.length) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="No reviews yet"
        description="Reviews appear here once completed exchanges are rated."
      />
    )
  }

  return (
    <ul className="space-y-3">
      {ratings.map((rating) => (
        <li
          key={rating.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <Avatar url={rating.rater?.avatar_url} name={rating.rater?.full_name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {rating.rater?.full_name || 'A student'}
              </p>
              <p className="text-xs text-slate-400">{timeAgo(rating.created_at)}</p>
            </div>
            <StarRating value={rating.score} size="sm" />
          </div>
          {rating.comment && (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{rating.comment}</p>
          )}
        </li>
      ))}
    </ul>
  )
}
