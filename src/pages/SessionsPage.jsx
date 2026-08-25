import { CalendarClock } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { EmptyState } from '../components/common/EmptyState'
import { PageHeader } from '../components/common/PageHeader'
import { ListSkeleton } from '../components/common/Skeleton'
import { RatingModal } from '../components/sessions/RatingModal'
import { SessionCard } from '../components/sessions/SessionCard'
import { useAuth } from '../hooks/useAuth'
import { SESSION_STATUS_LABELS } from '../lib/constants'
import { friendlyError } from '../lib/errors'
import { expireStaleSessions, listSessions, setSessionStatus } from '../services/sessionService'

const TABS = [
  { key: 'incoming', label: 'Incoming' },
  { key: 'outgoing', label: 'Sent' },
  { key: 'active', label: 'Active' },
  { key: 'history', label: 'History' },
]

const DESTRUCTIVE = ['declined', 'cancelled', 'escalated']

export default function SessionsPage() {
  const { user, refreshProfile } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('incoming')
  const [pendingAction, setPendingAction] = useState(null)
  const [rating, setRating] = useState(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      await expireStaleSessions()
      setSessions(await listSessions(user.id))
    } catch (error) {
      toast.error(friendlyError(error))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  const grouped = useMemo(
    () => ({
      incoming: sessions.filter((s) => s.provider_id === user?.id && s.status === 'pending'),
      outgoing: sessions.filter((s) => s.requester_id === user?.id && s.status === 'pending'),
      active: sessions.filter((s) => ['accepted', 'escalated'].includes(s.status)),
      history: sessions.filter((s) =>
        ['completed', 'completed_pending_rating', 'declined', 'cancelled', 'expired'].includes(
          s.status,
        ),
      ),
    }),
    [sessions, user?.id],
  )

  const applyStatus = async ({ session, status }) => {
    try {
      const updated = await setSessionStatus(session.id, status)
      setSessions((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      await refreshProfile()
      toast.success(`Session ${SESSION_STATUS_LABELS[status].toLowerCase()}`)
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  const handleAction = (session, status) => {
    if (DESTRUCTIVE.includes(status)) {
      setPendingAction({ session, status })
      return
    }
    applyStatus({ session, status })
  }

  const list = grouped[tab]

  return (
    <div>
      <PageHeader
        title="Sessions"
        description="Every exchange moves through request, acceptance, completion and rating."
      />

      <div
        role="tablist"
        aria-label="Session filters"
        className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
      >
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
              tab === item.key
                ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {item.label}
            {grouped[item.key].length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 text-xs text-brand-700 dark:bg-brand-900 dark:text-brand-100">
                {grouped[item.key].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nothing here yet"
          description={
            tab === 'incoming'
              ? 'Requests from other students will show up here.'
              : tab === 'outgoing'
                ? 'Head to Discover to request a skill from someone.'
                : tab === 'active'
                  ? 'Accepted sessions appear here until they are completed.'
                  : 'Completed and closed sessions will be archived here.'
          }
        />
      ) : (
        <div className="space-y-4">
          {list.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              userId={user.id}
              onAction={handleAction}
              onRate={setRating}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={async () => {
          await applyStatus(pendingAction)
          setPendingAction(null)
        }}
        title={
          pendingAction?.status === 'escalated'
            ? 'Report this session?'
            : `${pendingAction?.status === 'declined' ? 'Decline' : 'Cancel'} this session?`
        }
        description={
          pendingAction?.status === 'escalated'
            ? 'An administrator will review the exchange. Use this only for genuine problems.'
            : 'This cannot be undone. The other student will be notified.'
        }
        confirmLabel="Confirm"
        variant="danger"
      />

      <RatingModal
        session={rating}
        raterId={user?.id}
        onClose={() => setRating(null)}
        onRated={load}
      />
    </div>
  )
}
