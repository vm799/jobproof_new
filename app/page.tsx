'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckIcon, ArrowRightIcon } from '@heroicons/react/20/solid'

function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="JobProof logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  )
}

export default function Home() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (res.ok) {
        setSubmitted(true)
        setEmail('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overflow-x-hidden w-full">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="text-xl font-bold text-white tracking-tight">JobProof</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <a href="#features" className="text-stone-400 hover:text-white text-sm transition-colors">Features</a>
            <a href="#pricing" className="text-stone-400 hover:text-white text-sm transition-colors">Pricing</a>
            <a href="#faq" className="text-stone-400 hover:text-white text-sm transition-colors">FAQ</a>
            <Link href="/demo" className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-md text-sm font-bold transition-colors">
              Try Demo
            </Link>
          </div>
          <Link href="/demo" className="sm:hidden bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-md text-sm font-bold transition-colors">
            Try Demo
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Logo size={72} />
          </div>
          <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-4">Offline-First Field Evidence</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Never Lose a<br />Lien Claim Again
          </h1>
          <p className="text-lg text-stone-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Cryptographically sealed before/after photos with GPS timestamps. Works completely offline. Proof that holds up in court.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link href="/demo" className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-8 py-4 rounded-md flex items-center justify-center gap-2 text-lg font-bold transition-colors">
              Try Free Demo
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <button onClick={() => document.getElementById('email-form')?.scrollIntoView({ behavior: 'smooth' })} className="border-2 border-stone-600 text-stone-300 px-8 py-4 rounded-md text-lg font-medium hover:border-stone-400 hover:text-white transition-colors">
              See How It Works
            </button>
          </div>

          <p className="text-stone-500 text-sm">Used by 50+ construction teams. No credit card required.</p>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">The Problem</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Lost Evidence',
                desc: 'Photos deleted, forgotten, or gone with the crew member. No proof of what was actually done.'
              },
              {
                title: 'Disputed Work',
                desc: "Client says it wasn't complete or claims they already paid to fix it. No documented proof."
              },
              {
                title: 'Lien Claims Denied',
                desc: 'Without timestamped, location-verified photos, your lien claim gets rejected. $50k+ loss.'
              }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-md shadow-sm p-6 border-l-4 border-red-500">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">The Solution</h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              {[
                { label: 'Offline-first', detail: 'Works even with no signal on the jobsite' },
                { label: 'GPS timestamp', detail: 'Proof of location and time, automatic' },
                { label: 'Client signature', detail: 'Digital sign-off on site, no paper' },
                { label: 'Crypto sealed', detail: 'Tamper-proof — nobody can alter the evidence' },
                { label: 'Export ready', detail: 'Courts and insurers accept the format' },
                { label: 'Free trial', detail: '14 days, no credit card needed' },
              ].map((f, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <CheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-900 font-medium text-sm">{f.label}</p>
                    <p className="text-stone-500 text-sm">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 rounded-md p-8 text-center">
              <div className="bg-slate-800 rounded p-6 space-y-3">
                <div className="flex gap-2 justify-center">
                  <div className="w-20 h-14 bg-stone-700 rounded flex items-center justify-center text-[10px] text-stone-400 font-bold uppercase">Before</div>
                  <div className="w-20 h-14 bg-stone-700 rounded flex items-center justify-center text-[10px] text-stone-400 font-bold uppercase">After</div>
                </div>
                <div className="text-amber-400 font-mono text-xs">38.9072, -77.0369</div>
                <div className="text-stone-500 text-xs">Cryptographically sealed</div>
                <div className="text-emerald-400 text-xs font-bold">Client signed</div>
              </div>
              <p className="text-stone-500 text-xs mt-4">Court-ready proof file</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="features" className="py-16 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">How It Works</h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Crew Gets Link', desc: 'Manager sends job link via text or email' },
              { num: '2', title: 'Photo & GPS', desc: 'Crew captures before/after photos offline' },
              { num: '3', title: 'Client Signs', desc: 'Digital sign-off right on the phone' },
              { num: '4', title: 'Sealed & Sent', desc: 'Proof file uploads when back online' }
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  {s.num}
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{s.title}</h3>
                <p className="text-stone-500 text-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Simple Pricing</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Solo',
                price: '$29',
                period: '/month',
                desc: 'For individual contractors',
                features: ['Unlimited jobs', 'Offline-first', 'GPS + crypto seal', 'Email support']
              },
              {
                name: 'Team',
                price: '$99',
                period: '/month',
                desc: 'For small crews',
                features: ['5 team members', 'All Solo features', 'Manager dashboard', 'Lien-ready exports', 'Priority support'],
                highlight: true
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                desc: 'For large contractors',
                features: ['Unlimited team members', 'All Team features', 'API access', 'Compliance reports', 'Dedicated support']
              }
            ].map((plan, i) => (
              <div key={i} className={`rounded-md overflow-hidden ${plan.highlight ? 'shadow-lg ring-2 ring-amber-500' : 'shadow-sm border border-stone-200'}`}>
                {plan.highlight && (
                  <div className="bg-amber-500 text-slate-900 text-center py-1.5 text-xs font-bold uppercase tracking-wider">Most Popular</div>
                )}
                <div className="p-6 bg-white">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <div className="mt-2 mb-1">
                    <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-stone-500 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-stone-500 text-sm mb-5">{plan.desc}</p>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex gap-2 items-center">
                        <CheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-sm text-stone-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-2.5 rounded-md font-bold text-sm transition-colors ${plan.highlight ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
                    Get Started
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email Capture */}
      <section id="email-form" className="py-16 px-4 bg-slate-900">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-5">
            <Logo size={48} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Try Free for 14 Days</h2>
          <p className="text-stone-400 mb-8 text-sm">No credit card. No strings. Offline demo works immediately.</p>

          {submitted ? (
            <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-200 p-6 rounded-md">
              <p className="font-bold mb-1">Check your email</p>
              <p className="text-sm">We&apos;ve sent you a link to get started. Works offline immediately.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 rounded-md text-slate-900 bg-white text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-8 py-3 rounded-md font-bold text-sm disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Get Access'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">FAQ</h2>

          <div className="space-y-4">
            {[
              {
                q: 'Does it really work offline?',
                a: "Yes, 100%. Photos, GPS, signatures, and crypto seal all work without internet. When you're back online, everything syncs automatically."
              },
              {
                q: 'Is the proof admissible in court?',
                a: 'Yes. The cryptographic seal makes it tamper-proof. GPS timestamp proves location and time. Export format is ready for court and insurance.'
              },
              {
                q: 'What if my crew forgets to sync?',
                a: 'Data syncs automatically when they connect to WiFi. All data is cached locally and persists even if the app is closed.'
              },
              {
                q: 'Can clients sign on-site without WiFi?',
                a: 'Yes. Signature pad works completely offline. They sign right on the phone or tablet at the job site.'
              },
              {
                q: 'How much does it cost?',
                a: 'From $29/month for solo contractors to $99/month for teams. Try 14 days free, no credit card.'
              }
            ].map((faq, i) => (
              <div key={i} className="bg-stone-50 p-5 rounded-md">
                <h3 className="font-bold text-slate-900 text-sm mb-1">{faq.q}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-10 px-4 bg-stone-100 border-t border-stone-200">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-2">Disclaimer</p>
          <p className="text-xs text-stone-500 leading-relaxed">
            JobProof is a documentation and record-keeping tool. It does not provide legal advice
            and makes no guarantees regarding the admissibility or sufficiency of any documentation
            in legal proceedings. Cryptographic seals verify data integrity but are not a substitute
            for qualified legal counsel. Users are solely responsible for ensuring their documentation
            meets applicable legal, regulatory, and contractual requirements. Always consult a
            licensed attorney before relying on any evidence in court proceedings, lien claims,
            insurance disputes, or contractual matters. JobProof assumes no liability for outcomes
            resulting from the use of this tool.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-stone-500 py-10 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-white font-bold text-base tracking-tight">JobProof</span>
          </div>
          <p className="text-xs text-stone-500">Protecting construction crews and securing lien claims.</p>
          <div className="flex items-center gap-4 text-xs text-stone-600">
            <Link href="/login" className="hover:text-stone-400 transition-colors">Manager Login</Link>
            <span>&copy; 2026 JobProof</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
