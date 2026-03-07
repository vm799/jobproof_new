'use client'

import { useEffect } from 'react'

export default function ChunkErrorHandler() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.name === 'ChunkLoadError' ||
        event.reason?.message?.includes('Loading chunk')
      ) {
        event.preventDefault()
        // Unregister stale service workers
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((r) => r.unregister())
          })
        }
        // Clear caches then reload
        const hasCaches = typeof window.caches !== 'undefined'
        if (hasCaches) {
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
