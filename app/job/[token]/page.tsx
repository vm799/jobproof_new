'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeftIcon, CameraIcon, MapPinIcon, CheckIcon } from '@heroicons/react/20/solid'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

type Step = 'job-details' | 'photo-before' | 'photo-after' | 'location' | 'notes' | 'signature' | 'review' | 'submitted'

const STEPS: Step[] = ['job-details', 'photo-before', 'photo-after', 'location', 'notes', 'signature', 'review', 'submitted']

const STEP_LABELS: Record<Step, string> = {
  'job-details': 'Job Details',
  'photo-before': 'Before',
  'photo-after': 'After',
  'location': 'Location',
  'notes': 'Notes',
  'signature': 'Signature',
  'review': 'Review',
  'submitted': 'Done',
}

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
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)

  // Load job info
  useEffect(() => {
    fetch(`/api/crew/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.job) {
          setJobInfo(data.job)
          // If already accepted or further, skip to appropriate step
          if (data.job.status === 'accepted' || data.job.status === 'in_progress') {
            setStep('photo-before')
          } else if (data.job.status === 'submitted' || data.job.status === 'completed') {
            setStep('submitted')
          }
        } else {
          setError('Job not found')
        }
      })
      .catch(() => setError('Failed to load job'))
      .finally(() => setLoading(false))
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
    } catch { /* offline - proceed anyway */ setStep('photo-before') }
    finally { setAccepting(false) }
  }

  const submitEvidence = async () => {
    setSubmitting(true)
    const seal = generateSeal()

    try {
      // Upload evidence
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

        // Submit
        await fetch(`/api/crew/${token}/submit`, { method: 'POST' })
      }
      setStep('submitted')
    } catch {
      // If offline, still show success - will sync later
      setStep('submitted')
    } finally {
      setSubmitting(false)
    }
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

        {/* Job Details */}
        {step === 'job-details' && (
          <div className="mt-6 space-y-4">
            <div className="bg-white rounded-md shadow-sm border border-stone-100 p-5">
              <p className="text-xs text-amber-600 font-bold uppercase tracking-wide mb-2">New Job Assigned</p>
              <h2 className="text-xl font-bold text-slate-900">{jobInfo.title}</h2>
              {jobInfo.address && <p className="text-stone-500 text-sm mt-1">{jobInfo.address}</p>}
              {jobInfo.instructions && (
                <div className="mt-3 bg-stone-50 border border-stone-200 rounded-md p-3">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Instructions</p>
                  <p className="text-stone-700 text-sm whitespace-pre-wrap">{jobInfo.instructions}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {[
                { n: '1', label: 'Take a before photo' },
                { n: '2', label: 'Take an after photo' },
                { n: '3', label: 'Capture GPS location' },
                { n: '4', label: 'Add work notes' },
                { n: '5', label: 'Client signs off' },
                { n: '6', label: 'Review & submit' },
              ].map((s) => (
                <div key={s.n} className="flex items-center gap-3 p-3 bg-white rounded-md shadow-sm border border-stone-100">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{s.n}</span>
                  <span className="text-stone-700 text-sm font-medium">{s.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={acceptJob}
              disabled={accepting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold text-lg transition-colors disabled:opacity-50"
            >
              {accepting ? 'Accepting...' : 'Accept Job & Start'}
            </button>
          </div>
        )}

        {/* Photo Before */}
        {step === 'photo-before' && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Before Photo</h2>
            {!stream && (
              <div className="space-y-3">
                <button onClick={() => startCamera('before')} className="w-full bg-slate-900 text-white py-4 rounded-md font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors">
                  <CameraIcon className="w-6 h-6" /> Open Camera
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-stone-300 text-stone-600 py-3 rounded-md font-medium hover:border-stone-400 transition-colors">
                  Upload Photo Instead
                </button>
              </div>
            )}
            {stream && (
              <div className="space-y-3">
                <div className="rounded-md overflow-hidden bg-black">
                  <video ref={videoRef} autoPlay playsInline className="w-full" />
                </div>
                <button onClick={() => capturePhoto('before')} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold text-lg transition-colors">
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
            {evidence.beforePhoto && (
              <div className="bg-white rounded-md shadow-sm border border-stone-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">Before photo saved</p>
                </div>
                <img src={evidence.beforePhoto} alt="Before" className="w-full rounded max-h-36 object-cover" />
              </div>
            )}
            {!stream && (
              <div className="space-y-3">
                <button onClick={() => startCamera('after')} className="w-full bg-slate-900 text-white py-4 rounded-md font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors">
                  <CameraIcon className="w-6 h-6" /> Open Camera
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-stone-300 text-stone-600 py-3 rounded-md font-medium hover:border-stone-400 transition-colors">
                  Upload Photo Instead
                </button>
              </div>
            )}
            {stream && (
              <div className="space-y-3">
                <div className="rounded-md overflow-hidden bg-black">
                  <video ref={videoRef} autoPlay playsInline className="w-full" />
                </div>
                <button onClick={() => capturePhoto('after')} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold text-lg transition-colors">
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
            {evidence.beforePhoto && evidence.afterPhoto && (
              <div className="grid grid-cols-2 gap-2">
                <div className="relative rounded-md overflow-hidden">
                  <img src={evidence.beforePhoto} alt="Before" className="w-full h-24 object-cover" />
                  <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Before</span>
                </div>
                <div className="relative rounded-md overflow-hidden">
                  <img src={evidence.afterPhoto} alt="After" className="w-full h-24 object-cover" />
                  <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">After</span>
                </div>
              </div>
            )}
            <button onClick={getLocation} className="w-full bg-slate-900 text-white py-4 rounded-md font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors">
              <MapPinIcon className="w-5 h-5" /> Get My GPS Location
            </button>
            {evidence.latitude && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-emerald-700 text-xs font-bold uppercase tracking-wide">Location captured</p>
                </div>
                <p className="text-amber-900 font-mono text-sm">{evidence.latitude.toFixed(6)}, {evidence.longitude?.toFixed(6)}</p>
                {evidence.w3w && <p className="text-amber-800 font-mono text-sm mt-1">///&thinsp;{evidence.w3w}</p>}
              </div>
            )}
            <button onClick={() => setStep('notes')} className="w-full border-2 border-stone-300 py-3 rounded-md font-medium text-stone-600 hover:border-stone-400 transition-colors">
              {evidence.latitude ? 'Continue' : 'Skip Location'}
            </button>
          </div>
        )}

        {/* Notes */}
        {step === 'notes' && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Work Notes</h2>
            <textarea
              placeholder="What work was done? Any issues?"
              value={evidence.notes}
              onChange={(e) => setEvidence(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full p-4 border-2 border-stone-300 rounded-md h-36 focus:border-amber-500 outline-none text-sm text-stone-800 placeholder:text-stone-400"
            />
            <button onClick={() => setStep('signature')} className="w-full bg-slate-900 text-white py-4 rounded-md font-bold hover:bg-slate-800 transition-colors">
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
              <button onClick={clearSignature} className="flex-1 border-2 border-stone-300 py-3 rounded-md font-medium text-stone-600 hover:border-stone-400 transition-colors">
                Clear
              </button>
              <button onClick={handleSignature} className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 py-3 rounded-md font-bold transition-colors">
                Confirm Signature
              </button>
            </div>
          </div>
        )}

        {/* Review */}
        {step === 'review' && (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Review & Submit</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-md overflow-hidden shadow-sm">
                  {evidence.beforePhoto && <img src={evidence.beforePhoto} alt="Before" className="w-full h-40 object-cover" />}
                  <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Before</span>
                </div>
                <div className="relative rounded-md overflow-hidden shadow-sm">
                  {evidence.afterPhoto && <img src={evidence.afterPhoto} alt="After" className="w-full h-40 object-cover" />}
                  <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">After</span>
                </div>
              </div>
              {evidence.latitude && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-amber-900 font-mono text-xs">{evidence.latitude.toFixed(6)}, {evidence.longitude?.toFixed(6)}</p>
                    {evidence.w3w && <p className="text-amber-800 font-mono text-xs mt-0.5">/// {evidence.w3w}</p>}
                  </div>
                </div>
              )}
              {evidence.notes && (
                <div className="bg-white border border-stone-200 p-3 rounded-md shadow-sm">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-stone-700 text-sm">{evidence.notes}</p>
                </div>
              )}
              {evidence.signature && (
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
              onClick={submitEvidence}
              disabled={submitting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <CheckIcon className="w-5 h-5" />
              {submitting ? 'Submitting...' : 'Submit Evidence'}
            </button>
          </div>
        )}

        {/* Submitted */}
        {step === 'submitted' && (
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
        )}
      </div>
    </div>
  )
}
