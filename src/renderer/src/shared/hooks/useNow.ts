import { useSyncExternalStore } from 'react'

const TICK_MS = 30_000
const listeners = new Set<() => void>()
let now = Date.now()
let timer: ReturnType<typeof setInterval> | null = null

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now()
      listeners.forEach((l) => l())
    }, TICK_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

/**
 * Current time, refreshed every 30s by one shared timer. Only components that
 * display relative time subscribe, so the tick never re-renders the rest of the tree.
 */
export function useNow(): number {
  return useSyncExternalStore(subscribe, () => now)
}
