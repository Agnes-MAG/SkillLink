import { Flag, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages'
import { friendlyError } from '../../lib/errors'
import { timeAgo } from '../../lib/format'
import { flagMessage, markThreadRead } from '../../services/chatService'
import { Avatar } from '../common/Avatar'
import { Button } from '../common/Button'
import { ListSkeleton } from '../common/Skeleton'

export function ChatWindow({ thread, userId }) {
  const { messages, loading, peerTyping, send, notifyTyping } = useRealtimeMessages(thread.id, userId)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const peer = thread.requester?.id === userId ? thread.provider : thread.requester

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, peerTyping])

  useEffect(() => {
    markThreadRead(thread.id, userId).catch(() => {})
  }, [thread.id, userId, messages.length])

  const submit = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content) return
    setSending(true)
    try {
      await send(content)
      setDraft('')
    } catch (error) {
      toast.error(friendlyError(error))
    } finally {
      setSending(false)
    }
  }

  const report = async (messageId) => {
    try {
      await flagMessage(messageId)
      toast.success('Message reported to moderators')
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
        <Avatar url={peer?.avatar_url} name={peer?.full_name} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900 dark:text-slate-50">
            {peer?.full_name}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{thread.skill?.name}</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <ListSkeleton count={3} />
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            Say hello and agree on a time and place to meet.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === userId
            return (
              <div key={message.id} className={`group flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%]">
                  <div
                    className={`animate-slide-up rounded-2xl px-4 py-2.5 text-sm ${
                      mine
                        ? 'rounded-br-sm bg-brand-600 text-white'
                        : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {message.content}
                  </div>
                  <div
                    className={`mt-1 flex items-center gap-2 text-[11px] text-slate-400 ${mine ? 'justify-end' : ''}`}
                  >
                    <span>{timeAgo(message.created_at)}</span>
                    {mine && message.is_read && <span>Read</span>}
                    {!mine && (
                      <button
                        type="button"
                        onClick={() => report(message.id)}
                        className="opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                        aria-label="Report this message"
                      >
                        <Flag className="size-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        {peerTyping && (
          <p className="text-xs italic text-slate-400">{peer?.full_name} is typing…</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <input
          id="chat-input"
          value={draft}
          maxLength={1000}
          onChange={(event) => {
            setDraft(event.target.value)
            notifyTyping()
          }}
          placeholder="Write a message…"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <Button type="submit" icon={Send} loading={sending} disabled={!draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  )
}
