import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { listNotifications, markAllRead } from '../services/notificationService'
import { useAuth } from './useAuth'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user?.id) return
    try {
      setNotifications(await listNotifications(user.id))
    } catch (error) {
      console.error('Failed to load notifications', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!user?.id) return undefined

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => setNotifications((current) => [payload.new, ...current].slice(0, 30)),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const dismissAll = useCallback(async () => {
    if (!user?.id) return
    await markAllRead(user.id)
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })))
  }, [user?.id])

  return {
    notifications,
    unreadCount: notifications.filter((item) => !item.is_read).length,
    loading,
    refresh,
    dismissAll,
  }
}
