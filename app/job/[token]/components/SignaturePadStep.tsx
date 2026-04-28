'use client'

import { type RefObject, useEffect, useRef, useState } from 'react'

interface SignaturePadStepProps {
  signatureCanvasRef: RefObject<HTMLCanvasElement>
  onConfirm: () => void
  onClear: () => void
}

export default function SignaturePadStep({ signatureCanvasRef, onConfirm, onClear }: SignaturePadStepProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  // Resize canvas to match container width while keeping 2:1 aspect ratio
  useEffect(() => {
    const resize = () => {
      const canvas = signatureCanvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      const width = container.clientWidth
      const height = Math.round(width / 2)
      // Only resize if dimensions actually changed
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [signatureCanvasRef])

  // React's onTouchStart/onTouchMove are passive in React 18 — preventDefault is a no-op there.
  // Attach native non-passive listeners so we can stop the page from scrolling while drawing.
  useEffect(() => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const stop = (e: TouchEvent) => e.preventDefault()
    canvas.addEventListener('touchstart', stop, { passive: false })
    canvas.addEventListener('touchmove', stop, { passive: false })
    return () => {
      canvas.removeEventListener('touchstart', stop)
      canvas.removeEventListener('touchmove', stop)
    }
  }, [signatureCanvasRef])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = signatureCanvasRef.current?.getBoundingClientRect()
    if (!rect) return null
    const scaleX = signatureCanvasRef.current!.width / rect.width
    const scaleY = signatureCanvasRef.current!.height / rect.height
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const startStroke = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault() // prevent page scroll
    const pos = getPos(e)
    if (!pos || !signatureCanvasRef.current) return
    const ctx = signatureCanvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#18181b'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsEmpty(false)
  }

  const continueStroke = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault()
    const isDrawing = 'touches' in e ? true : (e as React.MouseEvent).buttons === 1
    if (!isDrawing || !signatureCanvasRef.current) return
    const pos = getPos(e)
    if (!pos) return
    const ctx = signatureCanvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const handleClear = () => {
    setIsEmpty(true)
    onClear()
  }

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Client Signature</h2>
      <p className="text-stone-500 text-sm">Have the client sign below to confirm the work.</p>
      <p className="sr-only">Use mouse or touch to draw your signature on the canvas below</p>
      <div
        ref={containerRef}
        className="border-2 border-stone-300 rounded-md bg-white relative"
        style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
      >
        <canvas
          role="img"
          aria-label="Signature pad - draw your signature here"
          tabIndex={0}
          ref={signatureCanvasRef}
          className="w-full bg-white rounded-md"
          style={{ cursor: 'crosshair', touchAction: 'none' }}
          onMouseDown={startStroke}
          onMouseMove={continueStroke}
          onTouchStart={startStroke}
          onTouchMove={continueStroke}
        />
      </div>
      <div className="flex gap-3">
        <button onClick={handleClear} className="flex-1 border-2 border-stone-300 py-3 rounded-md font-medium text-stone-600 hover:border-stone-400 transition-colors">
          Clear
        </button>
        <button
          onClick={onConfirm}
          disabled={isEmpty}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 py-3 rounded-md font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm Signature
        </button>
      </div>
    </div>
  )
}
