import { supabase } from '../lib/supabaseClient'

export async function fetchAnalytics() {
  const { data, error } = await supabase.rpc('admin_analytics')
  if (error) throw error
  return data
}

export async function listFlaggedMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey (id, full_name, avatar_url)')
    .eq('flagged', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function deleteMessage(messageId) {
  const { error } = await supabase.from('messages').delete().eq('id', messageId)
  if (error) throw error
}
