import { MessagesSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { ChatWindow } from '../components/chat/ChatWindow'
import { Avatar } from '../components/common/Avatar'
import { EmptyState } from '../components/common/EmptyState'
import { PageHeader } from '../components/common/PageHeader'
import { ListSkeleton } from '../components/common/Skeleton'
import { useAuth } from '../hooks/useAuth'
import { friendlyError } from '../lib/errors'
import { listChatThreads } from '../services/chatService'

export default function ChatPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  const activeId = searchParams.get('session')
  const active = threads.find((thread) => thread.id === activeId) ?? null

  useEffect(() => {
    if (!user?.id) return
    listChatThreads(user.id)
      .then(setThreads)
      .catch((error) => toast.error(friendlyError(error)))
      .finally(() => setLoading(false))
  }, [user?.id])

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Chat unlocks once a request is accepted, and stays available afterwards."
      />

      {loading ? (
        <ListSkeleton />
      ) : threads.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No conversations yet"
          description="Accept or send a skill request to start chatting with a study partner."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
          <ul className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto">
            {threads.map((thread) => {
              const peer = thread.requester?.id === user.id ? thread.provider : thread.requester
              const selected = thread.id === activeId
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => setSearchParams({ session: thread.id })}
                    aria-current={selected ? 'true' : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      selected
                        ? 'border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-950'
                        : 'border-slate-200 bg-white hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <Avatar url={peer?.avatar_url} name={peer?.full_name} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {peer?.full_name}
                      </span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        {thread.skill?.name}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {active ? (
            <ChatWindow key={active.id} thread={active} userId={user.id} />
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title="Select a conversation"
              description="Pick a session on the left to open the chat."
            />
          )}
        </div>
      )}
    </div>
  )
}
