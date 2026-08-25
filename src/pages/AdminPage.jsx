import {
  Activity,
  BarChart3,
  Ban,
  CheckCircle2,
  Flag,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/common/Avatar'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { EmptyState } from '../components/common/EmptyState'
import { Input, Select } from '../components/common/Field'
import { PageHeader } from '../components/common/PageHeader'
import { ListSkeleton } from '../components/common/Skeleton'
import { SESSION_STATUS_LABELS } from '../lib/constants'
import { friendlyError } from '../lib/errors'
import { timeAgo } from '../lib/format'
import { deleteMessage, fetchAnalytics, listFlaggedMessages } from '../services/adminService'
import { listProfiles, setProfileStatus } from '../services/profileService'
import { listAllSessions } from '../services/sessionService'

const TABS = [
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'sessions', label: 'Sessions', icon: Activity },
  { key: 'flags', label: 'Flagged', icon: Flag },
]

function Metric({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function PopularList({ title, items }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      {items?.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.name} className="flex items-center justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-200">{item.name}</span>
              <Badge tone="brand">{item.count}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">No data yet.</p>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState('analytics')
  const [analytics, setAnalytics] = useState(null)
  const [users, setUsers] = useState([])
  const [sessions, setSessions] = useState([])
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pendingSuspension, setPendingSuspension] = useState(null)

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await listProfiles({ search, status: statusFilter }))
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }, [search, statusFilter])

  useEffect(() => {
    Promise.all([fetchAnalytics(), listAllSessions(), listFlaggedMessages()])
      .then(([analyticsRow, sessionRows, flagRows]) => {
        setAnalytics(analyticsRow)
        setSessions(sessionRows)
        setFlags(flagRows)
      })
      .catch((error) => toast.error(friendlyError(error)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = setTimeout(loadUsers, search ? 350 : 0)
    return () => clearTimeout(timer)
  }, [loadUsers, search])

  const toggleStatus = async (profile) => {
    const nextStatus = profile.status === 'suspended' ? 'active' : 'suspended'
    try {
      const updated = await setProfileStatus(profile.id, nextStatus)
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      toast.success(nextStatus === 'suspended' ? 'User suspended' : 'User reactivated')
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  const removeMessage = async (messageId) => {
    try {
      await deleteMessage(messageId)
      setFlags((current) => current.filter((item) => item.id !== messageId))
      toast.success('Message removed')
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  return (
    <div>
      <PageHeader
        title="Admin console"
        description="Platform health, moderation queue and user administration."
      />

      <div
        role="tablist"
        aria-label="Admin sections"
        className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
      >
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
              tab === item.key
                ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <item.icon className="size-4" aria-hidden="true" />
            {item.label}
            {item.key === 'flags' && flags.length > 0 && (
              <span className="rounded-full bg-rose-100 px-1.5 text-xs text-rose-700 dark:bg-rose-900 dark:text-rose-100">
                {flags.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton />
      ) : tab === 'analytics' ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Total users"
              value={analytics?.total_users ?? 0}
              hint={`${analytics?.suspended_users ?? 0} suspended`}
            />
            <Metric label="Daily active users" value={analytics?.daily_active_users ?? 0} />
            <Metric
              label="Sessions"
              value={analytics?.total_sessions ?? 0}
              hint={`${analytics?.completed_sessions ?? 0} completed`}
            />
            <Metric
              label="Request conversion"
              value={`${Math.round(analytics?.conversion_rate ?? 0)}%`}
              hint={`Avg response ${Math.round(analytics?.avg_response_hours ?? 0)}h`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PopularList title="Most offered skills" items={analytics?.popular_offered} />
            <PopularList title="Most requested skills" items={analytics?.popular_needed} />
          </div>
        </div>
      ) : tab === 'users' ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Search users"
              placeholder="Name or department"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label="Status"
              placeholder="All statuses"
              options={['active', 'suspended']}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            />
          </div>

          {users.length === 0 ? (
            <EmptyState icon={Search} title="No users match" description="Try another search." />
          ) : (
            <ul className="space-y-3">
              {users.map((profile) => (
                <li
                  key={profile.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar url={profile.avatar_url} name={profile.full_name} />
                    <div className="min-w-0">
                      <Link
                        to={`/profile/${profile.id}`}
                        className="block truncate font-semibold text-slate-900 hover:underline dark:text-slate-50"
                      >
                        {profile.full_name || 'Unnamed student'}
                      </Link>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {profile.department ?? 'No department'} · joined {timeAgo(profile.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.role === 'admin' && (
                      <Badge tone="brand" icon={ShieldCheck}>
                        Admin
                      </Badge>
                    )}
                    <Badge tone={profile.status === 'suspended' ? 'danger' : 'success'}>
                      {profile.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant={profile.status === 'suspended' ? 'success' : 'secondary'}
                      icon={profile.status === 'suspended' ? CheckCircle2 : Ban}
                      onClick={() =>
                        profile.status === 'suspended'
                          ? toggleStatus(profile)
                          : setPendingSuspension(profile)
                      }
                    >
                      {profile.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : tab === 'sessions' ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">All platform sessions</caption>
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3">Skill</th>
                <th scope="col" className="px-4 py-3">Requester</th>
                <th scope="col" className="px-4 py-3">Provider</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {session.skill?.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {session.requester?.full_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {session.provider?.full_name}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={session.status === 'escalated' ? 'danger' : 'neutral'}>
                      {SESSION_STATUS_LABELS[session.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {timeAgo(session.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : flags.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="Moderation queue is empty"
          description="Messages reported by students will appear here for review."
        />
      ) : (
        <ul className="space-y-3">
          {flags.map((message) => (
            <li
              key={message.id}
              className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900 dark:bg-rose-950/40"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar url={message.sender?.avatar_url} name={message.sender?.full_name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {message.sender?.full_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {timeAgo(message.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  onClick={() => removeMessage(message.id)}
                >
                  Delete
                </Button>
              </div>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{message.content}</p>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pendingSuspension)}
        onClose={() => setPendingSuspension(null)}
        onConfirm={() => toggleStatus(pendingSuspension)}
        title={`Suspend ${pendingSuspension?.full_name ?? 'this user'}?`}
        description="They will lose access to requests, sessions and messaging until reactivated."
        confirmLabel="Suspend user"
        variant="danger"
      />
    </div>
  )
}
