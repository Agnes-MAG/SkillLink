// Profile completion score from the business logic spec:
// name 20% + bio 15% + avatar 15% + >=1 offered skill 25% + >=1 needed skill 25%.
export const COMPLETION_ITEMS = [
  { key: 'full_name', label: 'Add your full name', weight: 20 },
  { key: 'bio', label: 'Write a short bio', weight: 15 },
  { key: 'avatar_url', label: 'Upload a profile photo', weight: 15 },
  { key: 'offered', label: 'List a skill you offer', weight: 25 },
  { key: 'needed', label: 'List a skill you need', weight: 25 },
]

export function profileCompletion(profile, skills = []) {
  const state = {
    full_name: Boolean(profile?.full_name?.trim()),
    bio: Boolean(profile?.bio?.trim()),
    avatar_url: Boolean(profile?.avatar_url),
    offered: skills.some((skill) => skill.type === 'offer'),
    needed: skills.some((skill) => skill.type === 'need'),
  }

  const score = COMPLETION_ITEMS.reduce(
    (total, item) => total + (state[item.key] ? item.weight : 0),
    0,
  )

  return {
    score,
    missing: COMPLETION_ITEMS.filter((item) => !state[item.key]),
  }
}
