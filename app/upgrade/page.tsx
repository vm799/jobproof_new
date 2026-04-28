'use client'

import Link from 'next/link'
import { CheckIcon } from '@heroicons/react/20/solid'
import { STRIPE_PAYMENT_LINKS } from '@/lib/stripePaymentLinks'

const tiers = [
  {
    id: 'tier1',
    name: 'Solo',
    price: 29,
    description: 'Perfect for individual contractors managing their own jobs.',
    features: [
      'Up to 50 jobs',
      '1 manager account',
      'GPS-stamped photo evidence',
      'Digital crew signatures',
      'Proof seal & PDF reports',
      'Email job delivery',
      'Lifetime access — no monthly fees',
    ],
    highlight: false,
    cta: 'Get Solo — £29',
  },
  {
    id: 'tier2',
    name: 'Team',
    price: 99,
    description: 'For growing teams managing multiple sites and crew members.',
    features: [
      'Unlimited jobs',
      '5 manager seats (rolling out — auto-upgraded for AppSumo buyers)',
      'Everything in Solo',
      'Priority email support',
      'Lifetime access — no monthly fees',
    ],
    highlight: true,
    cta: 'Get Team — £99',
  },
  {
    id: 'tier3',
    name: 'Enterprise',
    price: 299,
    description: 'For larger contractors managing multiple teams.',
    features: [
      'Unlimited jobs',
      'Unlimited manager seats (rolling out — auto-upgraded for AppSumo buyers)',
      'Everything in Team',
      'Priority support',
      'Onboarding call included',
      'Lifetime access — no monthly fees',
    ],
    highlight: false,
    cta: 'Get Enterprise — £299',
  },
]

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-stone-800 font-semibold text-sm">
          <span className="text-amber-600">●</span> JobProof
        </Link>
        <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-700">
          ← Back to dashboard
        </Link>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Headline */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-stone-900 mb-3">
            Protect every job. One-time payment.
          </h1>
          <p className="text-stone-500 text-lg max-w-xl mx-auto">
            Timestamped photo evidence, GPS seals, and digital signatures — legally defensible proof
            you can use in disputes and insurance claims.
          </p>
          <p className="mt-4 text-sm text-amber-700 font-medium bg-amber-50 border border-amber-200 rounded-full inline-block px-4 py-1">
            AppSumo deal — pay once, use forever
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const link = STRIPE_PAYMENT_LINKS[tier.id]
            return (
              <div
                key={tier.id}
                className={`rounded-2xl border p-7 flex flex-col ${
                  tier.highlight
                    ? 'border-amber-400 bg-white shadow-lg ring-2 ring-amber-400'
                    : 'border-stone-200 bg-white shadow-sm'
                }`}
              >
                {tier.highlight && (
                  <div className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 self-start mb-4">
                    Most popular
                  </div>
                )}
                <div className="mb-1 font-bold text-stone-900 text-lg">{tier.name}</div>
                <div className="mb-3">
                  <span className="text-4xl font-bold text-stone-900">£{tier.price}</span>
                  <span className="text-stone-400 text-sm ml-1">one-time</span>
                </div>
                <p className="text-stone-500 text-sm mb-6">{tier.description}</p>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-stone-700">
                      <CheckIcon className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-center rounded-xl py-3 px-4 text-sm font-semibold transition-colors ${
                      tier.highlight
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-stone-900 text-white hover:bg-stone-700'
                    }`}
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <button
                    disabled
                    className="block w-full text-center rounded-xl py-3 px-4 text-sm font-semibold bg-stone-100 text-stone-400 cursor-not-allowed"
                  >
                    {tier.cta}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* AppSumo code redemption link */}
        <div className="mt-10 text-center">
          <p className="text-stone-500 text-sm">
            Have an AppSumo code?{' '}
            <Link href="/upgrade/redeem" className="text-amber-600 hover:underline font-medium">
              Redeem it here →
            </Link>
          </p>
        </div>

        {/* Trust footer */}
        <div className="mt-16 border-t border-stone-200 pt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-stone-900 mb-1">100%</div>
            <div className="text-sm text-stone-500">Legally defensible evidence</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-900 mb-1">Offline-first</div>
            <div className="text-sm text-stone-500">Works on-site with no signal</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-900 mb-1">No subscriptions</div>
            <div className="text-sm text-stone-500">Pay once, yours forever</div>
          </div>
        </div>
      </div>
    </div>
  )
}
