import { Award, Flame, ShieldCheck, Zap } from 'lucide-react'

// Trust badges from spec 3.2 - purely derived, so they stay in sync automatically.
export function trustBadges(profile) {
  if (!profile) return []
  const badges = []

  if (profile.response_rate >= 90 && (profile.avg_response_hours ?? 99) <= 6) {
    badges.push({ key: 'fast', label: 'Fast Responder', icon: Zap, tone: 'warning' })
  }
  if (profile.completion_rate >= 95 && profile.completed_sessions >= 10) {
    badges.push({ key: 'reliable', label: 'Reliable Partner', icon: ShieldCheck, tone: 'success' })
  }
  if (profile.rating >= 4.8 && profile.rating_count >= 5) {
    badges.push({ key: 'top', label: 'Top Rated', icon: Award, tone: 'brand' })
  }
  if (profile.completed_sessions >= 20) {
    badges.push({ key: 'mentor', label: 'Active Mentor', icon: Flame, tone: 'danger' })
  }

  return badges
}
