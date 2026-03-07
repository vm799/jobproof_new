'use client'

import { useEffect } from 'react'

export default function ChunkErrorHandler() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.name === 'ChunkLoadError' ||
        event.reason?.message?.includes('Loading chunk')
      ) {
        // Prevent default error logging
        event.preventDefault()
        // Unregister stale service workers and reload
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((r) => r.unregister())
          })
        }
        // Clear caches then reload
        if ('caches' in window) {
          caches.keys().then((names) => {
            Promise.all(names.map((n) => caches.delete(n))).then(() => {
              window.location.reload()
            })
          })
        } else {
          window.location.reload()
        }
      }
    }

    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [])

  return null
}
