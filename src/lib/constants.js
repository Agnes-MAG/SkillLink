export const SKILL_CATEGORIES = [
  'Programming',
  'Design',
  'Writing',
  'Language',
  'Music',
  'Sports',
  'Business',
  'Science',
  'Other',
]

export const DEPARTMENTS = [
  'Computer Science',
  'Engineering',
  'Business',
  'Law',
  'Medicine',
  'Arts & Humanities',
  'Social Sciences',
  'Natural Sciences',
  'Education',
  'Other',
]

export const YEARS = ['1st', '2nd', '3rd', '4th', 'Postgraduate', 'Other']

export const SESSION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  COMPLETED_PENDING_RATING: 'completed_pending_rating',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  ESCALATED: 'escalated',
}

export const SESSION_STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  cancelled: 'Cancelled',
  completed_pending_rating: 'Awaiting ratings',
  completed: 'Completed',
  expired: 'Expired',
  escalated: 'Escalated',
}

// Which target states a session may move to, mirrored from the database trigger
// so the UI can hide actions that the backend would reject anyway.
export const SESSION_TRANSITIONS = {
  pending: ['accepted', 'declined', 'cancelled', 'expired'],
  accepted: ['completed_pending_rating', 'cancelled', 'escalated'],
  completed_pending_rating: ['completed', 'escalated'],
  escalated: ['completed', 'cancelled'],
  completed: [],
  declined: [],
  cancelled: [],
  expired: [],
}

export const MAX_PENDING_AS_PROVIDER = 3
export const MAX_PENDING_AS_REQUESTER = 5
export const MAX_REQUESTS_PER_DAY = 10
export const MAX_SKILLS_PER_TYPE = 10
export const REQUEST_EXPIRY_HOURS = 48
export const RATING_WINDOW_DAYS = 7
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png']
