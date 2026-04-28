'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Cog6ToothIcon, QuestionMarkCircleIcon, MapIcon, EnvelopeIcon, ArrowRightOnRectangleIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/20/solid'

interface Props {
  onLogout: () => void
}

export function AccountMenu({ onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const items = [
    { href: '/settings', label: 'Settings', icon: <AdjustmentsHorizontalIcon className="w-4 h-4" aria-hidden="true" /> },
    { href: '/faq', label: 'FAQ', icon: <QuestionMarkCircleIcon className="w-4 h-4" aria-hidden="true" /> },
    { href: '/roadmap', label: 'Roadmap', icon: <MapIcon className="w-4 h-4" aria-hidden="true" /> },
  ]

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Open account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="text-stone-400 hover:text-white transition-colors p-1 rounded"
      >
        <Cog6ToothIcon className="w-4 h-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-stone-200 py-1 z-50"
        >
          {items.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-slate-900 transition-colors"
            >
              <span className="text-stone-400">{icon}</span>
              {label}
            </Link>
          ))}

          <a
            role="menuitem"
            href="mailto:vaishaligor25@gmail.com"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-slate-900 transition-colors"
          >
            <span className="text-stone-400"><EnvelopeIcon className="w-4 h-4" aria-hidden="true" /></span>
            Email support
          </a>

          <div className="border-t border-stone-200 my-1" />

          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onLogout() }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="text-red-400"><ArrowRightOnRectangleIcon className="w-4 h-4" aria-hidden="true" /></span>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
