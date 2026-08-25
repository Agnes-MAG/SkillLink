import { supabase } from '../lib/supabaseClient'

const CHAT_SESSION_SELECT = `
  id, status, created_at,
  skill:skills!sessions_skill_id_fkey (id, name, category),
  requester:profiles!sessions_requester_id_fkey (id, full_name, avatar_url),
  provider:profiles!sessions_provider_id_fkey (id, full_name, avatar_url)
`

/** Chat is only unlocked for sessions the two students are actually working on. */
export async function listChatThreads(userId) {
  const { data, error } = await supabase
    .from('sessions')
    .select(CHAT_SESSION_SELECT)
    .in('status', ['accepted', 'completed_pending_rating', 'completed'])
    .or(`requester_id.eq.${userId},provider_id.eq.${userId}`)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listMessages(sessionId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function sendMessage({ sessionId, senderId, content }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ session_id: sessionId, sender_id: senderId, content: content.trim() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markThreadRead(sessionId, userId) {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('session_id', sessionId)
    .neq('sender_id', userId)
    .eq('is_read', false)
  if (error) throw error
}

export async function flagMessage(messageId) {
  const { error } = await supabase.from('messages').update({ flagged: true }).eq('id', messageId)
  if (error) throw error
}
