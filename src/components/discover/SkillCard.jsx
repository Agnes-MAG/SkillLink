import { Clock, MapPin, Send, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { matchLabel } from '../../lib/matching'
import { trustBadges } from '../../lib/trust'
import { Avatar } from '../common/Avatar'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'

export function SkillCard({ match, onRequest }) {
  const { skill, score, tier, matchedNeed } = match
  const owner = skill.owner
  const label = matchLabel(score)
  const badges = trustBadges(owner).slice(0, 2)

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar url={owner?.avatar_url} name={owner?.full_name} />
          <div className="min-w-0">
            <Link
              to={`/profile/${owner?.id}`}
              className="block truncate font-semibold text-slate-900 hover:underline dark:text-slate-50"
            >
              {owner?.full_name}
            </Link>
            <p className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="size-3" aria-hidden="true" />
              {owner?.department} · {owner?.year} year
            </p>
          </div>
        </div>
        <Badge tone={label.tone}>{score}% {label.label}</Badge>
      </div>

      <div className="mt-4 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-slate-50">{skill.name}</h3>
          <Badge tone="brand">{skill.category}</Badge>
        </div>
        <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
          {skill.description}
        </p>
        {matchedNeed && (
          <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-950 dark:text-brand-200">
            {tier === 'exact'
              ? `Exactly matches your need: ${matchedNeed.name}`
              : tier === 'related'
                ? `Related to your need: ${matchedNeed.name}`
                : `Same category as your need: ${matchedNeed.name}`}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
          {Number(owner?.rating ?? 0).toFixed(1)} ({owner?.rating_count ?? 0})
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden="true" />
          {owner?.avg_response_hours ? `~${Math.round(owner.avg_response_hours)}h reply` : 'New member'}
        </span>
        {badges.map((badge) => (
          <Badge key={badge.key} tone={badge.tone} icon={badge.icon}>
            {badge.label}
          </Badge>
        ))}
      </div>

      <Button
        className="mt-5 w-full"
        icon={Send}
        disabled={!owner?.accepting_requests}
        onClick={() => onRequest(match)}
      >
        {owner?.accepting_requests ? 'Request this skill' : 'Not accepting requests'}
      </Button>
    </article>
  )
}
