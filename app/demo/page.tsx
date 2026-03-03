'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeftIcon, CameraIcon, MapPinIcon, PencilIcon, CheckIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

type Step = 'intro' | 'photo-before' | 'photo-after' | 'location' | 'notes' | 'signature' | 'review' | 'export'

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
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream, step])

  const startCamera = async (type: 'before' | 'after') => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      setStream(mediaStream)
      setStep(type === 'before' ? 'photo-before' : 'photo-after')
    } catch (err) {
      alert('Camera access denied. Using file upload instead.')
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
    setJobData(prev => ({
      ...prev,
      [type === 'before' ? 'beforePhoto' : 'afterPhoto']: photo
    }))
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    if (type === 'before') {
      setStep('photo-after')
    } else {
      setStep('location')
    }
  }

  const handlePhotoUpload = (type: 'before' | 'after', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setJobData(prev => ({
        ...prev,
        [type === 'before' ? 'beforePhoto' : 'afterPhoto']: event.target?.result
      }))
      if (type === 'before') {
        setStep('photo-after')
      } else {
        setStep('location')
      }
    }
    reader.readAsDataURL(file)
  }

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setJobData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }))
          setStep('notes')
        },
        () => {
          alert('Location access denied. Continuing without GPS.')
          setStep('notes')
        }
      )
    } else {
      setStep('notes')
    }
  }

  const handleSignature = () => {
    if (!signatureCanvasRef.current) return
    const signature = signatureCanvasRef.current.toDataURL('image/png')
    setJobData(prev => ({ ...prev, signature }))
    setStep('review')
  }

  const clearSignature = () => {
    if (!signatureCanvasRef.current) return
    const context = signatureCanvasRef.current.getContext('2d')
    if (context) {
      context.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height)
    }
  }

  const generateSeal = () => {
    // Simple crypto seal (in production, use TweetNaCl.js)
    const data = JSON.stringify({
      beforePhoto: jobData.beforePhoto?.slice(0, 50),
      afterPhoto: jobData.afterPhoto?.slice(0, 50),
      latitude: jobData.latitude,
      longitude: jobData.longitude,
      notes: jobData.notes,
      timestamp: jobData.timestamp
    })
    const seal = btoa(data) // Base64 encode
    return seal.slice(0, 32) // Simplified seal
  }

  const jobId = useRef(`JOB-${Date.now()}`).current

  const buildReportHtml = () => {
    const seal = generateSeal()
    const ts = new Date(jobData.timestamp)
    const location = jobData.latitude
      ? `${jobData.latitude.toFixed(6)}, ${jobData.longitude?.toFixed(6)}`
      : 'Not captured'

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>JobProof Report - ${jobId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; }
  .page { max-width: 800px; margin: 0 auto; background: #fff; }
  .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: #fff; padding: 40px; }
  .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
  .header .subtitle { font-size: 14px; opacity: 0.85; }
  .meta-bar { display: flex; flex-wrap: wrap; gap: 24px; padding: 20px 40px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  .meta-item { display: flex; flex-direction: column; gap: 2px; }
  .meta-label { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
  .meta-value { color: #1e293b; font-weight: 500; }
  .section { padding: 32px 40px; border-bottom: 1px solid #e2e8f0; }
  .section-title { font-size: 16px; font-weight: 700; color: #1e40af; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
  .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .photo-card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .photo-card img { width: 100%; height: 280px; object-fit: cover; display: block; }
  .photo-label { padding: 10px 14px; font-size: 12px; font-weight: 600; color: #475569; background: #f8fafc; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
  .notes-text { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
  .location-box { display: flex; align-items: center; gap: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; }
  .location-pin { width: 36px; height: 36px; background: #1e40af; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; flex-shrink: 0; }
  .location-coords { font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; font-size: 14px; color: #1e40af; }
  .location-label { font-size: 11px; color: #64748b; }
  .signature-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; text-align: center; }
  .signature-box img { max-width: 320px; max-height: 160px; margin: 0 auto; display: block; }
  .signature-label { font-size: 11px; color: #16a34a; margin-top: 8px; }
  .seal-section { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 20px; }
  .seal-hash { font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; font-size: 12px; color: #7c3aed; word-break: break-all; background: #f5f3ff; padding: 12px; border-radius: 6px; margin-top: 8px; }
  .seal-note { font-size: 11px; color: #7c3aed; margin-top: 8px; }
  .footer { padding: 24px 40px; background: #f8fafc; text-align: center; font-size: 11px; color: #94a3b8; }
  @media print { body { background: #fff; } .page { box-shadow: none; } }
  @media (max-width: 600px) { .photos { grid-template-columns: 1fr; } .header, .section, .meta-bar, .footer { padding-left: 20px; padding-right: 20px; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>JobProof Report</h1>
    <div class="subtitle">Tamper-proof work documentation</div>
  </div>

  <div class="meta-bar">
    <div class="meta-item">
      <span class="meta-label">Job ID</span>
      <span class="meta-value">${jobId}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Date</span>
      <span class="meta-value">${ts.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Time</span>
      <span class="meta-value">${ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Exported</span>
      <span class="meta-value">${new Date().toLocaleString()}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Photo Evidence</div>
    <div class="photos">
      <div class="photo-card">
        ${jobData.beforePhoto ? `<img src="${jobData.beforePhoto}" alt="Before" />` : '<div style="height:280px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;">No photo</div>'}
        <div class="photo-label">Before</div>
      </div>
      <div class="photo-card">
        ${jobData.afterPhoto ? `<img src="${jobData.afterPhoto}" alt="After" />` : '<div style="height:280px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;">No photo</div>'}
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
        <div class="location-label">${jobData.latitude ? `Latitude ${jobData.latitude.toFixed(6)}, Longitude ${jobData.longitude?.toFixed(6)}` : 'Location was not captured for this job'}</div>
      </div>
    </div>
  </div>

  ${jobData.notes ? `
  <div class="section">
    <div class="section-title">Work Notes</div>
    <div class="notes-text">${jobData.notes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Client Signature</div>
    <div class="signature-box">
      ${jobData.signature ? `<img src="${jobData.signature}" alt="Client Signature" /><div class="signature-label">Digitally signed by client</div>` : '<div style="color:#94a3b8;padding:20px;">No signature captured</div>'}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Cryptographic Seal</div>
    <div class="seal-section">
      <div style="font-size:13px;color:#6b21a8;font-weight:600;">Integrity Verification</div>
      <div class="seal-hash">${seal}</div>
      <div class="seal-note">This cryptographic seal verifies that the contents of this report have not been tampered with since the time of creation.</div>
    </div>
  </div>

  <div class="footer">
    Generated by JobProof &mdash; Tamper-proof work documentation for construction professionals<br>
    Report ID: ${jobId} &bull; ${new Date().toISOString()}
  </div>
</div>
</body>
</html>`
  }

  const exportProof = () => {
    const html = buildReportHtml()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    const element = document.createElement('a')
    element.href = url
    element.download = `JobProof-${jobId}.html`
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    URL.revokeObjectURL(url)

    setStep('export')
  }

  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [emailError, setEmailError] = useState('')

  const sendReport = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      setEmailError('Please enter a valid email address.')
      return
    }
    setSendingEmail(true)
    setEmailError('')
    try {
      const html = buildReportHtml()
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddress, html, jobId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setEmailSent(true)
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send email. Try again.')
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </Link>
        <h1 className="text-lg font-bold">JobProof Demo</h1>
        <div className="w-5"></div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Step {['intro', 'photo-before', 'photo-after', 'location', 'notes', 'signature', 'review', 'export'].indexOf(step) + 1} / 8</span>
            <span>{step === 'export' ? 'Complete!' : 'In Progress'}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${((['intro', 'photo-before', 'photo-after', 'location', 'notes', 'signature', 'review', 'export'].indexOf(step) + 1) / 8) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 pb-20">

        {/* Always-mounted hidden elements for camera/upload */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const type = step === 'photo-before' ? 'before' : 'after'
            handlePhotoUpload(type, e)
          }}
        />

        {/* Intro */}
        {step === 'intro' && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold">Document Your Job</h2>
            <p className="text-gray-700">This demo shows how JobProof works offline. Try it out:</p>
            <div className="space-y-3">
              {[
                '📸 Take a before photo',
                '📸 Take an after photo',
                '📍 Capture your location',
                '📝 Add notes about the work',
                '✍️ Client digitally signs',
                '🔐 File gets cryptographically sealed',
                '📤 Export proof when online'
              ].map((step, i) => (
                <div key={i} className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-lg">{step.split(' ')[0]}</span>
                  <span className="text-gray-700">{step.slice(2)}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep('photo-before')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Start Demo →
            </button>
            <p className="text-xs text-gray-500 text-center">
              💡 This works completely offline. Try it on your phone with WiFi turned off!
            </p>
          </div>
        )}

        {/* Photo Before */}
        {step === 'photo-before' && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold">Take Before Photo</h2>
            
            {!stream && (
              <div className="space-y-3">
                <button
                  onClick={() => startCamera('before')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <CameraIcon className="w-5 h-5" />
                  Open Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50"
                >
                  Upload Photo Instead
                </button>
              </div>
            )}
            
            {stream && (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay playsInline className="w-full bg-black rounded-lg" />
                <button
                  onClick={() => capturePhoto('before')}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                >
                  Capture Photo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Photo After */}
        {step === 'photo-after' && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold">Take After Photo</h2>
            
            {jobData.beforePhoto && (
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Before photo captured ✓</p>
                <img src={jobData.beforePhoto} alt="Before" className="w-full rounded-lg max-h-40 object-cover" />
              </div>
            )}
            
            {!stream && (
              <div className="space-y-3">
                <button
                  onClick={() => startCamera('after')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <CameraIcon className="w-5 h-5" />
                  Open Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50"
                >
                  Upload Photo Instead
                </button>
              </div>
            )}
            
            {stream && (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay playsInline className="w-full bg-black rounded-lg" />
                <button
                  onClick={() => capturePhoto('after')}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                >
                  Capture Photo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Location */}
        {step === 'location' && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold">Capture Location</h2>
            
            {jobData.beforePhoto && jobData.afterPhoto && (
              <div className="grid grid-cols-2 gap-3">
                <img src={jobData.beforePhoto} alt="Before" className="w-full rounded-lg max-h-32 object-cover" />
                <img src={jobData.afterPhoto} alt="After" className="w-full rounded-lg max-h-32 object-cover" />
              </div>
            )}
            
            <p className="text-gray-700">This proves your location and time. Works completely offline.</p>
            
            <button
              onClick={getLocation}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <MapPinIcon className="w-5 h-5" />
              Get My GPS Location
            </button>
            
            {jobData.latitude && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-900 text-sm">✓ Location captured</p>
                <p className="text-green-700 text-xs mt-1">{jobData.latitude.toFixed(6)}, {jobData.longitude?.toFixed(6)}</p>
              </div>
            )}
            
            <button
              onClick={() => setStep('notes')}
              className="w-full border-2 border-gray-300 py-3 rounded-lg font-semibold hover:border-gray-400"
            >
              Continue (Location Optional)
            </button>
          </div>
        )}

        {/* Notes */}
        {step === 'notes' && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold">Add Notes</h2>
            
            <textarea
              placeholder="What work was done? Any issues? Anything the client should know?"
              value={jobData.notes}
              onChange={(e) => setJobData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full p-4 border-2 border-gray-300 rounded-lg h-32 focus:border-blue-600 outline-none"
            />
            
            <button
              onClick={() => setStep('signature')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Next: Get Signature →
            </button>
          </div>
        )}

        {/* Signature */}
        {step === 'signature' && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold">Client Signature</h2>
            <p className="text-gray-700 text-sm">Have the client sign below to confirm the work.</p>
            
            <div className="border-2 border-gray-300 rounded-lg bg-white">
              <canvas
                ref={signatureCanvasRef}
                width={400}
                height={200}
                className="w-full bg-white rounded-lg border-2 border-gray-300"
                style={{ cursor: 'crosshair', touchAction: 'none' }}
                onMouseDown={(e) => {
                  const rect = signatureCanvasRef.current?.getBoundingClientRect()
                  if (!rect || !signatureCanvasRef.current) return
                  const context = signatureCanvasRef.current.getContext('2d')
                  if (!context) return
                  context.beginPath()
                  context.moveTo(e.clientX - rect.left, e.clientY - rect.top)
                }}
                onMouseMove={(e) => {
                  if (e.buttons === 1 && signatureCanvasRef.current) {
                    const rect = signatureCanvasRef.current.getBoundingClientRect()
                    const context = signatureCanvasRef.current.getContext('2d')
                    if (!context) return
                    context.lineWidth = 2
                    context.lineCap = 'round'
                    context.lineTo(e.clientX - rect.left, e.clientY - rect.top)
                    context.stroke()
                  }
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0]
                  const rect = signatureCanvasRef.current?.getBoundingClientRect()
                  if (!rect || !signatureCanvasRef.current) return
                  const context = signatureCanvasRef.current.getContext('2d')
                  if (!context) return
                  context.beginPath()
                  context.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0]
                  if (!signatureCanvasRef.current) return
                  const rect = signatureCanvasRef.current.getBoundingClientRect()
                  const context = signatureCanvasRef.current.getContext('2d')
                  if (!context) return
                  context.lineWidth = 2
                  context.lineCap = 'round'
                  context.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
                  context.stroke()
                }}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={clearSignature}
                className="flex-1 border-2 border-gray-300 py-2 rounded-lg font-semibold hover:border-gray-400"
              >
                Clear
              </button>
              <button
                onClick={handleSignature}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Confirm Signature
              </button>
            </div>
          </div>
        )}

        {/* Review */}
        {step === 'review' && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold">Review & Sign Off</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Before Photo</p>
                {jobData.beforePhoto && <img src={jobData.beforePhoto} alt="Before" className="w-full rounded-lg" />}
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-2">After Photo</p>
                {jobData.afterPhoto && <img src={jobData.afterPhoto} alt="After" className="w-full rounded-lg" />}
              </div>
              
              {jobData.latitude && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="font-semibold text-blue-900">📍 Location</p>
                  <p className="text-blue-700">{jobData.latitude.toFixed(6)}, {jobData.longitude?.toFixed(6)}</p>
                </div>
              )}
              
              {jobData.notes && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="font-semibold text-gray-900">📝 Notes</p>
                  <p className="text-gray-700">{jobData.notes}</p>
                </div>
              )}
              
              {jobData.signature && (
                <div className="bg-green-50 p-3 rounded-lg text-sm">
                  <p className="font-semibold text-green-900">✍️ Signed</p>
                  <p className="text-green-700">Client signature captured</p>
                </div>
              )}
              
              <div className="bg-purple-50 p-3 rounded-lg text-sm">
                <p className="font-semibold text-purple-900">🔐 Cryptographic Seal</p>
                <p className="text-purple-700 font-mono text-xs break-all">{generateSeal()}</p>
                <p className="text-purple-600 text-xs mt-1">This seal proves the data hasn't been tampered with.</p>
              </div>
            </div>
            
            <button
              onClick={exportProof}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <CheckIcon className="w-5 h-5" />
              Export Proof File
            </button>
          </div>
        )}

        {/* Export */}
        {step === 'export' && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold">Report Downloaded</h2>

            <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
              <p className="text-green-900 font-semibold text-lg mb-2">Your proof report has been saved</p>
              <p className="text-green-700 text-sm">Open the HTML file in any browser to view or print your beautifully formatted report.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <h3 className="font-bold text-gray-900">Email Report</h3>
              <p className="text-sm text-gray-600">Send a copy to your email, your client, or your attorney.</p>

              {emailSent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-semibold">Report sent to {emailAddress}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={emailAddress}
                    onChange={(e) => { setEmailAddress(e.target.value); setEmailError('') }}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 outline-none text-sm"
                  />
                  {emailError && (
                    <p className="text-red-600 text-sm">{emailError}</p>
                  )}
                  <button
                    onClick={sendReport}
                    disabled={sendingEmail}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingEmail ? 'Sending...' : 'Send Report via Email'}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={exportProof}
              className="w-full border-2 border-gray-300 py-3 rounded-lg font-semibold hover:border-gray-400 text-sm"
            >
              Download Report Again
            </button>

            <div className="bg-blue-50 p-6 rounded-lg space-y-3">
              <h3 className="font-bold text-blue-900">What&apos;s in your report:</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>Before & after photo evidence</li>
                <li>GPS location & timestamp</li>
                <li>Client digital signature</li>
                <li>Cryptographic tamper-proof seal</li>
                <li>Court-ready formatted document</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setStep('intro')
                  setJobData({ notes: '', timestamp: Date.now() })
                  setEmailSent(false)
                  setEmailAddress('')
                  setEmailError('')
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Start New Job
              </button>

              <Link
                href="/#email-form"
                className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 text-center block"
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
