'use client'
import { useEffect } from 'react'
import { useLiveStore } from '@/lib/state/live-store'

export function useKeyboardShortcuts(enabled: boolean) {
  const dispatch = useLiveStore(s => s.dispatch)

  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault()
          dispatch({ type: 'NEXT_SLIDE' })
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          dispatch({ type: 'PREV_SLIDE' })
          break
        case 'b':
        case 'B':
          dispatch({ type: 'BLACKOUT' })
          break
        case 'Escape':
          dispatch({ type: 'CLEAR_BLACKOUT' })
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled, dispatch])
}
