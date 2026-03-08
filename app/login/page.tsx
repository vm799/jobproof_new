'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/logo.svg" alt="JobProof" width={40} height={40} priority />
            <span className="text-2xl font-bold text-white tracking-tight">JobProof</span>
          </Link>
          <p className="text-stone-400 text-sm mt-2">Manager Dashboard</p>
        </div>

        <div className="bg-white rounded-md p-6 shadow-lg">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Check your email</h2>
              <p className="text-stone-500 text-sm">We sent a secure link to <strong className="text-slate-900">{email}</strong></p>
              <p className="text-stone-400 text-xs">Click the link to go straight to your dashboard. Expires in 15 minutes. Check spam/junk if needed.</p>
              <button
                onClick={() => { setSent(false); setError('') }}
                className="text-amber-600 hover:text-amber-700 text-xs font-bold transition-colors"
              >
                Didn&apos;t receive it? Try again
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Log in or start your trial</h2>
              <p className="text-stone-500 text-sm mb-5">Enter your email and we&apos;ll send a secure link. New here? Your 14-day free trial starts instantly.</p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  required
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-md text-sm focus:border-amber-500 outline-none text-slate-900"
                />
                {error && <p className="text-red-600 text-xs">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-3 rounded-md font-bold text-sm disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Login Link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-stone-500 text-xs mt-6">
          No credit card required. 14-day free trial.
        </p>
      </div>
    </div>
  )
}
