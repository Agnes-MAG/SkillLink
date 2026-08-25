import { formatDistanceToNowStrict } from 'date-fns'

export function timeAgo(value) {
  if (!value) return ''
  return `${formatDistanceToNowStrict(new Date(value))} ago`
}

export function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function hoursUntil(value) {
  if (!value) return 0
  return Math.max(0, Math.round((new Date(value).getTime() - Date.now()) / 3_600_000))
}
