'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PlusIcon } from '@heroicons/react/20/solid'
import { ensureCsrfToken, csrfHeaders } from '@/lib/csrf-client'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { OnboardingFlow, shouldShowOnboarding } from './OnboardingFlow'
import { AccountMenu } from './AccountMenu'

interface Job {
  id: string
  title: string
  address: string | null
  crew_name: string | null
  crew_email: string | null
  status: string
  created_at: string
  sent_at: string | null
  accepted_at: string | null
  submitted_at: string | null
  completed_at: string | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  created: { label: 'Draft', color: 'bg-stone-200 text-stone-700' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800' },
  accepted: { label: 'Accepted', color: 'bg-amber-100 text-amber-800' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-800' },
  submitted: { label: 'Submitted', color: 'bg-emerald-100 text-emerald-800' },
  completed: { label: 'Completed', color: 'bg-slate-200 text-slate-700' },
}

export default function DashboardPage() {
  const router = useRouter()
  const { isOnline } = useOnlineStatus()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', address: '', instructions: '', crewName: '', crewEmail: '' })
  const [error, setError] = useState('')
  const [trial, setTrial] = useState<{ expired: boolean; daysLeft: number } | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch {
      setError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    ensureCsrfToken()
    loadJobs()
    fetch('/api/trial').then(r => r.json()).then(setTrial).catch(() => {})
    if (shouldShowOnboarding()) setShowOnboarding(true)
  }, [loadJobs])

  // Focus trap + escape key for modal
  useEffect(() => {
    if (!showCreate) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowCreate(false); return }
      if (e.key !== 'Tab' || !modalRef.current) return
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'input, textarea, button, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    // Auto-focus first input
    const timer = setTimeout(() => {
      modalRef.current?.querySelector<HTMLElement>('input')?.focus()
    }, 50)
    return () => { document.removeEventListener('keydown', handleKeyDown); clearTimeout(timer) }
  }, [showCreate])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setCreating(true)
    setError('')

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: csrfHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create')
      }
      const data = await res.json()
      setForm({ title: '', address: '', instructions: '', crewName: '', crewEmail: '' })
      setShowCreate(false)
      // Navigate to job detail so user can send to crew
      if (data.job?.id) {
        router.push(`/dashboard/job/${data.job.id}`)
        return
      }
      loadJobs()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setCreating(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', headers: csrfHeaders() })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {showOnboarding && <OnboardingFlow onDone={() => setShowOnboarding(false)} />}
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="JobProof" width={26} height={26} priority />
          <h1 className="text-sm font-bold tracking-wide">JobProof</h1>
          <span
            role="status"
            aria-live="polite"
            title={isOnline ? 'Online — data syncing' : 'Offline — data saved locally'}
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isOnline
                ? 'bg-emerald-900 text-emerald-300'
                : 'bg-amber-900 text-amber-300'
            }`}
          >
            <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/faq"
            className="text-stone-300 hover:text-white text-xs font-medium px-2 py-1 rounded transition-colors hidden md:block"
          >
            FAQ
          </Link>
          <Link
            href="/roadmap"
            className="text-stone-300 hover:text-white text-xs font-medium px-2 py-1 rounded transition-colors hidden md:block"
          >
            Roadmap
          </Link>
          <a
            href="mailto:vaishaligor25@gmail.com"
            className="text-stone-300 hover:text-white text-xs font-medium px-2 py-1 rounded transition-colors hidden md:block"
          >
            Help
          </a>
          <Link
            href="/upgrade"
            className="text-amber-400 hover:text-amber-300 text-xs font-bold px-2 py-1 rounded transition-colors hidden sm:block"
          >
            Upgrade
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New Job
          </button>
          <AccountMenu onLogout={handleLogout} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        {trial?.expired && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-md text-sm mb-4">
            <p className="font-bold">Your 14-day free trial has ended</p>
            <p className="text-red-600 text-xs mt-1">Upgrade your plan to continue creating and sending jobs.</p>
          </div>
        )}
        {trial && !trial.expired && trial.daysLeft <= 5 && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 p-3 rounded-md text-sm mb-4">
            <span className="font-bold">{trial.daysLeft} day{trial.daysLeft !== 1 ? 's' : ''}</span> left on your free trial.
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm mb-4">{error}</div>
        )}

        {/* Create Job Modal */}
        {showCreate && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}
          >
            <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Create New Job" className="bg-white rounded-md shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Create New Job</h2>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm mb-3">{error}</div>
              )}
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Job Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Roof repair at 123 Main St"
                    required
                    className="w-full mt-1 px-3 py-2.5 border-2 border-stone-300 rounded-md text-sm focus:border-amber-500 outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Job site address"
                    className="w-full mt-1 px-3 py-2.5 border-2 border-stone-300 rounded-md text-sm focus:border-amber-500 outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Instructions</label>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => setForm(f => ({ ...f, instructions: e.target.value }))}
                    placeholder="What needs to be done?"
                    rows={3}
                    className="w-full mt-1 px-3 py-2.5 border-2 border-stone-300 rounded-md text-sm focus:border-amber-500 outline-none text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Crew Name</label>
                    <input
                      type="text"
                      value={form.crewName}
                      onChange={(e) => setForm(f => ({ ...f, crewName: e.target.value }))}
                      placeholder="Who's doing the work?"
                      className="w-full mt-1 px-3 py-2.5 border-2 border-stone-300 rounded-md text-sm focus:border-amber-500 outline-none text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Crew Email</label>
                    <input
                      type="email"
                      value={form.crewEmail}
                      onChange={(e) => setForm(f => ({ ...f, crewEmail: e.target.value }))}
                      placeholder="crew@email.com"
                      className="w-full mt-1 px-3 py-2.5 border-2 border-stone-300 rounded-md text-sm focus:border-amber-500 outline-none text-slate-900"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 border-2 border-stone-300 py-2.5 rounded-md font-medium text-stone-600 hover:border-stone-400 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 py-2.5 rounded-md font-bold text-sm disabled:opacity-50 transition-colors"
                  >
                    {creating ? 'Creating...' : 'Create Job'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Job List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-amber-500 rounded-full mx-auto"></div>
            <p className="text-stone-400 text-sm mt-3">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mx-auto">
              <PlusIcon className="w-8 h-8 text-stone-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No jobs yet</h2>
            <p className="text-stone-500 text-sm">Create your first job to send to your crew.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-6 py-2.5 rounded-md font-bold text-sm transition-colors"
            >
              Create First Job
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wide">{jobs.length} Job{jobs.length !== 1 ? 's' : ''}</h2>
            {jobs.map((job) => {
              const status = STATUS_LABELS[job.status] || STATUS_LABELS.created
              return (
                <Link
                  key={job.id}
                  href={`/dashboard/job/${job.id}`}
                  className="block bg-white rounded-md shadow-sm border border-stone-100 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{job.title}</h3>
                      {job.address && <p className="text-stone-500 text-xs mt-0.5 truncate">{job.address}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        {job.crew_name && <span className="text-stone-400 text-xs">{job.crew_name}</span>}
                        <span className="text-stone-300 text-xs">{new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
