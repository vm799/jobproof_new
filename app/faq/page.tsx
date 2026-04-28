import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheckIcon } from '@heroicons/react/20/solid'

const FAQS = [
  {
    q: 'Does it really work with no internet?',
    a: '100%. Photos, GPS coordinates, client signatures, and notes are all captured and saved locally on the device. When the crew gets back online — even hours or days later — everything syncs automatically. Nothing is lost.',
  },
  {
    q: 'How does the cryptographic seal work?',
    a: 'When a job is submitted, a SHA-256 hash is calculated across every piece of evidence: the photos, GPS data, timestamp, client signature, and notes. That hash is stored with the report. If anyone modifies even one pixel of a photo after submission, the hash no longer matches — the tampering is immediately visible to anyone who verifies the report.',
  },
  {
    q: 'Can a client sign on-site with no WiFi?',
    a: 'Yes. The signature pad works completely offline. The client draws their signature directly on the phone or tablet screen. It is captured as part of the sealed evidence package.',
  },
  {
    q: 'Does my crew need to download an app?',
    a: 'No. The manager sends the crew a link via text or email. The crew opens it in their phone browser — no download, no account, no login required. It works on any smartphone.',
  },
  {
    q: 'Can I use this for insurance claims or disputes?',
    a: 'JobProof is designed for exactly this. The report includes timestamped GPS coordinates, before-and-after photos, client signature, and a tamper-evident seal. We recommend keeping a copy of the report and consulting a solicitor if you need to use it in a formal dispute.',
  },
  {
    q: 'What happens if the crew forgets to sync?',
    a: 'Data persists locally even if the app is closed or the phone restarts. The next time the device connects to the internet — on WiFi, 4G, or 5G — the submission uploads automatically.',
  },
  {
    q: 'Is there a limit on photos per job?',
    a: 'No. Capture as many before and after photos as the job needs. All photos are included in the sealed evidence report.',
  },
  {
    q: 'I bought the AppSumo lifetime deal. How do I activate it?',
    a: 'Go to Settings → Redeem AppSumo code, or visit /upgrade/redeem directly. Enter your code and it activates immediately — no subscription required.',
  },
  {
    q: 'Can I have multiple team members using one account?',
    a: 'The Solo plan (£29 LTD) covers 1 manager account with up to 50 jobs. The Team plan (£99 LTD) covers up to 5 manager accounts with unlimited jobs. Enterprise (£299 LTD) is unlimited managers and jobs.',
  },
  {
    q: 'What if I have a problem or question?',
    a: 'Email vaishaligor25@gmail.com. Response within 24 hours Monday to Friday. P1 issues (app down) are targeted for same-day fix.',
  },
]

export default function FAQPage() {
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
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheckIcon className="w-7 h-7 text-amber-500" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h1>
        </div>
        <p className="text-stone-500 text-sm mb-8">Everything you need to know about how JobProof works.</p>

        <div className="space-y-4">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
              <h2 className="font-bold text-slate-900 text-sm mb-2">{q}</h2>
              <p className="text-stone-600 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-slate-900 rounded-xl p-6 text-center">
          <p className="text-white font-bold text-sm mb-1">Still have a question?</p>
          <p className="text-stone-400 text-sm mb-4">Email support, 24-hour response Monday to Friday.</p>
          <a
            href="mailto:vaishaligor25@gmail.com"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            vaishaligor25@gmail.com
          </a>
        </div>

        <div className="text-center mt-6 space-x-4 text-xs text-stone-400">
          <Link href="/settings" className="hover:text-stone-600 transition-colors">Settings</Link>
          <Link href="/roadmap" className="hover:text-stone-600 transition-colors">Roadmap</Link>
          <Link href="/dashboard" className="hover:text-stone-600 transition-colors">Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
