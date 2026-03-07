'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeftIcon, CheckIcon, MapPinIcon, ShareIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/20/solid'
import { ensureCsrfToken, csrfHeaders } from '@/lib/csrf-client'

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
  const [copied, setCopied] = useState(false)

  const shareOrCopy = useCallback(async (link: string, title: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: `Here's your job link for ${title}`, url: link })
        return
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // Clipboard API not available
    }
    setCopied(true)
    setMessage('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2500)
  }, [])

  useEffect(() => {
    ensureCsrfToken()
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
      const res = await fetch(`/api/jobs/${jobId}/send`, { method: 'POST', headers: csrfHeaders() })
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
        headers: csrfHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status: 'completed' })
      })
      const data = await res.json()
      if (data?.job) setJob(data.job)
    } catch (err) { console.warn('Failed to load job details:', err) }
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
          <div className="flex items-end gap-1">
            {STATUSES.map((s, i) => {
              const isActive = i <= statusIndex
              const isCurrent = s === job.status
              // Gradient: stone → amber → emerald as we progress
              const barColors = ['bg-stone-400', 'bg-amber-400', 'bg-amber-500', 'bg-yellow-500', 'bg-emerald-400', 'bg-emerald-500']
              const textColors = ['text-stone-600', 'text-amber-700', 'text-amber-700', 'text-yellow-700', 'text-emerald-700', 'text-emerald-700']
              // Bars rise progressively: 6px → 8px → 10px → 12px → 14px → 16px
              const heights = ['h-1.5', 'h-2', 'h-2.5', 'h-3', 'h-3.5', 'h-4']
              return (
                <div key={s} className="flex-1 flex flex-col items-center">
                  <div className={`w-full rounded-full transition-all ${isActive ? `${barColors[i]} ${heights[i]}` : 'bg-stone-200 h-1.5'} ${isCurrent ? 'ring-2 ring-offset-1 ring-amber-300' : ''}`}></div>
                  <p className={`text-[10px] mt-1.5 text-center leading-tight ${isActive ? `${textColors[i]} font-bold` : 'text-stone-400'}`}>
                    {STATUS_LABELS[s]}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Next Step Guide */}
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md text-sm">{message}</div>
        )}

        {job.status === 'created' && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-md p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-amber-500 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Send this job to your crew</h3>
                <p className="text-stone-600 text-xs mt-0.5">
                  {job.crew_email
                    ? `Email the job link to ${job.crew_email}, or copy the link to share manually.`
                    : 'Copy the crew link below and share it via text or email.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {job.crew_email && (
                <button
                  onClick={sendToCrewHandler}
                  disabled={sending}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 py-3 rounded-md font-bold text-sm disabled:opacity-50 transition-colors"
                >
                  {sending ? 'Sending...' : 'Send to Crew'}
                </button>
              )}
              <button
                onClick={() => shareOrCopy(crewLink, job.title)}
                className={`flex-1 py-3 rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
              >
                {copied ? <><ClipboardDocumentCheckIcon className="w-4 h-4" /> Copied!</> : <><ShareIcon className="w-4 h-4" /> Share Link</>}
              </button>
            </div>
          </div>
        )}

        {job.status === 'sent' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Waiting for crew to accept</h3>
                <p className="text-stone-600 text-xs mt-0.5">
                  Job was sent to {job.crew_email || 'your crew'}. They&apos;ll open the link and start documenting.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={sendToCrewHandler}
                disabled={sending}
                className="flex-1 border-2 border-blue-300 text-blue-700 py-2.5 rounded-md font-bold text-sm disabled:opacity-50 transition-colors hover:bg-blue-100"
              >
                {sending ? 'Sending...' : 'Resend Email'}
              </button>
              <button
                onClick={() => shareOrCopy(crewLink, job.title)}
                className={`flex-1 py-2.5 rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
              >
                {copied ? <><ClipboardDocumentCheckIcon className="w-4 h-4" /> Copied!</> : <><ShareIcon className="w-4 h-4" /> Share Link</>}
              </button>
            </div>
          </div>
        )}

        {(job.status === 'accepted' || job.status === 'in_progress') && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full flex-shrink-0 mt-0.5"></div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Crew is working</h3>
              <p className="text-stone-600 text-xs mt-0.5">
                {job.crew_name || 'Your crew'} is documenting the job. You&apos;ll get an email when evidence is submitted.
              </p>
            </div>
          </div>
        )}

        {job.status === 'submitted' && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-md p-5 space-y-3">
            <div className="flex items-start gap-3">
              <CheckIcon className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Evidence submitted — review and close</h3>
                <p className="text-stone-600 text-xs mt-0.5">Review the photos, GPS, signature, and seal below, then mark complete.</p>
              </div>
            </div>
            <button
              onClick={markComplete}
              disabled={completing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-md font-bold text-sm disabled:opacity-50 transition-colors"
            >
              {completing ? 'Completing...' : 'Mark Complete'}
            </button>
          </div>
        )}

        {job.status === 'completed' && (
          <div className="bg-slate-100 border border-slate-200 rounded-md p-4 flex items-start gap-3">
            <CheckIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Job completed</h3>
              <p className="text-stone-500 text-xs mt-0.5">This job is closed. Evidence is sealed and preserved below.</p>
            </div>
          </div>
        )}

        {/* Crew Link */}
        {job.crew_token && job.status !== 'created' && (
          <div className="bg-slate-900 rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wide">Crew Link</p>
              <button
                onClick={() => shareOrCopy(crewLink, job.title)}
                className={`text-xs transition-colors flex items-center gap-1 ${copied ? 'text-emerald-400' : 'text-stone-400 hover:text-white'}`}
              >
                {copied ? <><ClipboardDocumentCheckIcon className="w-3 h-3" /> Copied</> : <><ShareIcon className="w-3 h-3" /> Share</>}
              </button>
            </div>
            <p className="text-stone-300 text-xs font-mono break-all select-all">{crewLink}</p>
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
                  {job.w3w && <p className="text-amber-800 font-mono text-xs mt-0.5">{'///'} {job.w3w}</p>}
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
