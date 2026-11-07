import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('keeps a custom font size and a custom color together', () => {
    expect(cn('text-body text-fg')).toBe('text-body text-fg')
  })

  it('later custom token of the same group wins', () => {
    expect(cn('text-body', 'text-lead')).toBe('text-lead')
    expect(cn('text-fg', 'text-fg-secondary')).toBe('text-fg-secondary')
    expect(cn('rounded-md', 'rounded-pill')).toBe('rounded-pill')
    expect(cn('shadow-card', 'shadow-paper')).toBe('shadow-paper')
    expect(cn('h-control-md', 'h-topbar')).toBe('h-topbar')
  })
})
