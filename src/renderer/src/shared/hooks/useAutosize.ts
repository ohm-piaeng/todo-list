import { useLayoutEffect, type RefObject } from 'react'

/** Grow a textarea to fit its content (no inner scrollbar). */
export function useAutosize(ref: RefObject<HTMLTextAreaElement | null>, value: string): void {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [ref, value])
}
