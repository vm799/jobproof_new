'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckIcon, ArrowRightIcon } from '@heroicons/react/20/solid'

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
    <>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">JobProof</div>
          <div className="flex gap-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
            <Link href="/demo" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Try Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Never Lose a Lien Claim Again
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Cryptographically sealed before/after photos with GPS timestamps. Works completely offline. Proof that holds up in court.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/demo" className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-lg font-semibold">
              Try Free Demo
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <button onClick={() => document.getElementById('email-form')?.scrollIntoView({ behavior: 'smooth' })} className="border-2 border-gray-300 px-8 py-4 rounded-lg hover:border-gray-400 text-lg font-semibold">
              See How It Works
            </button>
          </div>

          <div className="bg-blue-100 p-4 rounded-lg inline-block">
            <p className="text-blue-900 font-semibold">✓ Used by 50+ construction teams</p>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">The Problem</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Lost Evidence',
                desc: 'Photos deleted, forgotten, or gone with the crew member. No proof of what was actually done.'
              },
              {
                title: 'Disputed Work',
                desc: 'Client says "that wasn\'t complete" or "we paid to fix it already." No documented proof.'
              },
              {
                title: 'Lien Claims Denied',
                desc: 'Without timestamped, location-verified photos, your lien claim gets rejected. $50k+ loss.'
              }
            ].map((item, i) => (
              <div key={i} className="p-6 bg-red-50 rounded-lg border border-red-200">
                <h3 className="text-xl font-bold text-red-900 mb-3">{item.title}</h3>
                <p className="text-red-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 px-4 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">The Solution</h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {[
                'Offline-first: Works even with no signal',
                'GPS timestamp: Proof of location and time',
                'Client signature: Digital sign-off on site',
                'Crypto sealed: Tamper-proof proof file',
                'Export ready: Courts and insurers accept it',
                'Free trial: No credit card needed'
              ].map((feature, i) => (
                <div key={i} className="flex gap-3">
                  <CheckIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <p className="text-lg text-gray-700">{feature}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
              <p className="text-gray-500">Demo Screenshot: Before/After Photo Pair</p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto bg-green-50 rounded-lg p-8 border border-green-200">
          <h2 className="text-2xl font-bold text-green-900 mb-4">Case Study: Roofing Job Dispute</h2>
          <p className="text-gray-700 mb-4">
            <strong>Problem:</strong> Johnson Roofing completed a $45k roof repair. Client disputed completion, claimed work was incomplete. Without before/after photos, the contractor couldn't prove the work was done. Lien claim denied. Lost $45k.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>With JobProof:</strong> Same scenario. Crew takes before photo (offline). Client signs off on-site (no WiFi needed). GPS timestamp added. File sealed cryptographically. Uploaded to insurance company. Claim approved in 48 hours. $45k collected.
          </p>
          <p className="text-green-700 font-bold text-lg">
            💰 Result: $45,000 protected. Recovery time: 48 hours instead of months.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Crew Gets Link', desc: 'Manager sends job link via text or email' },
              { num: '2', title: 'Photo & GPS', desc: 'Crew captures before/after photos (works offline)' },
              { num: '3', title: 'Client Signs', desc: 'Client digitally signs on tablet/phone on-site' },
              { num: '4', title: 'Sealed & Sent', desc: 'When online, proof file uploads automatically' }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step.num}
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                name: 'Solo', 
                price: '$29/month', 
                desc: 'For individual contractors',
                features: ['Unlimited jobs', 'Offline-first', 'GPS + crypto seal', 'Email support']
              },
              { 
                name: 'Team', 
                price: '$99/month', 
                desc: 'For small crews',
                features: ['5 team members', 'All Solo features', 'Manager dashboard', 'Lien-ready exports', 'Priority support'],
                highlight: true
              },
              { 
                name: 'Enterprise', 
                price: 'Custom', 
                desc: 'For large contractors',
                features: ['Unlimited team members', 'All Team features', 'API access', 'Compliance reports', 'Dedicated support']
              }
            ].map((plan, i) => (
              <div key={i} className={`rounded-lg border-2 p-8 ${plan.highlight ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold text-blue-600 mb-2">{plan.price}</p>
                <p className="text-gray-600 mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex gap-2">
                      <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2 rounded-lg font-semibold ${plan.highlight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border-2 border-gray-300 hover:border-gray-400'}`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email Capture */}
      <section id="email-form" className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Try Free for 14 Days</h2>
          <p className="text-blue-100 mb-8">No credit card. No strings. Offline demo works immediately.</p>
          
          {submitted ? (
            <div className="bg-green-100 text-green-900 p-6 rounded-lg">
              <p className="text-lg font-semibold mb-2">✓ Check your email!</p>
              <p>We've sent you a link to the free demo. Download and use offline, no WiFi required.</p>
              <p className="text-sm mt-4 opacity-80">You'll also get 5 emails over the next week showing you how crews are saving money with JobProof.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Get Access'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          
          <div className="space-y-6">
            {[
              {
                q: "Does it really work offline?",
                a: "Yes, 100%. Photos, GPS, signatures, and crypto seal all work without internet. When you're back online, everything syncs automatically."
              },
              {
                q: "Is the proof admissible in court?",
                a: "Yes. The cryptographic seal makes it tamper-proof. GPS timestamp proves location and time. We provide an export format ready for court/insurance."
              },
              {
                q: "What if my crew forgets to sync?",
                a: "Data syncs automatically when they connect to WiFi. If they don't, they can manually sync from the app. All data is cached locally."
              },
              {
                q: "Can clients sign on-site without WiFi?",
                a: "Yes. Signature pad works completely offline. They sign right on the phone/tablet at the job site."
              },
              {
                q: "How much does it cost?",
                a: "From $29/month for solo contractors to $99/month for teams. Try 14 days free, no credit card."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-700">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm">
          <p>&copy; 2026 JobProof. Never lose a lien claim again.</p>
          <p className="mt-2">Protecting construction crews and securing $millions in lien claims.</p>
        </div>
      </footer>
    </>
  )
}
