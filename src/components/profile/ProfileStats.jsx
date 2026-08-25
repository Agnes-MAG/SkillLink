import { Star } from 'lucide-react'
import { trustBadges } from '../../lib/trust'
import { Badge } from '../common/Badge'
import { ProgressBar } from '../common/ProgressBar'
import { StarRating } from '../common/StarRating'

export function ProfileStats({ profile }) {
  const badges = trustBadges(profile)

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StarRating value={profile?.rating ?? 0} />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {Number(profile?.rating ?? 0).toFixed(1)}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            ({profile?.rating_count ?? 0} rating{profile?.rating_count === 1 ? '' : 's'})
          </span>
        </div>
        <Badge tone="neutral" icon={Star}>
          {profile?.completed_sessions ?? 0} exchanges
        </Badge>
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge key={badge.key} tone={badge.tone} icon={badge.icon}>
              {badge.label}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ProgressBar label="Response rate (24h)" value={profile?.response_rate ?? 0} tone="success" />
        <ProgressBar label="Completion rate" value={profile?.completion_rate ?? 0} />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Reliability score{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {Math.round(0.4 * (profile?.response_rate ?? 0) + 0.6 * (profile?.completion_rate ?? 0))}
          /100
        </span>{' '}
        — 40% response rate, 60% completion rate.
      </p>
    </div>
  )
}
