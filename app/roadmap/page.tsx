import Link from 'next/link'
import Image from 'next/image'
import { CheckCircleIcon, ClockIcon, LightBulbIcon } from '@heroicons/react/20/solid'

const SHIPPED = [
  'Offline-first evidence capture — GPS, photos, notes, no WiFi needed',
  'Cryptographic SHA-256 seal on every submitted job',
  'Digital client signature captured on-site',
  'Automated PDF evidence report emailed to manager on submission',
  'Before & after photo capture flow',
  'Tamper-evident seal: hash breaks if any evidence is altered',
  'Crew access via link — no app download, no account required',
  'Manager dashboard — create jobs, track status, view submissions',
  'AppSumo lifetime deal — Solo, Team, Enterprise tiers',
  'AppSumo code redemption in-app',
  '14-day free trial for new signups',
]

const IN_PROGRESS = [
  'Evidence report export to PDF (court-ready format)',
  'Improved offline sync status indicator',
  'Settings page — subscription management, account details',
]

const PLANNED = [
  'Team management — invite crew members as named users',
  'Bulk job creation from CSV',
  'Evidence archive with search and filter',
  'Client portal — view your signed reports without logging in',
  'Slack and email notifications when crew submits',
  'Custom branding on reports (company logo, colours)',
  'API access for integration with your existing systems',
  'Mobile app (iOS + Android) — native offline mode',
]

function Section({
  icon,
  title,
  color,
  items,
}: {
  icon: React.ReactNode
  title: string
  color: string
  items: string[]
}) {
  return (
    <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
      <div className={`flex items-center gap-2 mb-4 ${color}`}>
        {icon}
        <h2 className="font-bold text-sm uppercase tracking-widest">{title}</h2>
      </div>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 items-start text-sm text-stone-700">
            <span className="mt-0.5 flex-shrink-0 text-stone-300" aria-hidden="true">–</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function RoadmapPage() {
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
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Product Roadmap</h1>
        <p className="text-stone-500 text-sm mb-8">
          What&apos;s shipped, what&apos;s being built, and what&apos;s coming next. Have a feature request?{' '}
          <a href="mailto:vaishaligor25@gmail.com" className="text-amber-600 hover:underline">
            Email us.
          </a>
        </p>

        <div className="space-y-5">
          <Section
            icon={<CheckCircleIcon className="w-5 h-5" aria-hidden="true" />}
            title="Shipped"
            color="text-emerald-700"
            items={SHIPPED}
          />
          <Section
            icon={<ClockIcon className="w-5 h-5" aria-hidden="true" />}
            title="In Progress"
            color="text-amber-700"
            items={IN_PROGRESS}
          />
          <Section
            icon={<LightBulbIcon className="w-5 h-5" aria-hidden="true" />}
            title="Planned"
            color="text-blue-700"
            items={PLANNED}
          />
        </div>

        <p className="text-center text-xs text-stone-400 mt-8">
          Roadmap reflects current intent. Order and dates may shift based on user feedback.
        </p>

        <div className="text-center mt-4 space-x-4 text-xs text-stone-400">
          <Link href="/settings" className="hover:text-stone-600 transition-colors">Settings</Link>
          <Link href="/faq" className="hover:text-stone-600 transition-colors">FAQ</Link>
          <Link href="/dashboard" className="hover:text-stone-600 transition-colors">Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
