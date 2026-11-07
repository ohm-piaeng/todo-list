import { describe, expect, it } from 'vitest'
import { formatEdited } from './formatEdited'

const NOW = Date.UTC(2026, 10, 7, 12, 0, 0)
const MIN = 60_000

describe('formatEdited', () => {
  it.each([
    [0, 'Edited just now'],
    [30_000, 'Edited just now'],
    [2 * MIN, 'Edited 2 min ago'],
    [59 * MIN, 'Edited 59 min ago'],
    [3 * 60 * MIN, 'Edited 3 hours ago'],
    [24 * 60 * MIN, 'Edited yesterday'],
    [3 * 24 * 60 * MIN, 'Edited 3 days ago']
  ])('%i ms ago → %s', (ago, expected) => {
    expect(formatEdited(NOW - ago, NOW)).toBe(expected)
  })

  it('never shows the future for clock skew', () => {
    expect(formatEdited(NOW + 5_000, NOW)).toBe('Edited just now')
  })

  it('falls back to a short date after a week', () => {
    expect(formatEdited(NOW - 10 * 24 * 60 * MIN, NOW)).toBe('Edited Oct 28')
  })
})
