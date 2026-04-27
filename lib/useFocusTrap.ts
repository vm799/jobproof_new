'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Focus-trap hook for modals. Traps Tab/Shift-Tab inside the container ref,
 * calls onEscape on Escape key, and autofocuses the first focusable element
 * (or a custom selector) when active becomes true.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement>,
  active: boolean,
  options: { onEscape?: () => void; autoFocusSelector?: string } = {}
) {
  const { onEscape, autoFocusSelector } = options

  useEffect(() => {
    if (!active) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape?.()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const focusable = ref.current.querySelectorAll<HTMLElement>(
        'input, textarea, button, select, a[href], [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const timer = setTimeout(() => {
      const target = autoFocusSelector
        ? ref.current?.querySelector<HTMLElement>(autoFocusSelector)
        : ref.current?.querySelector<HTMLElement>('input, textarea, button, [tabindex]:not([tabindex="-1"])')
      target?.focus()
    }, 50)

    // Body scroll lock — Issue 2
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
      document.body.style.overflow = previousOverflow
    }
  }, [active, ref, onEscape, autoFocusSelector])
}
