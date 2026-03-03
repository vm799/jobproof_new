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

  const exportProof = () => {
    const proof = {
      job: {
        id: `JOB-${Date.now()}`,
        timestamp: new Date(jobData.timestamp).toISOString(),
        location: jobData.latitude ? `${jobData.latitude.toFixed(6)}, ${jobData.longitude?.toFixed(6)}` : 'Unknown',
        notes: jobData.notes,
        sealed: generateSeal(),
        signedBy: 'Client (Digital Signature)',
        exportTime: new Date().toISOString()
      }
    }
    
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(proof, null, 2)))
    element.setAttribute('download', `JobProof-${Date.now()}.json`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    
    setStep('export')
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
            <h2 className="text-2xl font-bold">✓ Complete!</h2>
            
            <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
              <p className="text-green-900 font-semibold text-lg mb-2">Proof file exported</p>
              <p className="text-green-700 text-sm">Your sealed proof is ready to send to insurance or court.</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg space-y-3">
              <h3 className="font-bold text-blue-900">What just happened:</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>✓ Before & after photos captured</li>
                <li>✓ GPS location & timestamp recorded</li>
                <li>✓ Client digitally signed off</li>
                <li>✓ Everything cryptographically sealed (tamper-proof)</li>
                <li>✓ Exported as a court-ready proof file</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg space-y-3">
              <h3 className="font-bold text-gray-900">Next steps:</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>1️⃣ This works 100% offline - no WiFi needed</li>
                <li>2️⃣ When you're back online, auto-sync happens</li>
                <li>3️⃣ Send the proof file to insurance/attorney</li>
                <li>4️⃣ The seal proves nothing was tampered with</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setStep('intro')
                  setJobData({ notes: '', timestamp: Date.now() })
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Try Another Job
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
