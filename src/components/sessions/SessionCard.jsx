import { Calendar, CheckCircle2, Clock, MessageSquare, Star, TriangleAlert, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SESSION_STATUS_LABELS } from '../../lib/constants'
import { formatDateTime, hoursUntil, timeAgo } from '../../lib/format'
import { Avatar } from '../common/Avatar'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'

const STATUS_TONES = {
  pending: 'warning',
  accepted: 'brand',
  completed_pending_rating: 'good',
  completed: 'success',
  declined: 'neutral',
  cancelled: 'neutral',
  expired: 'neutral',
  escalated: 'danger',
}

export function SessionCard({ session, userId, onAction, onRate }) {
  const isProvider = session.provider_id === userId
  const peer = isProvider ? session.requester : session.provider
  const alreadyRated = (session.ratings ?? []).some((rating) => rating.rater_id === userId)
  const expiresIn = session.status === 'pending' ? hoursUntil(session.expires_at) : null

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar url={peer?.avatar_url} name={peer?.full_name} />
          <div className="min-w-0">
            <Link
              to={`/profile/${peer?.id}`}
              className="block truncate font-semibold text-slate-900 hover:underline dark:text-slate-50"
            >
              {peer?.full_name}
            </Link>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {isProvider ? 'wants to learn' : 'can teach you'}{' '}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {session.skill?.name}
              </span>
            </p>
          </div>
        </div>
        <Badge tone={STATUS_TONES[session.status] ?? 'neutral'}>
          {SESSION_STATUS_LABELS[session.status]}
        </Badge>
      </div>

      {session.notes && (
        <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          {session.notes}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden="true" />
          Requested {timeAgo(session.created_at)}
        </span>
        {session.scheduled_at && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3.5" aria-hidden="true" />
            {formatDateTime(session.scheduled_at)}
          </span>
        )}
        {expiresIn !== null && expiresIn > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <TriangleAlert className="size-3.5" aria-hidden="true" />
            Expires in {expiresIn}h
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {session.status === 'pending' && isProvider && (
          <>
            <Button size="sm" icon={CheckCircle2} onClick={() => onAction(session, 'accepted')}>
              Accept
            </Button>
            <Button size="sm" variant="secondary" icon={X} onClick={() => onAction(session, 'declined')}>
              Decline
            </Button>
          </>
        )}
        {session.status === 'pending' && !isProvider && (
          <Button size="sm" variant="secondary" onClick={() => onAction(session, 'cancelled')}>
            Cancel request
          </Button>
        )}
        {session.status === 'accepted' && (
          <>
            <Button
              size="sm"
              variant="success"
              icon={CheckCircle2}
              onClick={() => onAction(session, 'completed_pending_rating')}
            >
              Mark completed
            </Button>
            <Link
              to={`/chat?session=${session.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
            >
              <MessageSquare className="size-4" aria-hidden="true" /> Message
            </Link>
            <Button size="sm" variant="ghost" onClick={() => onAction(session, 'cancelled')}>
              Cancel
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onAction(session, 'escalated')}>
              Report issue
            </Button>
          </>
        )}
        {(session.status === 'completed_pending_rating' || session.status === 'completed') &&
          !alreadyRated && (
            <Button size="sm" icon={Star} onClick={() => onRate(session)}>
              Rate partner
            </Button>
          )}
        {(session.status === 'completed_pending_rating' || session.status === 'completed') &&
          alreadyRated && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              You rated this exchange. Thanks!
            </span>
          )}
      </div>
    </article>
  )
}
