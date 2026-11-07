const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "Edited just now" / "Edited 2 min ago" / "Edited yesterday" … */
export function formatEdited(updatedAt: number, now: number): string {
  const diff = Math.max(0, now - updatedAt)
  if (diff < MINUTE) return 'Edited just now'
  if (diff < HOUR) return `Edited ${Math.floor(diff / MINUTE)} min ago`
  if (diff < DAY) return `Edited ${rtf.format(-Math.floor(diff / HOUR), 'hour')}`
  if (diff < 7 * DAY) return `Edited ${rtf.format(-Math.floor(diff / DAY), 'day')}`
  return `Edited ${new Date(updatedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
}
