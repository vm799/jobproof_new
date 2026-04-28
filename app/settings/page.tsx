'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { csrfHeaders } from '@/lib/csrf-client'
import { ShieldCheckIcon, MapPinIcon, WifiIcon } from '@heroicons/react/20/solid'

interface SettingsData {
  email: string
  createdAt: string
  trialEndsAt: string
  subscription: { tier: string; tierName: string; source: string; activated_at: string } | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.json()
      })
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', headers: csrfHeaders() })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="JobProof" width={26} height={26} priority />
          <Link href="/dashboard" className="text-stone-400 hover:text-white text-sm transition-colors">
            ← Dashboard
          </Link>
        </div>
        <button onClick={handleLogout} className="text-stone-400 hover:text-white text-xs transition-colors">
          Log out
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-amber-500 rounded-full mx-auto" aria-label="Loading" />
          </div>
        )}

        {data && (
          <>
            {/* Account */}
            <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-3">
              <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Account</h2>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">Email</span>
                <span className="text-sm font-medium text-slate-900">{data.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">Member since</span>
                <span className="text-sm text-stone-700">{new Date(data.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </section>

            {/* Subscription */}
            <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-3">
              <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Subscription</h2>
              {data.subscription ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-500">Plan</span>
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                      ✓ {data.subscription.tierName}{data.subscription.source === 'appsumo' ? ' — Lifetime' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-500">Source</span>
                    <span className="text-sm text-stone-700 capitalize">{data.subscription.source}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-500">Activated</span>
                    <span className="text-sm text-stone-700">{new Date(data.subscription.activated_at).toLocaleDateString('en-GB')}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-500">Plan</span>
                    <span className="text-sm font-medium text-amber-700">Free trial</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-500">Trial ends</span>
                    <span className="text-sm text-stone-700">{new Date(data.trialEndsAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Link href="/upgrade" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 py-2.5 rounded-lg text-sm font-bold text-center transition-colors">
                      Upgrade — £29 one-time
                    </Link>
                    <Link href="/upgrade/redeem" className="flex-1 border border-stone-300 text-stone-700 hover:border-stone-400 py-2.5 rounded-lg text-sm font-medium text-center transition-colors">
                      Redeem AppSumo code
                    </Link>
                  </div>
                </>
              )}
            </section>

            {/* Why JobProof */}
            <section className="bg-slate-900 rounded-xl p-5 space-y-4">
              <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">What protects your jobs</h2>
              {[
                { icon: <WifiIcon className="w-4 h-4 text-emerald-400" aria-hidden="true" />, label: 'Offline-first', detail: 'Evidence captured with no signal. Syncs when back online.' },
                { icon: <MapPinIcon className="w-4 h-4 text-blue-400" aria-hidden="true" />, label: 'GPS timestamped', detail: 'Location and time locked at capture. Cannot be altered.' },
                { icon: <ShieldCheckIcon className="w-4 h-4 text-amber-400" aria-hidden="true" />, label: 'Cryptographic seal', detail: 'SHA-256 hash. Alter one pixel — the seal breaks.' },
              ].map(({ icon, label, detail }) => (
                <div key={label} className="flex gap-3 items-start">
                  <div className="mt-0.5 flex-shrink-0">{icon}</div>
                  <div>
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-stone-400 text-xs mt-0.5">{detail}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Session */}
            <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
              <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Session</h2>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                Log out of JobProof
              </button>
            </section>

            <div className="text-center space-x-4 text-xs text-stone-400 pt-2">
              <Link href="/faq" className="hover:text-stone-600 transition-colors">FAQ</Link>
              <Link href="/roadmap" className="hover:text-stone-600 transition-colors">Roadmap</Link>
              <Link href="/dashboard" className="hover:text-stone-600 transition-colors">Dashboard</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
