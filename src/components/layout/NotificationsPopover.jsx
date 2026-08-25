import { Bell, CheckCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'
import { timeAgo } from '../../lib/format'
import { EmptyState } from '../common/EmptyState'

export function NotificationsPopover() {
  const { notifications, unreadCount, dismissAll } = useNotifications()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid size-4.5 min-w-4.5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-40 mt-2 w-80 animate-slide-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={dismissAll}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
              >
                <CheckCheck className="size-3.5" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={Bell} title="You are all caught up" description="New activity will show up here." />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <Link
                      to={notification.link ?? '/dashboard'}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-start gap-2">
                        {!notification.is_read && (
                          <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {notification.title}
                          </p>
                          {notification.body && (
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {notification.body}
                            </p>
                          )}
                          <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(notification.created_at)}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
