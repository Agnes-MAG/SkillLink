import { MAX_REQUESTS_PER_DAY, REQUEST_EXPIRY_HOURS } from '../lib/constants'
import { supabase } from '../lib/supabaseClient'

const SESSION_SELECT = `
  *,
  skill:skills!sessions_skill_id_fkey (id, name, category, description, type),
  requester:profiles!sessions_requester_id_fkey (id, full_name, avatar_url, department, rating),
  provider:profiles!sessions_provider_id_fkey (id, full_name, avatar_url, department, rating),
  ratings (id, rater_id, rated_user_id, score, comment, created_at)
`

export async function listSessions(userId) {
  const { data, error } = await supabase
    .from('sessions')
    .select(SESSION_SELECT)
    .or(`requester_id.eq.${userId},provider_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listAllSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select(SESSION_SELECT)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data ?? []
}

/**
 * Client-side pre-flight checks mirroring the database guards, so the user gets
 * an explanation before we attempt a write that RLS/triggers would reject.
 */
export async function assertCanRequest({ requesterId, providerId, skillId }) {
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString()

  const [{ count: todayCount }, { data: duplicate }] = await Promise.all([
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('requester_id', requesterId)
      .gte('created_at', since),
    supabase
      .from('sessions')
      .select('id')
      .eq('requester_id', requesterId)
      .eq('provider_id', providerId)
      .eq('skill_id', skillId)
      .in('status', ['pending', 'accepted', 'completed_pending_rating'])
      .maybeSingle(),
  ])

  if ((todayCount ?? 0) >= MAX_REQUESTS_PER_DAY) {
    throw new Error(`You have reached the daily limit of ${MAX_REQUESTS_PER_DAY} requests.`)
  }
  if (duplicate) {
    throw new Error('You already have an open request for this skill.')
  }
}

export async function requestSkill({ requesterId, providerId, skillId, notes, scheduledAt }) {
  await assertCanRequest({ requesterId, providerId, skillId })

  if (scheduledAt) {
    const conflict = await hasSchedulingConflict({
      userIds: [requesterId, providerId],
      scheduledAt,
    })
    if (conflict) {
      throw new Error('One of you already has a session booked at that time.')
    }
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      requester_id: requesterId,
      provider_id: providerId,
      skill_id: skillId,
      notes: notes || null,
      scheduled_at: scheduledAt || null,
      expires_at: new Date(Date.now() + REQUEST_EXPIRY_HOURS * 3_600_000).toISOString(),
    })
    .select(SESSION_SELECT)
    .single()
  if (error) throw error
  return data
}

export async function hasSchedulingConflict({ userIds, scheduledAt, ignoreSessionId }) {
  const target = new Date(scheduledAt)
  const from = new Date(target.getTime() - 59 * 60_000).toISOString()
  const to = new Date(target.getTime() + 59 * 60_000).toISOString()

  let query = supabase
    .from('sessions')
    .select('id')
    .in('status', ['accepted', 'completed_pending_rating'])
    .gte('scheduled_at', from)
    .lte('scheduled_at', to)
    .or(userIds.map((id) => `requester_id.eq.${id},provider_id.eq.${id}`).join(','))

  if (ignoreSessionId) query = query.neq('id', ignoreSessionId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).length > 0
}

export async function setSessionStatus(sessionId, status) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId)
    .select(SESSION_SELECT)
    .single()
  if (error) throw error
  return data
}

export async function expireStaleSessions() {
  const { data, error } = await supabase.rpc('expire_stale_sessions')
  if (error) return 0
  return data ?? 0
}

export async function submitRating({ sessionId, raterId, ratedUserId, score, comment }) {
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      session_id: sessionId,
      rater_id: raterId,
      rated_user_id: ratedUserId,
      score,
      comment: comment || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listRatingsFor(userId) {
  const { data, error } = await supabase
    .from('ratings')
    .select('*, rater:profiles!ratings_rater_id_fkey (id, full_name, avatar_url)')
    .eq('rated_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data ?? []
}
