const FRIENDLY = [
  [/at capacity/i, 'This student already has 3 pending requests. Try again later.'],
  [/5 pending requests/i, 'You have reached your limit of 5 pending requests.'],
  [/not accepting requests/i, 'This student has paused incoming requests.'],
  [/sessions_no_duplicate_open/i, 'You already have an open request for this skill.'],
  [/skills_unique_per_user/i, 'You already listed that skill.'],
  [/opposite skill type/i, 'You cannot offer and need the same skill.'],
  [/Illegal session transition/i, 'That action is no longer available for this session.'],
  [/duplicate key/i, 'That entry already exists.'],
  [/Invalid login credentials/i, 'Email or password is incorrect.'],
]

export function friendlyError(error, fallback = 'Something went wrong. Please try again.') {
  const message = error?.message ?? ''
  const match = FRIENDLY.find(([pattern]) => pattern.test(message))
  if (match) return match[1]
  return message || fallback
}
