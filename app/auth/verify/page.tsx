'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    missing_token: 'No login token found. Please request a new login link.',
    invalid_token: 'This login link is invalid or has already been used.',
    expired_token: 'This login link has expired. Please request a new one.',
    create_failed: 'Failed to create your account. Please try again.',
  }

  return (
    <div className="bg-white rounded-md p-6 shadow-lg">
      {error ? (
        <div className="space-y-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Login Failed</h2>
          <p className="text-stone-500 text-sm">{errorMessages[error] || 'Something went wrong.'}</p>
          <Link href="/login" className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-900 px-6 py-2.5 rounded-md font-bold text-sm transition-colors mt-2">
            Try Again
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-amber-500 rounded-full mx-auto"></div>
          <p className="text-stone-500 text-sm">Verifying your login...</p>
        </div>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Suspense fallback={
          <div className="bg-white rounded-md p-6 shadow-lg">
            <div className="space-y-3">
              <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-amber-500 rounded-full mx-auto"></div>
              <p className="text-stone-500 text-sm">Verifying your login...</p>
            </div>
          </div>
        }>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  )
}
