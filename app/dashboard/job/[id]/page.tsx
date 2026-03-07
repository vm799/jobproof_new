'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeftIcon, CheckIcon, MapPinIcon } from '@heroicons/react/20/solid'

interface Job {
  id: string
  title: string
  address: string | null
  instructions: string | null
  crew_name: string | null
  crew_email: string | null
  crew_token: string
  status: string
  before_photo_url: string | null
  after_photo_url: string | null
  latitude: number | null
  longitude: number | null
  w3w: string | null
  notes: string | null
  signature_url: string | null
  seal: string | null
  created_at: string
  sent_at: string | null
  accepted_at: string | null
  submitted_at: string | null
  completed_at: string | null
}

const STATUSES = ['created', 'sent', 'accepted', 'in_progress', 'submitted', 'completed']
const STATUS_LABELS: Record<string, string> = {
  created: 'Created',
  sent: 'Sent to Crew',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  submitted: 'Evidence Submitted',
  completed: 'Completed',
}

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch(`/api/jobs/${jobId}`)
      .then(res => {
        if (res.status === 401) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => { if (data?.job) setJob(data.job) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [jobId, router])

  const sendToCrewHandler = async () => {
    setSending(true)
    setMessage('')
    try {
      const res = await fetch(`/api/jobs/${jobId}/send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setMessage(data.jobUrl ? `Sent! Crew link: ${data.jobUrl}` : 'Job sent to crew!')
      // Refresh job data
      const jobRes = await fetch(`/api/jobs/${jobId}`)
      const jobData = await jobRes.json()
      if (jobData?.job) setJob(jobData.job)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const markComplete = async () => {
    setCompleting(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      })
      const data = await res.json()
      if (data?.job) setJob(data.job)
    } catch { /* ignore */ }
    finally { setCompleting(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-amber-500 rounded-full"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-stone-500">Job not found.</p>
          <Link href="/dashboard" className="text-amber-600 text-sm font-bold">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const statusIndex = STATUSES.indexOf(job.status)
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const crewLink = `${appUrl}/job/${job.crew_token}`
  const hasEvidence = job.status === 'submitted' || job.status === 'completed'

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors text-sm">
          <ArrowLeftIcon className="w-4 h-4" />
          Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="JobProof" width={26} height={26} priority />
          <span className="text-sm font-bold">Job Detail</span>
        </div>
        <div className="w-20"></div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Title + Status */}
        <div className="bg-white rounded-md shadow-sm border border-stone-100 p-5">
          <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
          {job.address && <p className="text-stone-500 text-sm mt-1">{job.address}</p>}
          {job.instructions && (
            <div className="mt-3 bg-stone-50 border border-stone-200 rounded-md p-3">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Instructions</p>
              <p className="text-stone-700 text-sm whitespace-pre-wrap">{job.instructions}</p>
            </div>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs text-stone-400">
            {job.crew_name && <span>Crew: <strong className="text-stone-600">{job.crew_name}</strong></span>}
            {job.crew_email && <span>{job.crew_email}</span>}
            <span>Created {new Date(job.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-md shadow-sm border border-stone-100 p-5">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-3">Status</h3>
          <div className="flex items-center gap-1">
            {STATUSES.map((s, i) => {
              const isActive = i <= statusIndex
              const isCurrent = s === job.status
              return (
                <div key={s} className="flex-1">
                  <div className={`h-2 rounded-full ${isActive ? 'bg-amber-500' : 'bg-stone-200'} ${isCurrent ? 'ring-2 ring-amber-300' : ''}`}></div>
                  <p className={`text-[10px] mt-1 text-center ${isActive ? 'text-amber-700 font-bold' : 'text-stone-400'}`}>
                    {STATUS_LABELS[s]}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md text-sm">{message}</div>
        )}

        <div className="flex gap-3">
          {(job.status === 'created' || job.status === 'sent') && job.crew_email && (
            <button
              onClick={sendToCrewHandler}
              disabled={sending}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 py-3 rounded-md font-bold text-sm disabled:opacity-50 transition-colors"
            >
              {sending ? 'Sending...' : job.status === 'sent' ? 'Resend to Crew' : 'Send to Crew'}
            </button>
          )}
          {job.status === 'submitted' && (
            <button
              onClick={markComplete}
              disabled={completing}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-md font-bold text-sm disabled:opacity-50 transition-colors"
            >
              {completing ? 'Completing...' : 'Mark Complete'}
            </button>
          )}
        </div>

        {/* Crew Link */}
        {job.crew_token && (
          <div className="bg-slate-900 rounded-md p-4">
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wide mb-2">Crew Link</p>
            <p className="text-stone-300 text-xs font-mono break-all select-all">{crewLink}</p>
            <p className="text-stone-500 text-[10px] mt-2">Share this link with your crew. No login needed.</p>
          </div>
        )}

        {/* Evidence Section */}
        {hasEvidence && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wide">Evidence</h3>

            {/* Photos */}
            {(job.before_photo_url || job.after_photo_url) && (
              <div className="grid grid-cols-2 gap-3">
                {job.before_photo_url && (
                  <div className="relative rounded-md overflow-hidden shadow-sm">
                    <img src={job.before_photo_url} alt="Before" className="w-full h-40 object-cover" />
                    <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Before</span>
                  </div>
                )}
                {job.after_photo_url && (
                  <div className="relative rounded-md overflow-hidden shadow-sm">
                    <img src={job.after_photo_url} alt="After" className="w-full h-40 object-cover" />
                    <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">After</span>
                  </div>
                )}
              </div>
            )}

            {/* Location */}
            {job.latitude && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-amber-900 font-mono text-xs">{job.latitude.toFixed(6)}, {job.longitude?.toFixed(6)}</p>
                  {job.w3w && <p className="text-amber-800 font-mono text-xs mt-0.5">/// {job.w3w}</p>}
                </div>
              </div>
            )}

            {/* Notes */}
            {job.notes && (
              <div className="bg-white border border-stone-200 p-3 rounded-md shadow-sm">
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wide mb-1">Notes</p>
                <p className="text-stone-700 text-sm whitespace-pre-wrap">{job.notes}</p>
              </div>
            )}

            {/* Signature */}
            {job.signature_url && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-emerald-800 text-xs font-medium">Client signature captured</p>
              </div>
            )}

            {/* Seal */}
            {job.seal && (
              <div className="bg-slate-900 p-3 rounded-md">
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wide mb-1">Cryptographic Seal</p>
                <p className="text-indigo-300 font-mono text-xs break-all">{job.seal}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
