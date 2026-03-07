'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import Image from 'next/image'
import { saveJob, loadLatestJob, deleteJob, addToOutbox, getOutboxPending, removeFromOutbox } from '@/lib/db'
import type { PersistedJob } from '@/lib/db'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import type { Step, JobData } from './types'
import { generateSeal } from './utils/sealGeneration'
import { buildReportHtml } from './utils/reportHtml'
import StepProgressBar from './components/StepProgressBar'
import IntroStep from './components/IntroStep'
import PhotoStep from './components/PhotoStep'
import LocationStep from './components/LocationStep'
import NotesStep from './components/NotesStep'
import SignatureStep from './components/SignatureStep'
import ReviewStep from './components/ReviewStep'
import ExportStep from './components/ExportStep'

export default function Demo() {
  const [step, setStep] = useState<Step>('intro')
  const [jobData, setJobData] = useState<JobData>({ notes: '', timestamp: Date.now() })
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [restored, setRestored] = useState(false)
  const [pendingEmails, setPendingEmails] = useState(0)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [emailError, setEmailError] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const jobIdRef = useRef(`JOB-${Date.now()}`)

  const { isOnline } = useOnlineStatus()

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
        } catch (err) { console.warn('Outbox flush failed, will retry:', err) }
      }
      const remaining = await getOutboxPending()
      setPendingEmails(remaining.length)
    }
    flush()
  }, [isOnline])

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

  const jobId = jobIdRef.current

  const exportProof = () => {
    const html = buildReportHtml(jobData, jobId)
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

  const sendReport = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      setEmailError('Enter a valid email address.')
      return
    }
    setSendingEmail(true)
    setEmailError('')

    const html = buildReportHtml(jobData, jobId)

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

  return (
    <div className="min-h-screen bg-stone-50">
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

      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-amber-800 text-xs font-medium">You&apos;re offline &mdash; all data is saved locally on this device</p>
        </div>
      )}

      <StepProgressBar step={step} />

      <div className="max-w-2xl mx-auto p-4 pb-20">
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePhotoUpload(step === 'photo-before' ? 'before' : 'after', e)}
        />

        {step === 'intro' && (
          <IntroStep onStart={() => setStep('photo-before')} />
        )}

        {step === 'photo-before' && (
          <PhotoStep
            type="before"
            stream={stream}
            videoRef={videoRef}
            onStartCamera={startCamera}
            onCapturePhoto={capturePhoto}
            onUploadClick={() => fileInputRef.current?.click()}
          />
        )}

        {step === 'photo-after' && (
          <PhotoStep
            type="after"
            stream={stream}
            videoRef={videoRef}
            beforePhoto={jobData.beforePhoto}
            onStartCamera={startCamera}
            onCapturePhoto={capturePhoto}
            onUploadClick={() => fileInputRef.current?.click()}
          />
        )}

        {step === 'location' && (
          <LocationStep
            jobData={jobData}
            onGetLocation={getLocation}
            onContinue={() => setStep('notes')}
          />
        )}

        {step === 'notes' && (
          <NotesStep
            notes={jobData.notes}
            onNotesChange={(notes) => setJobData(prev => ({ ...prev, notes }))}
            onNext={() => setStep('signature')}
          />
        )}

        {step === 'signature' && (
          <SignatureStep
            signatureCanvasRef={signatureCanvasRef}
            onConfirm={handleSignature}
            onClear={clearSignature}
          />
        )}

        {step === 'review' && (
          <ReviewStep
            jobData={jobData}
            seal={generateSeal(jobData)}
            onExport={exportProof}
          />
        )}

        {step === 'export' && (
          <ExportStep
            isOnline={isOnline}
            emailAddress={emailAddress}
            emailSent={emailSent}
            emailError={emailError}
            sendingEmail={sendingEmail}
            pendingEmails={pendingEmails}
            onEmailChange={(email) => { setEmailAddress(email); setEmailError('') }}
            onSendReport={sendReport}
            onExportAgain={exportProof}
            onStartNewJob={startNewJob}
          />
        )}
      </div>
    </div>
  )
}
