'use client'

import type { RefObject } from 'react'

interface SignaturePadStepProps {
  signatureCanvasRef: RefObject<HTMLCanvasElement>
  onConfirm: () => void
  onClear: () => void
}

export default function SignaturePadStep({ signatureCanvasRef, onConfirm, onClear }: SignaturePadStepProps) {
  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Client Signature</h2>
      <p className="text-stone-500 text-sm">Have the client sign below to confirm the work.</p>
      <p className="sr-only">Use mouse or touch to draw your signature on the canvas below</p>
      <div className="border-2 border-stone-300 rounded-md bg-white relative">
        <canvas
          role="img"
          aria-label="Signature pad - draw your signature here"
          tabIndex={0}
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
        <button onClick={onClear} className="flex-1 border-2 border-stone-300 py-3 rounded-md font-medium text-stone-600 hover:border-stone-400 transition-colors">
          Clear
        </button>
        <button onClick={onConfirm} className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 py-3 rounded-md font-bold transition-colors">
          Confirm Signature
        </button>
      </div>
    </div>
  )
}
