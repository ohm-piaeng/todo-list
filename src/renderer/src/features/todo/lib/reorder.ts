/**
 * Move `ids[from]` so it ends up at index `to` (indices in the original array).
 * Returns the same array when nothing moves, so callers can skip a save.
 */
export function moveItem<T>(list: readonly T[], from: number, to: number): readonly T[] {
  const target = Math.max(0, Math.min(list.length - 1, to))
  if (from === target || from < 0 || from >= list.length) return list
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(target, 0, item)
  return next
}

/**
 * Index an item should land on when dropped above (`before`) row `overIndex`,
 * or below it, accounting for the dragged row leaving its slot.
 */
export function dropIndex(fromIndex: number, overIndex: number, before: boolean): number {
  const slot = before ? overIndex : overIndex + 1
  return slot > fromIndex ? slot - 1 : slot
}
