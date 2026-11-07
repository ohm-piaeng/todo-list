import { describe, expect, it } from 'vitest'
import { dropIndex, moveItem } from './reorder'

describe('moveItem', () => {
  const list = ['a', 'b', 'c', 'd']

  it.each([
    [0, 2, ['b', 'c', 'a', 'd']],
    [3, 0, ['d', 'a', 'b', 'c']],
    [1, 99, ['a', 'c', 'd', 'b']],
    [2, -5, ['c', 'a', 'b', 'd']]
  ])('from %i to %i', (from, to, expected) => {
    expect(moveItem(list, from, to)).toEqual(expected)
  })

  it('returns the same array when nothing moves', () => {
    expect(moveItem(list, 1, 1)).toBe(list)
    expect(moveItem(list, 9, 0)).toBe(list)
  })
})

describe('dropIndex', () => {
  it.each([
    // dragging index 0 ("a") of [a b c d]
    [0, 2, true, 1], // above c → between b and c
    [0, 2, false, 2], // below c
    [0, 0, true, 0], // onto itself
    // dragging index 3 ("d") upward
    [3, 1, true, 1],
    [3, 1, false, 2]
  ])('from %i over %i (before=%s) → %i', (from, over, before, expected) => {
    expect(dropIndex(from, over, before)).toBe(expected)
  })
})
