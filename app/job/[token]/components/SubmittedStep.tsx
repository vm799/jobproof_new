'use client'

import { CheckIcon } from '@heroicons/react/20/solid'

export default function SubmittedStep() {
  return (
    <div className="mt-8 space-y-5">
      <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-md text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckIcon className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-emerald-900">Evidence Submitted</h2>
        <p className="text-emerald-700 text-sm mt-2">Your manager has been notified. The evidence has been cryptographically sealed.</p>
      </div>
      <div className="bg-stone-100 p-5 rounded-md space-y-2">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Submitted evidence</h3>
        <ul className="text-xs text-stone-600 space-y-1">
          <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Before & after photo evidence</li>
          <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> GPS location & timestamp</li>
          <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Client digital signature</li>
          <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Cryptographic seal</li>
        </ul>
      </div>
    </div>
  )
}
