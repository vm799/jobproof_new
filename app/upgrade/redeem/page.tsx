'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const TIER_LABELS: Record<string, string> = {
  tier1: 'Solo',
  tier2: 'Team',
  tier3: 'Enterprise',
}

export default function RedeemPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ tier: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/appsumo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to redeem code. Please try again.')
        return
      }

      setSuccess({ tier: data.tier })
      setTimeout(() => router.push('/dashboard'), 2500)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-stone-800 font-semibold text-sm">
          <span className="text-amber-600">●</span> JobProof
        </Link>
        <Link href="/upgrade" className="text-sm text-stone-500 hover:text-stone-700">
          ← View pricing
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {success ? (
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-10 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-stone-900 mb-2">Code redeemed!</h2>
              <p className="text-stone-500 text-sm">
                You now have <span className="font-semibold text-stone-800">JobProof {TIER_LABELS[success.tier] ?? success.tier}</span> — lifetime access unlocked.
              </p>
              <p className="text-stone-400 text-xs mt-4">Redirecting to dashboard…</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-10">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-stone-900 mb-1">Redeem AppSumo code</h1>
                <p className="text-stone-500 text-sm">
                  Enter your code from AppSumo to unlock lifetime access.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    AppSumo code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="JOBPROOF-XXXX-XXXX"
                    className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-mono tracking-wider text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent uppercase"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full rounded-xl bg-amber-500 text-white py-3 px-4 text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Redeeming…' : 'Redeem code'}
                </button>
              </form>

              <p className="text-stone-400 text-xs mt-6 text-center">
                Codes are single-use. Each tier requires its own code.{' '}
                <Link href="/upgrade" className="text-amber-600 hover:underline">
                  Need a code?
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
