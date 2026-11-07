import { useCallback, useEffect, useMemo, useRef } from 'react'

export interface IDebounced<A extends unknown[]> {
  (...args: A): void
  /** Run the pending call now (e.g. on blur / unmount). */
  flush: () => void
  cancel: () => void
}

/**
 * Stable debounced wrapper around the latest `fn`. Pending calls are flushed on
 * unmount so edits are never lost when the user navigates away.
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number
): IDebounced<A> {
  const fnRef = useRef(fn)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<A | null>(null)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    const args = pending.current
    pending.current = null
    if (args) fnRef.current(...args)
  }, [])

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    pending.current = null
  }, [])

  useEffect(() => flush, [flush])

  return useMemo(() => {
    const debounced = ((...args: A) => {
      pending.current = args
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, delayMs)
    }) as IDebounced<A>
    debounced.flush = flush
    debounced.cancel = cancel
    return debounced
  }, [flush, cancel, delayMs])
}
