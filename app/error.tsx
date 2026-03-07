'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Auto-recover from stale chunk errors (SW caching old deployment)
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister())
        })
      }
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
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-stone-800 mb-4">Something went wrong</h1>
        <p className="text-stone-600 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
