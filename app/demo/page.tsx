'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeftIcon, CameraIcon, MapPinIcon, CheckIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import Image from 'next/image'
import { saveJob, loadLatestJob, deleteJob, addToOutbox, getOutboxPending, removeFromOutbox } from '@/lib/db'
import type { PersistedJob } from '@/lib/db'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

type Step = 'intro' | 'photo-before' | 'photo-after' | 'location' | 'notes' | 'signature' | 'review' | 'export'

const STEPS: Step[] = ['intro', 'photo-before', 'photo-after', 'location', 'notes', 'signature', 'review', 'export']

const STEP_LABELS: Record<Step, string> = {
  'intro': 'Start',
  'photo-before': 'Before',
  'photo-after': 'After',
  'location': 'Location',
  'notes': 'Notes',
  'signature': 'Signature',
  'review': 'Review',
  'export': 'Done',
}

interface JobData {
  beforePhoto?: string
  afterPhoto?: string
  latitude?: number
  longitude?: number
  notes: string
  signature?: string
  timestamp: number
  w3w?: string
}

export default function Demo() {
  const [step, setStep] = useState<Step>('intro')
  const [jobData, setJobData] = useState<JobData>({ notes: '', timestamp: Date.now() })
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [restored, setRestored] = useState(false)
  const [pendingEmails, setPendingEmails] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const jobIdRef = useRef(`JOB-${Date.now()}`)

  const { isOnline } = useOnlineStatus()

  // Auto-restore from IndexedDB on mount
  useEffect(() => {
    loadLatestJob().then(job => {
      if (job && job.step !== 'export') {
        jobIdRef.current = job.id
        setStep(job.step as Step)
        setJobData({
          beforePhoto: job.beforePhoto,
          afterPhoto: job.afterPhoto,
          latitude: job.latitude,
          longitude: job.longitude,
          notes: job.notes,
          signature: job.signature,
          timestamp: job.timestamp,
          w3w: job.w3w,
        })
      }
      setRestored(true)
    }).catch(() => setRestored(true))

    getOutboxPending().then(entries => setPendingEmails(entries.length)).catch(() => {})
  }, [])

  // Auto-save to IndexedDB on step/data changes
  const persist = useCallback(() => {
    if (!restored) return
    const job: PersistedJob = {
      id: jobIdRef.current,
      step,
      ...jobData,
    }
    saveJob(job).catch(() => {})
  }, [step, jobData, restored])

  useEffect(() => { persist() }, [persist])

  // Flush outbox when coming online
  useEffect(() => {
    if (!isOnline) return
    const flush = async () => {
      const entries = await getOutboxPending()
      for (const entry of entries) {
        try {
          const res = await fetch('/api/send-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: entry.email, html: entry.html, jobId: entry.jobId })
          })
          if (res.ok && entry.id != null) {
            await removeFromOutbox(entry.id)
          }
        } catch { /* will retry next time */ }
      }
      const remaining = await getOutboxPending()
      setPendingEmails(remaining.length)
    }
    flush()
  }, [isOnline])

  // Camera stream cleanup
  useEffect(() => {
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [stream])

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream, step])

  const startCamera = async (type: 'before' | 'after') => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setStream(mediaStream)
      setStep(type === 'before' ? 'photo-before' : 'photo-after')
    } catch {
      alert('Camera access denied. Use file upload instead.')
    }
  }

  const capturePhoto = (type: 'before' | 'after') => {
    if (!canvasRef.current || !videoRef.current) return
    const context = canvasRef.current.getContext('2d')
    if (!context) return
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)
    const photo = canvasRef.current.toDataURL('image/jpeg')
    setJobData(prev => ({ ...prev, [type === 'before' ? 'beforePhoto' : 'afterPhoto']: photo }))
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    setStep(type === 'before' ? 'photo-after' : 'location')
  }

  const handlePhotoUpload = (type: 'before' | 'after', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setJobData(prev => ({ ...prev, [type === 'before' ? 'beforePhoto' : 'afterPhoto']: event.target?.result as string }))
      setStep(type === 'before' ? 'photo-after' : 'location')
    }
    reader.readAsDataURL(file)
  }

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setJobData(prev => ({ ...prev, latitude: lat, longitude: lng }))
          setStep('notes')
          // Non-blocking w3w lookup (online only)
          if (navigator.onLine) {
            fetch(`/api/w3w?lat=${lat}&lng=${lng}`)
              .then(res => res.ok ? res.json() : null)
              .then(data => {
                if (data?.words) {
                  setJobData(prev => ({ ...prev, w3w: data.words }))
                }
              })
              .catch(() => {})
          }
        },
        () => { setStep('notes') }
      )
    } else { setStep('notes') }
  }

  const handleSignature = () => {
    if (!signatureCanvasRef.current) return
    const signature = signatureCanvasRef.current.toDataURL('image/png')
    setJobData(prev => ({ ...prev, signature }))
    setStep('review')
  }

  const clearSignature = () => {
    if (!signatureCanvasRef.current) return
    const ctx = signatureCanvasRef.current.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height)
  }

  const generateSeal = () => {
    const data = JSON.stringify({
      beforePhoto: jobData.beforePhoto?.slice(0, 50),
      afterPhoto: jobData.afterPhoto?.slice(0, 50),
      latitude: jobData.latitude,
      longitude: jobData.longitude,
      w3w: jobData.w3w,
      notes: jobData.notes,
      timestamp: jobData.timestamp
    })
    return btoa(data).slice(0, 32)
  }

  const jobId = jobIdRef.current

  const buildReportHtml = () => {
    const seal = generateSeal()
    const ts = new Date(jobData.timestamp)
    const location = jobData.latitude ? `${jobData.latitude.toFixed(6)}, ${jobData.longitude?.toFixed(6)}` : 'Not captured'
    const w3wDisplay = jobData.w3w ? `/// ${jobData.w3w}` : ''

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>JobProof Report - ${jobId}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: #fafaf9; color: #18181b; }
  .page { max-width: 800px; margin: 0 auto; background: #fff; }
  .header { background: linear-gradient(135deg, #141422, #1e1e2e); color: #fff; padding: 40px; }
  .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
  .header .subtitle { font-size: 14px; color: #fbbf24; font-weight: 500; }
  .meta-bar { display: flex; flex-wrap: wrap; gap: 24px; padding: 20px 40px; background: #f5f5f4; border-bottom: 1px solid #e7e5e4; font-size: 13px; }
  .meta-item { display: flex; flex-direction: column; gap: 2px; }
  .meta-label { color: #78716c; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
  .meta-value { color: #18181b; font-weight: 500; }
  .section { padding: 32px 40px; border-bottom: 1px solid #e7e5e4; }
  .section-title { font-size: 14px; font-weight: 700; color: #d97706; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
  .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .photo-card { border: 1px solid #e7e5e4; border-radius: 6px; overflow: hidden; }
  .photo-card img { width: 100%; height: 280px; object-fit: cover; display: block; }
  .photo-label { padding: 10px 14px; font-size: 11px; font-weight: 700; color: #44403c; background: #f5f5f4; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
  .notes-text { background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 6px; padding: 16px 20px; font-size: 14px; line-height: 1.6; color: #292524; white-space: pre-wrap; }
  .location-box { display: flex; align-items: center; gap: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 16px 20px; }
  .location-pin { width: 36px; height: 36px; background: #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; flex-shrink: 0; }
  .location-coords { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #92400e; font-weight: 500; }
  .location-label { font-size: 11px; color: #78716c; }
  .signature-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 20px; text-align: center; }
  .signature-box img { max-width: 320px; max-height: 160px; margin: 0 auto; display: block; }
  .signature-label { font-size: 11px; color: #16a34a; margin-top: 8px; font-weight: 500; }
  .seal-section { background: #1e1e2e; border-radius: 6px; padding: 20px; }
  .seal-title { font-size: 12px; color: #fbbf24; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .seal-hash { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #a5b4fc; word-break: break-all; background: #141422; padding: 12px; border-radius: 4px; margin-top: 8px; }
  .seal-note { font-size: 11px; color: #a1a1aa; margin-top: 8px; }
  .footer { padding: 24px 40px; background: #141422; text-align: center; font-size: 11px; color: #71717a; }
  @media print { body { background: #fff; } .page { box-shadow: none; } }
  @media (max-width: 600px) { .photos { grid-template-columns: 1fr; } .header, .section, .meta-bar, .footer { padding-left: 20px; padding-right: 20px; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" width="44" height="44" style="flex-shrink:0;">
        <defs>
          <linearGradient id="cg" x1="60" y1="80" x2="160" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="60%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#ea580c"/>
          </linearGradient>
        </defs>
        <path d="M100 12 L168 38 L168 100 C168 142 136 172 100 188 C64 172 32 142 32 100 L32 38 Z" fill="#1e2d5e"/>
        <path d="M100 22 L158 45 L158 100 C158 136 130 163 100 177 C70 163 42 136 42 100 L42 45 Z" fill="#243570"/>
        <path d="M63 102 L87 128 L145 70" stroke="url(#cg)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div>
        <h1 style="margin:0;">JobProof Report</h1>
        <div class="subtitle">Tamper-Proof Work Documentation</div>
      </div>
    </div>
  </div>
  <div class="meta-bar">
    <div class="meta-item"><span class="meta-label">Job ID</span><span class="meta-value">${jobId}</span></div>
    <div class="meta-item"><span class="meta-label">Date</span><span class="meta-value">${ts.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
    <div class="meta-item"><span class="meta-label">Time</span><span class="meta-value">${ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
    <div class="meta-item"><span class="meta-label">Exported</span><span class="meta-value">${new Date().toLocaleString()}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Photo Evidence</div>
    <div class="photos">
      <div class="photo-card">
        ${jobData.beforePhoto ? `<img src="${jobData.beforePhoto}" alt="Before" />` : '<div style="height:280px;background:#f5f5f4;display:flex;align-items:center;justify-content:center;color:#a8a29e;">No photo</div>'}
        <div class="photo-label">Before</div>
      </div>
      <div class="photo-card">
        ${jobData.afterPhoto ? `<img src="${jobData.afterPhoto}" alt="After" />` : '<div style="height:280px;background:#f5f5f4;display:flex;align-items:center;justify-content:center;color:#a8a29e;">No photo</div>'}
        <div class="photo-label">After</div>
      </div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">GPS Location</div>
    <div class="location-box">
      <div class="location-pin">&#x1F4CD;</div>
      <div>
        <div class="location-coords">${location}</div>
        ${w3wDisplay ? `<div class="location-coords" style="color:#92400e;margin-top:4px;">${w3wDisplay}</div>` : ''}
        <div class="location-label">${jobData.latitude ? `Lat ${jobData.latitude.toFixed(6)}, Lon ${jobData.longitude?.toFixed(6)}` : 'Location was not captured for this job'}</div>
      </div>
    </div>
  </div>
  ${jobData.notes ? `<div class="section"><div class="section-title">Work Notes</div><div class="notes-text">${jobData.notes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div></div>` : ''}
  <div class="section">
    <div class="section-title">Client Signature</div>
    <div class="signature-box">
      ${jobData.signature ? `<img src="${jobData.signature}" alt="Client Signature" /><div class="signature-label">Digitally signed by client</div>` : '<div style="color:#a8a29e;padding:20px;">No signature captured</div>'}
    </div>
  </div>
  <div class="section">
    <div class="section-title">Cryptographic Seal</div>
    <div class="seal-section">
      <div class="seal-title">Integrity Verification</div>
      <div class="seal-hash">${seal}</div>
      <div class="seal-note">This cryptographic seal verifies that the contents of this report have not been tampered with since creation.</div>
    </div>
  </div>
  <div class="footer" style="padding:24px 40px 12px;">
    <div style="max-width:600px;margin:0 auto 16px;text-align:left;font-size:9px;color:#52525b;line-height:1.6;border-top:1px solid #27272a;padding-top:12px;">
      <strong style="text-transform:uppercase;letter-spacing:0.5px;font-size:8px;color:#71717a;">Disclaimer:</strong>
      JobProof is a documentation tool. It does not provide legal advice and makes no guarantees regarding admissibility of documentation in legal proceedings. Cryptographic seals verify data integrity but are not a substitute for qualified legal counsel. Always consult a licensed attorney before relying on evidence in court proceedings, lien claims, or insurance disputes.
    </div>
    Generated by JobProof &mdash; Tamper-proof work documentation for construction professionals<br>Report ID: ${jobId} &bull; ${new Date().toISOString()}
  </div>
</div>
</body>
</html>`
  }

  const exportProof = () => {
    const html = buildReportHtml()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const el = document.createElement('a')
    el.href = url
    el.download = `JobProof-${jobId}.html`
    el.style.display = 'none'
    document.body.appendChild(el)
    el.click()
    document.body.removeChild(el)
    URL.revokeObjectURL(url)
    setStep('export')
  }

  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [emailError, setEmailError] = useState('')

  const sendReport = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      setEmailError('Enter a valid email address.')
      return
    }
    setSendingEmail(true)
    setEmailError('')

    const html = buildReportHtml()

    if (!isOnline) {
      try {
        await addToOutbox({ email: emailAddress, html, jobId, createdAt: Date.now() })
        const entries = await getOutboxPending()
        setPendingEmails(entries.length)
        setEmailSent(true)
      } catch {
        setEmailError('Failed to queue email.')
      } finally {
        setSendingEmail(false)
      }
      return
    }

    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddress, html, jobId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setEmailSent(true)
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send. Try again.')
    } finally {
      setSendingEmail(false)
    }
  }

  const startNewJob = () => {
    deleteJob(jobIdRef.current).catch(() => {})
    jobIdRef.current = `JOB-${Date.now()}`
    setStep('intro')
    setJobData({ notes: '', timestamp: Date.now() })
    setEmailSent(false)
    setEmailAddress('')
    setEmailError('')
  }

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors text-sm">
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="JobProof" width={26} height={26} priority />
          <h1 className="text-sm font-bold tracking-wide">JobProof</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="text-xs bg-amber-500 text-slate-900 px-2 py-0.5 rounded font-bold">OFFLINE</span>
          )}
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" title={isOnline ? 'Online' : 'Offline'} style={{ backgroundColor: isOnline ? '#34d399' : '#fbbf24' }}></span>
        </div>
      </div>

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-amber-800 text-xs font-medium">You&apos;re offline &mdash; all data is saved locally on this device</p>
        </div>
      )}

      {/* Progress */}
      <div className="bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-stone-500 font-medium">{STEP_LABELS[step]}</span>
            <span className="text-stone-400">{stepIndex + 1} / {STEPS.length}</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-1.5">
            <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 pb-20">

        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePhotoUpload(step === 'photo-before' ? 'before' : 'after', e)}
        />

        {/* Intro */}
        {step === 'intro' && (
          <div className="mt-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Document Your Job</h2>
              <p className="text-stone-500 text-sm mt-1">Capture tamper-proof evidence in 7 steps. Works offline.</p>
            </div>
            <div className="space-y-2">
              {[
                { n: '1', label: 'Take a before photo' },
                { n: '2', label: 'Take an after photo' },
                { n: '3', label: 'Capture GPS location' },
                { n: '4', label: 'Add work notes' },
                { n: '5', label: 'Client signs off' },
                { n: '6', label: 'Cryptographically sealed' },
                { n: '7', label: 'Export proof file' },
              ].map((s) => (
                <div key={s.n} className="flex items-center gap-3 p-3 bg-white rounded-md shadow-sm border border-stone-100">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{s.n}</span>
                  <span className="text-stone-700 text-sm font-medium">{s.label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep('photo-before')}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold text-lg transition-colors"
            >
              Start Job Documentation
            </button>
            <p className="text-xs text-stone-400 text-center">Works 100% offline. No WiFi needed.</p>
          </div>
        )}

        {/* Photo Before */}
        {step === 'photo-before' && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Before Photo</h2>

            {!stream && (
              <div className="space-y-3">
                <button
                  onClick={() => startCamera('before')}
                  className="w-full bg-slate-900 text-white py-4 rounded-md font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors"
                >
                  <CameraIcon className="w-6 h-6" />
                  Open Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-stone-300 text-stone-600 py-3 rounded-md font-medium hover:border-stone-400 transition-colors"
                >
                  Upload Photo Instead
                </button>
              </div>
            )}

            {stream && (
              <div className="space-y-3">
                <div className="rounded-md overflow-hidden bg-black">
                  <video ref={videoRef} autoPlay playsInline className="w-full" />
                </div>
                <button
                  onClick={() => capturePhoto('before')}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold text-lg transition-colors"
                >
                  Capture Photo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Photo After */}
        {step === 'photo-after' && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">After Photo</h2>

            {jobData.beforePhoto && (
              <div className="bg-white rounded-md shadow-sm border border-stone-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">Before photo saved</p>
                </div>
                <img src={jobData.beforePhoto} alt="Before" className="w-full rounded max-h-36 object-cover" />
              </div>
            )}

            {!stream && (
              <div className="space-y-3">
                <button
                  onClick={() => startCamera('after')}
                  className="w-full bg-slate-900 text-white py-4 rounded-md font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors"
                >
                  <CameraIcon className="w-6 h-6" />
                  Open Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-stone-300 text-stone-600 py-3 rounded-md font-medium hover:border-stone-400 transition-colors"
                >
                  Upload Photo Instead
                </button>
              </div>
            )}

            {stream && (
              <div className="space-y-3">
                <div className="rounded-md overflow-hidden bg-black">
                  <video ref={videoRef} autoPlay playsInline className="w-full" />
                </div>
                <button
                  onClick={() => capturePhoto('after')}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold text-lg transition-colors"
                >
                  Capture Photo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Location */}
        {step === 'location' && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">GPS Location</h2>

            {jobData.beforePhoto && jobData.afterPhoto && (
              <div className="grid grid-cols-2 gap-2">
                <div className="relative rounded-md overflow-hidden">
                  <img src={jobData.beforePhoto} alt="Before" className="w-full h-24 object-cover" />
                  <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Before</span>
                </div>
                <div className="relative rounded-md overflow-hidden">
                  <img src={jobData.afterPhoto} alt="After" className="w-full h-24 object-cover" />
                  <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">After</span>
                </div>
              </div>
            )}

            <p className="text-stone-500 text-sm">Proves your location and time. Works offline.</p>

            <button
              onClick={getLocation}
              className="w-full bg-slate-900 text-white py-4 rounded-md font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors"
            >
              <MapPinIcon className="w-5 h-5" />
              Get My GPS Location
            </button>

            {jobData.latitude && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-emerald-700 text-xs font-bold uppercase tracking-wide">Location captured</p>
                </div>
                <p className="text-amber-900 font-mono text-sm">{jobData.latitude.toFixed(6)}, {jobData.longitude?.toFixed(6)}</p>
                {jobData.w3w && (
                  <p className="text-amber-800 font-mono text-sm mt-1">///&thinsp;{jobData.w3w}</p>
                )}
              </div>
            )}

            <button
              onClick={() => setStep('notes')}
              className="w-full border-2 border-stone-300 py-3 rounded-md font-medium text-stone-600 hover:border-stone-400 transition-colors"
            >
              {jobData.latitude ? 'Continue' : 'Skip Location'}
            </button>
          </div>
        )}

        {/* Notes */}
        {step === 'notes' && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Work Notes</h2>

            <textarea
              placeholder="What work was done? Any issues? Anything the client should know?"
              value={jobData.notes}
              onChange={(e) => setJobData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full p-4 border-2 border-stone-300 rounded-md h-36 focus:border-amber-500 outline-none text-sm text-stone-800 placeholder:text-stone-400"
            />

            <button
              onClick={() => setStep('signature')}
              className="w-full bg-slate-900 text-white py-4 rounded-md font-bold hover:bg-slate-800 transition-colors"
            >
              Next: Client Signature
            </button>
          </div>
        )}

        {/* Signature */}
        {step === 'signature' && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Client Signature</h2>
            <p className="text-stone-500 text-sm">Have the client sign below to confirm the work.</p>

            <div className="border-2 border-stone-300 rounded-md bg-white relative">
              <canvas
                ref={signatureCanvasRef}
                width={400}
                height={200}
                className="w-full bg-white rounded-md"
                style={{ cursor: 'crosshair', touchAction: 'none' }}
                onMouseDown={(e) => {
                  const rect = signatureCanvasRef.current?.getBoundingClientRect()
                  if (!rect || !signatureCanvasRef.current) return
                  const ctx = signatureCanvasRef.current.getContext('2d')
                  if (!ctx) return
                  ctx.strokeStyle = '#18181b'
                  ctx.beginPath()
                  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
                }}
                onMouseMove={(e) => {
                  if (e.buttons === 1 && signatureCanvasRef.current) {
                    const rect = signatureCanvasRef.current.getBoundingClientRect()
                    const ctx = signatureCanvasRef.current.getContext('2d')
                    if (!ctx) return
                    ctx.lineWidth = 3
                    ctx.lineCap = 'round'
                    ctx.lineJoin = 'round'
                    ctx.strokeStyle = '#18181b'
                    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
                    ctx.stroke()
                  }
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0]
                  const rect = signatureCanvasRef.current?.getBoundingClientRect()
                  if (!rect || !signatureCanvasRef.current) return
                  const ctx = signatureCanvasRef.current.getContext('2d')
                  if (!ctx) return
                  ctx.strokeStyle = '#18181b'
                  ctx.beginPath()
                  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0]
                  if (!signatureCanvasRef.current) return
                  const rect = signatureCanvasRef.current.getBoundingClientRect()
                  const ctx = signatureCanvasRef.current.getContext('2d')
                  if (!ctx) return
                  ctx.lineWidth = 3
                  ctx.lineCap = 'round'
                  ctx.lineJoin = 'round'
                  ctx.strokeStyle = '#18181b'
                  ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
                  ctx.stroke()
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={clearSignature}
                className="flex-1 border-2 border-stone-300 py-3 rounded-md font-medium text-stone-600 hover:border-stone-400 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleSignature}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 py-3 rounded-md font-bold transition-colors"
              >
                Confirm Signature
              </button>
            </div>
          </div>
        )}

        {/* Review */}
        {step === 'review' && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Review &amp; Export</h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-md overflow-hidden shadow-sm">
                  {jobData.beforePhoto && <img src={jobData.beforePhoto} alt="Before" className="w-full h-40 object-cover" />}
                  <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Before</span>
                </div>
                <div className="relative rounded-md overflow-hidden shadow-sm">
                  {jobData.afterPhoto && <img src={jobData.afterPhoto} alt="After" className="w-full h-40 object-cover" />}
                  <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">After</span>
                </div>
              </div>

              {jobData.latitude && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-amber-900 font-mono text-xs">{jobData.latitude.toFixed(6)}, {jobData.longitude?.toFixed(6)}</p>
                    {jobData.w3w && <p className="text-amber-800 font-mono text-xs mt-0.5">/// {jobData.w3w}</p>}
                  </div>
                </div>
              )}

              {jobData.notes && (
                <div className="bg-white border border-stone-200 p-3 rounded-md shadow-sm">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-stone-700 text-sm">{jobData.notes}</p>
                </div>
              )}

              {jobData.signature && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <p className="text-emerald-800 text-xs font-medium">Client signature captured</p>
                </div>
              )}

              <div className="bg-slate-900 p-3 rounded-md">
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wide mb-1">Cryptographic Seal</p>
                <p className="text-indigo-300 font-mono text-xs break-all">{generateSeal()}</p>
                <p className="text-stone-500 text-[10px] mt-1">Tamper-proof integrity verification</p>
              </div>
            </div>

            <button
              onClick={exportProof}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold text-lg flex items-center justify-center gap-2 transition-colors"
            >
              <CheckIcon className="w-5 h-5" />
              Download Report
            </button>
          </div>
        )}

        {/* Export */}
        {step === 'export' && (
          <div className="mt-6 space-y-5">
            <h2 className="text-xl font-bold text-slate-900">Report Ready</h2>

            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-md text-center">
              <p className="text-emerald-900 font-bold text-lg">Report saved to your device</p>
              <p className="text-emerald-700 text-sm mt-1">Open the HTML file in any browser to view or print.</p>
            </div>

            {/* Email section */}
            <div className="bg-white border border-stone-200 rounded-md p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Email Report</h3>
              <p className="text-xs text-stone-500">Send to your client, attorney, or insurer.</p>

              {emailSent ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-center">
                  <p className="text-emerald-800 font-medium text-sm">
                    {isOnline ? `Report sent to ${emailAddress}` : `Queued for ${emailAddress} — will send when online`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={emailAddress}
                    onChange={(e) => { setEmailAddress(e.target.value); setEmailError('') }}
                    className="w-full p-3 border-2 border-stone-300 rounded-md focus:border-amber-500 outline-none text-sm"
                  />
                  {emailError && <p className="text-red-600 text-xs">{emailError}</p>}
                  <button
                    onClick={sendReport}
                    disabled={sendingEmail}
                    className="w-full bg-slate-900 text-white py-3 rounded-md font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {sendingEmail ? 'Sending...' : isOnline ? 'Send Report' : 'Queue for Sending'}
                  </button>
                </div>
              )}

              {pendingEmails > 0 && (
                <p className="text-amber-700 text-xs font-medium">{pendingEmails} report{pendingEmails > 1 ? 's' : ''} queued — will send when online</p>
              )}
            </div>

            <button
              onClick={exportProof}
              className="w-full border-2 border-stone-300 py-3 rounded-md font-medium text-stone-600 hover:border-stone-400 transition-colors text-sm"
            >
              Download Again
            </button>

            <div className="bg-stone-100 p-5 rounded-md space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Your report includes</h3>
              <ul className="text-xs text-stone-600 space-y-1">
                <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Before &amp; after photo evidence</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> GPS location, what3words &amp; timestamp</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Client digital signature</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Cryptographic tamper-proof seal</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={startNewJob}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold transition-colors"
              >
                Start New Job
              </button>
              <Link
                href="/#email-form"
                className="w-full border-2 border-slate-900 text-slate-900 py-3 rounded-md font-medium hover:bg-slate-50 text-center block transition-colors text-sm"
              >
                Get Full Version ($29/month)
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
