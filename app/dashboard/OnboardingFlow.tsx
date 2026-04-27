'use client'

import { useState } from 'react'
import { ShieldCheckIcon, MapPinIcon, PhotoIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/20/solid'

const STORAGE_KEY = 'jobproof_onboarded'

const STEPS = [
  {
    icon: <PhotoIcon className="w-10 h-10 text-amber-400" />,
    title: 'Before & after. No WiFi needed.',
    body: "Crew opens the link on their phone, takes photos, and submits — even underground, in a basement, or on a remote site. Everything saves locally and syncs when they're back online.",
    badge: 'Offline-first',
    badgeColor: 'bg-emerald-900 text-emerald-300',
  },
  {
    icon: <MapPinIcon className="w-10 h-10 text-amber-400" />,
    title: 'GPS + timestamp. Automatic.',
    body: "Every submission is pinned to a location and a time. The crew can't fake it — the phone's GPS locks the coordinates at the moment photos are taken.",
    badge: 'Tamper-evident',
    badgeColor: 'bg-blue-900 text-blue-300',
  },
  {
    icon: <ShieldCheckIcon className="w-10 h-10 text-amber-400" />,
    title: 'Cryptographic seal on every report.',
    body: "Once submitted, the evidence is sealed with a SHA-256 hash. Change one pixel in a photo or one character in the notes — the seal breaks and the tampering is visible to anyone who checks.",
    badge: 'Court-ready',
    badgeColor: 'bg-amber-900 text-amber-300',
  },
]

interface Props {
  onDone: () => void
}

export function OnboardingFlow({ onDone }: Props) {
  const [step, setStep] = useState(0)

  function finish() {
    localStorage.setItem(STORAGE_KEY, '1')
    onDone()
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === step ? 'w-6 bg-amber-400' : i < step ? 'w-4 bg-amber-700' : 'w-4 bg-slate-700'
                }`}
              />
            ))}
          </div>
          <button onClick={finish} aria-label="Skip onboarding" className="text-stone-500 hover:text-stone-300 transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pt-6 pb-5 text-center">
          <div className="flex justify-center mb-4">{current.icon}</div>
          <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-3 ${current.badgeColor}`}>
            {current.badge}
          </span>
          <h2 className="text-white font-bold text-lg leading-snug mb-3">{current.title}</h2>
          <p className="text-stone-400 text-sm leading-relaxed">{current.body}</p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 border border-slate-600 text-stone-400 hover:text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? finish : () => setStep(s => s + 1)}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {isLast ? 'Create my first job' : 'Next'}
            {!isLast && <ArrowRightIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Returns true if onboarding has never been completed */
export function shouldShowOnboarding(): boolean {
  if (typeof window === 'undefined') return false
  return !localStorage.getItem(STORAGE_KEY)
}
