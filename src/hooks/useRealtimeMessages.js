import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { listMessages, markThreadRead, sendMessage } from '../services/chatService'

const TYPING_TIMEOUT_MS = 3000
const TYPING_THROTTLE_MS = 2000

export function useRealtimeMessages(sessionId, userId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(Boolean(sessionId))
  const [peerTyping, setPeerTyping] = useState(false)
  const channelRef = useRef(null)
  const lastTypingSent = useRef(0)
  const typingTimer = useRef(null)

  useEffect(() => {
    if (!sessionId) {
      setMessages([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    listMessages(sessionId)
      .then((rows) => {
        if (!active) return
        setMessages(rows)
        return markThreadRead(sessionId, userId)
      })
      .catch((error) => console.error('Failed to load messages', error))
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [sessionId, userId])

  useEffect(() => {
    if (!sessionId) return undefined

    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setMessages((current) =>
            current.some((message) => message.id === payload.new.id)
              ? current
              : [...current, payload.new],
          )
        },
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === userId) return
        setPeerTyping(true)
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setPeerTyping(false), TYPING_TIMEOUT_MS)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      clearTimeout(typingTimer.current)
      supabase.removeChannel(channel)
      channelRef.current = null
      setPeerTyping(false)
    }
  }, [sessionId, userId])

  const notifyTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastTypingSent.current < TYPING_THROTTLE_MS) return
    lastTypingSent.current = now
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId } })
  }, [userId])

  const send = useCallback(
    async (content) => {
      const message = await sendMessage({ sessionId, senderId: userId, content })
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      )
      return message
    },
    [sessionId, userId],
  )

  return { messages, loading, peerTyping, send, notifyTyping }
}
