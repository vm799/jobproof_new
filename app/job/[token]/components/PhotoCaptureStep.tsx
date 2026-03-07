'use client'

import type { RefObject } from 'react'
import { CameraIcon } from '@heroicons/react/20/solid'

interface PhotoCaptureStepProps {
  type: 'before' | 'after'
  stream: MediaStream | null
  videoRef: RefObject<HTMLVideoElement>
  fileInputRef: RefObject<HTMLInputElement>
  beforePhoto?: string
  onStartCamera: (type: 'before' | 'after') => void
  onCapturePhoto: (type: 'before' | 'after') => void
  onFileUploadClick: () => void
}

export default function PhotoCaptureStep({
  type,
  stream,
  videoRef,
  beforePhoto,
  onStartCamera,
  onCapturePhoto,
  onFileUploadClick,
}: PhotoCaptureStepProps) {
  const title = type === 'before' ? 'Before Photo' : 'After Photo'

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {type === 'after' && beforePhoto && (
        <div className="bg-white rounded-md shadow-sm border border-stone-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">Before photo saved</p>
          </div>
          <img src={beforePhoto} alt="Before" className="w-full rounded max-h-36 object-cover" />
        </div>
      )}
      {!stream && (
        <div className="space-y-3">
          <button onClick={() => onStartCamera(type)} className="w-full bg-slate-900 text-white py-4 rounded-md font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-colors">
            <CameraIcon className="w-6 h-6" /> Open Camera
          </button>
          <button onClick={onFileUploadClick} className="w-full border-2 border-stone-300 text-stone-600 py-3 rounded-md font-medium hover:border-stone-400 transition-colors">
            Upload Photo Instead
          </button>
        </div>
      )}
      {stream && (
        <div className="space-y-3">
          <div className="rounded-md overflow-hidden bg-black">
            <video ref={videoRef} autoPlay playsInline className="w-full" />
          </div>
          <button onClick={() => onCapturePhoto(type)} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 py-4 rounded-md font-bold text-lg transition-colors">
            Capture Photo
          </button>
        </div>
      )}
    </div>
  )
}
