import { supabase } from '../lib/supabaseClient'

const SKILL_WITH_OWNER = `
  *,
  owner:profiles!skills_user_id_fkey (
    id, full_name, department, year, avatar_url, rating, rating_count,
    response_rate, completion_rate, avg_response_hours, completed_sessions,
    last_seen_at, accepting_requests, status
  )
`

export async function listMySkills(userId) {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listOfferedSkills({ excludeUserId, category = '', search = '' } = {}) {
  let query = supabase
    .from('skills')
    .select(SKILL_WITH_OWNER)
    .eq('type', 'offer')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (excludeUserId) query = query.neq('user_id', excludeUserId)
  if (category) query = query.eq('category', category)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).filter((skill) => skill.owner && skill.owner.status === 'active')
}

export async function listSkillsForUser(userId) {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
  if (error) throw error
  return data ?? []
}

export async function createSkill(userId, values) {
  const { data, error } = await supabase
    .from('skills')
    .insert({ ...values, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSkill(skillId, values) {
  const { data, error } = await supabase
    .from('skills')
    .update(values)
    .eq('id', skillId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSkill(skillId) {
  const { error } = await supabase.from('skills').delete().eq('id', skillId)
  if (error) throw error
}

export async function listSkillRelations() {
  const { data, error } = await supabase.from('skill_relations').select('*')
  if (error) return []
  return data ?? []
}
