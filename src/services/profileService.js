import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from '../lib/constants'
import { supabase } from '../lib/supabaseClient'

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(userId, values) {
  const { data, error } = await supabase
    .from('profiles')
    .update(values)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uploadAvatar(userId, file) {
  if (!AVATAR_MIME_TYPES.includes(file.type)) {
    throw new Error('Avatar must be a JPEG or PNG image')
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error('Avatar must be smaller than 2MB')
  }

  const extension = file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${userId}/avatar-${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return updateProfile(userId, { avatar_url: data.publicUrl })
}

export async function listProfiles({ search = '', role = '', status = '' } = {}) {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (search) query = query.ilike('full_name', `%${search}%`)
  if (role) query = query.eq('role', role)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function setProfileStatus(userId, status) {
  return updateProfile(userId, { status })
}
