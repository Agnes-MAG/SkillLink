import {
  ArrowRight,
  CalendarClock,
  Inbox,
  MessagesSquare,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { PageHeader } from '../components/common/PageHeader'
import { ProgressBar } from '../components/common/ProgressBar'
import { CardSkeleton } from '../components/common/Skeleton'
import { SkillCard } from '../components/discover/SkillCard'
import { RequestModal } from '../components/discover/RequestModal'
import { SessionCard } from '../components/sessions/SessionCard'
import { useAuth } from '../hooks/useAuth'
import { friendlyError } from '../lib/errors'
import { scoreMatch } from '../lib/matching'
import { profileCompletion } from '../lib/profileCompletion'
import { listSessions, setSessionStatus } from '../services/sessionService'
import { listMySkills, listOfferedSkills, listSkillRelations } from '../services/skillService'

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/60 dark:text-brand-200">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [sessions, setSessions] = useState([])
  const [skills, setSkills] = useState([])
  const [offers, setOffers] = useState([])
  const [relations, setRelations] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      listSessions(user.id),
      listMySkills(user.id),
      listOfferedSkills({ excludeUserId: user.id }),
      listSkillRelations(),
    ])
      .then(([sessionRows, skillRows, offerRows, relationRows]) => {
        setSessions(sessionRows)
        setSkills(skillRows)
        setOffers(offerRows)
        setRelations(relationRows)
      })
      .catch((error) => toast.error(friendlyError(error)))
      .finally(() => setLoading(false))
  }, [user?.id])

  const incoming = sessions.filter((s) => s.provider_id === user?.id && s.status === 'pending')
  const activeSessions = sessions.filter((s) => s.status === 'accepted')
  const awaitingRating = sessions.filter(
    (s) =>
      s.status === 'completed_pending_rating' &&
      !(s.ratings ?? []).some((rating) => rating.rater_id === user?.id),
  )
  const completion = profileCompletion(profile, skills)

  const recommendations = useMemo(() => {
    const needs = skills.filter((skill) => skill.type === 'need')
    return offers
      .map((skill) => ({
        skill,
        ...scoreMatch({
          offeredSkill: skill,
          provider: skill.owner,
          viewer: profile,
          neededSkills: needs,
          relations,
        }),
      }))
      .filter((match) => match.tier)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }, [offers, skills, profile, relations])

  const handleAction = async (session, status) => {
    try {
      const updated = await setSessionStatus(session.id, status)
      setSessions((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      await refreshProfile()
      toast.success('Session updated')
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${profile?.full_name?.split(' ')[0] ?? 'student'}`}
        description="Here is what needs your attention today."
        action={
          <Link
            to="/discover"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Discover skills
          </Link>
        }
      />

      {completion.score < 60 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Your profile is {completion.score}% complete
              </p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                Complete profiles get up to 3× more requests. Next: {completion.missing[0]?.label}.
              </p>
              <div className="mt-3 max-w-sm">
                <ProgressBar value={completion.score} tone="amber" showValue={false} />
              </div>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Complete profile <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Inbox} label="Pending requests" value={incoming.length} hint="Awaiting your reply" />
        <StatCard icon={CalendarClock} label="Active sessions" value={activeSessions.length} />
        <StatCard
          icon={Star}
          label="Average rating"
          value={Number(profile?.rating ?? 0).toFixed(1)}
          hint={`${profile?.rating_count ?? 0} ratings`}
        />
        <StatCard
          icon={TrendingUp}
          label="Completed exchanges"
          value={profile?.completed_sessions ?? 0}
          hint={`${Math.round(profile?.completion_rate ?? 0)}% completion rate`}
        />
      </div>

      {awaitingRating.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-50">
            Waiting on your rating
          </h2>
          <div className="space-y-4">
            {awaitingRating.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                userId={user.id}
                onAction={handleAction}
                onRate={() => {}}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Requests to review
          </h2>
          <Link
            to="/sessions"
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            View all sessions
          </Link>
        </div>
        {loading ? (
          <CardSkeleton />
        ) : incoming.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title="No pending requests"
            description="When another student requests one of your skills it will appear here."
          />
        ) : (
          <div className="space-y-4">
            {incoming.slice(0, 3).map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                userId={user.id}
                onAction={handleAction}
                onRate={() => {}}
              />
            ))}
          </div>
        )}
      </section>

      {recommendations.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-50">
            Recommended for you
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((match) => (
              <SkillCard key={match.skill.id} match={match} onRequest={setActive} />
            ))}
          </div>
        </section>
      )}

      <RequestModal match={active} requesterId={user?.id} onClose={() => setActive(null)} />
    </div>
  )
}
