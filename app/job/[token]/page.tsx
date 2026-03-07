'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { saveJob, loadJob, deleteJob } from '@/lib/db'
import StepProgressBar from './components/StepProgressBar'
import JobDetailsStep from './components/JobDetailsStep'
import PhotoCaptureStep from './components/PhotoCaptureStep'
import LocationStep from './components/LocationStep'
import NotesStep from './components/NotesStep'
import SignaturePadStep from './components/SignaturePadStep'
import ReviewStep from './components/ReviewStep'
import SubmittedStep from './components/SubmittedStep'

type Step = 'job-details' | 'photo-before' | 'photo-after' | 'location' | 'notes' | 'signature' | 'review' | 'submitted'

const STEPS: Step[] = ['job-details', 'photo-before', 'photo-after', 'location', 'notes', 'signature', 'review', 'submitted']

interface JobInfo {
  id: string
  title: string
  address: string | null
  instructions: string | null
  crew_name: string | null
  status: string
}

interface EvidenceData {
  beforePhoto?: string
  afterPhoto?: string
  latitude?: number
  longitude?: number
  w3w?: string
  notes: string
  signature?: string
  timestamp: number
}

export default function CrewJobPage() {
  const params = useParams()
  const token = params.token as string
  const { isOnline } = useOnlineStatus()

  const [step, setStep] = useState<Step>('job-details')
  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null)
  const [evidence, setEvidence] = useState<EvidenceData>({ notes: '', timestamp: Date.now() })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittedOnline, setSubmittedOnline] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)

  // Load job info + check for pending offline evidence
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`/api/crew/${token}`)
        const data = await res.json()
        if (data.job) {
          setJobInfo(data.job)
          if (data.job.status === 'accepted' || data.job.status === 'in_progress') {
            setStep('photo-before')
          } else if (data.job.status === 'submitted' || data.job.status === 'completed') {
            setStep('submitted')
          }
        } else {
          setError('Job not found')
        }
      } catch {
        setError('Failed to load job')
      }

      // Restore pending evidence from IndexedDB (survives app close)
      try {
        const pending = await loadJob(`pending-${token}`)
        if (pending) {
          setEvidence({
            beforePhoto: pending.beforePhoto,
            afterPhoto: pending.afterPhoto,
            latitude: pending.latitude,
            longitude: pending.longitude,
            w3w: pending.w3w,
            notes: pending.notes,
            signature: pending.signature,
            timestamp: pending.timestamp,
          })
          setSubmittedOnline(false)
          setStep('submitted')
        }
      } catch {
        // IndexedDB not available — proceed normally
      }

      setLoading(false)
    }
    init()
  }, [token])

  // Camera cleanup
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
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)
    const photo = canvasRef.current.toDataURL('image/jpeg')
    setEvidence(prev => ({ ...prev, [type === 'before' ? 'beforePhoto' : 'afterPhoto']: photo }))
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    setStep(type === 'before' ? 'photo-after' : 'location')
  }

  const handlePhotoUpload = (type: 'before' | 'after', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setEvidence(prev => ({ ...prev, [type === 'before' ? 'beforePhoto' : 'afterPhoto']: event.target?.result as string }))
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
          setEvidence(prev => ({ ...prev, latitude: lat, longitude: lng }))
          setStep('notes')
          if (navigator.onLine) {
            fetch(`/api/w3w?lat=${lat}&lng=${lng}`)
              .then(res => res.ok ? res.json() : null)
              .then(data => { if (data?.words) setEvidence(prev => ({ ...prev, w3w: data.words })) })
              .catch(() => {})
          }
        },
        () => { setStep('notes') }
      )
    } else { setStep('notes') }
  }

  const handleSignature = () => {
    if (!signatureCanvasRef.current) return
    const sig = signatureCanvasRef.current.toDataURL('image/png')
    setEvidence(prev => ({ ...prev, signature: sig }))
    setStep('review')
  }

  const clearSignature = () => {
    if (!signatureCanvasRef.current) return
    const ctx = signatureCanvasRef.current.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height)
  }

  const generateSeal = useCallback(() => {
    const data = JSON.stringify({
      beforePhoto: evidence.beforePhoto?.slice(0, 50),
      afterPhoto: evidence.afterPhoto?.slice(0, 50),
      latitude: evidence.latitude,
      longitude: evidence.longitude,
      w3w: evidence.w3w,
      notes: evidence.notes,
      timestamp: evidence.timestamp
    })
    return btoa(data).slice(0, 32)
  }, [evidence])

  const acceptJob = async () => {
    setAccepting(true)
    try {
      const res = await fetch(`/api/crew/${token}/accept`, { method: 'POST' })
      if (res.ok) {
        setStep('photo-before')
        if (jobInfo) setJobInfo({ ...jobInfo, status: 'accepted' })
      }
    } catch (err) { console.warn('Offline or network error, proceeding:', err); setStep('photo-before') }
    finally { setAccepting(false) }
  }

  const submitEvidence = async () => {
    setSubmitting(true)
    const seal = generateSeal()
    let didSubmitOnline = false

    try {
      if (isOnline) {
        await fetch(`/api/crew/${token}/evidence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            before_photo: evidence.beforePhoto,
            after_photo: evidence.afterPhoto,
            latitude: evidence.latitude,
            longitude: evidence.longitude,
            w3w: evidence.w3w,
            notes: evidence.notes,
            signature: evidence.signature,
            seal,
          })
        })
        await fetch(`/api/crew/${token}/submit`, { method: 'POST' })
        didSubmitOnline = true
        // Clean up any pending IndexedDB entry
        try { await deleteJob(`pending-${token}`) } catch {}
      }
    } catch {
      // Offline or network error
    }

    // If not submitted online, persist evidence to IndexedDB so it survives app close
    if (!didSubmitOnline) {
      try {
        await saveJob({
          id: `pending-${token}`,
          step: 'submitted',
          beforePhoto: evidence.beforePhoto,
          afterPhoto: evidence.afterPhoto,
          latitude: evidence.latitude,
          longitude: evidence.longitude,
          w3w: evidence.w3w,
          notes: evidence.notes,
          signature: evidence.signature,
          timestamp: evidence.timestamp,
        })
      } catch {
        // IndexedDB not available — evidence stays in memory only
      }
    }

    setSubmittedOnline(didSubmitOnline)
    setStep('submitted')
    setSubmitting(false)
  }

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-amber-500 rounded-full"></div>
      </div>
    )
  }

  if (error || !jobInfo) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-stone-500">{error || 'Job not found'}</p>
          <p className="text-stone-400 text-sm">This job link may be invalid or expired.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="JobProof" width={26} height={26} priority />
          <h1 className="text-sm font-bold tracking-wide">JobProof</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="text-xs bg-amber-500 text-slate-900 px-2 py-0.5 rounded font-bold">OFFLINE</span>
          )}
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: isOnline ? '#34d399' : '#fbbf24' }}></span>
        </div>
      </div>

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-amber-800 text-xs font-medium">You&apos;re offline &mdash; all data is saved locally</p>
        </div>
      )}

      {/* Progress */}
      <StepProgressBar step={step} stepIndex={stepIndex} totalSteps={STEPS.length} progress={progress} />

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

        {step === 'job-details' && (
          <JobDetailsStep jobInfo={jobInfo} accepting={accepting} onAccept={acceptJob} />
        )}

        {step === 'photo-before' && (
          <PhotoCaptureStep
            type="before"
            stream={stream}
            videoRef={videoRef}
            fileInputRef={fileInputRef}
            onStartCamera={startCamera}
            onCapturePhoto={capturePhoto}
            onFileUploadClick={() => fileInputRef.current?.click()}
          />
        )}

        {step === 'photo-after' && (
          <PhotoCaptureStep
            type="after"
            stream={stream}
            videoRef={videoRef}
            fileInputRef={fileInputRef}
            beforePhoto={evidence.beforePhoto}
            onStartCamera={startCamera}
            onCapturePhoto={capturePhoto}
            onFileUploadClick={() => fileInputRef.current?.click()}
          />
        )}

        {step === 'location' && (
          <LocationStep
            beforePhoto={evidence.beforePhoto}
            afterPhoto={evidence.afterPhoto}
            latitude={evidence.latitude}
            longitude={evidence.longitude}
            w3w={evidence.w3w}
            onGetLocation={getLocation}
            onContinue={() => setStep('notes')}
          />
        )}

        {step === 'notes' && (
          <NotesStep
            notes={evidence.notes}
            onNotesChange={(notes) => setEvidence(prev => ({ ...prev, notes }))}
            onNext={() => setStep('signature')}
          />
        )}

        {step === 'signature' && (
          <SignaturePadStep
            signatureCanvasRef={signatureCanvasRef}
            onConfirm={handleSignature}
            onClear={clearSignature}
          />
        )}

        {step === 'review' && (
          <ReviewStep
            beforePhoto={evidence.beforePhoto}
            afterPhoto={evidence.afterPhoto}
            latitude={evidence.latitude}
            longitude={evidence.longitude}
            w3w={evidence.w3w}
            notes={evidence.notes}
            signature={evidence.signature}
            seal={generateSeal()}
            submitting={submitting}
            onSubmit={submitEvidence}
          />
        )}

        {step === 'submitted' && (
          <SubmittedStep
            evidence={evidence}
            token={token}
            jobTitle={jobInfo.title}
            submittedOnline={submittedOnline}
          />
        )}
      </div>
    </div>
  )
}
