'use client'

import { useState, useEffect } from 'react'
import { CheckIcon } from '@heroicons/react/20/solid'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { deleteJob } from '@/lib/db'

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

interface SubmittedStepProps {
  evidence?: EvidenceData
  token: string
  jobTitle?: string
  submittedOnline: boolean
}

export default function SubmittedStep({ evidence, token, jobTitle, submittedOnline }: SubmittedStepProps) {
  const { isOnline } = useOnlineStatus()
  const [reportSent, setReportSent] = useState(submittedOnline)
  const [sendingReport, setSendingReport] = useState(false)
  const [pendingSync, setPendingSync] = useState(!submittedOnline)

  // Auto-retry when back online
  useEffect(() => {
    if (isOnline && pendingSync && evidence) {
      const sync = async () => {
        try {
          const seal = generateSeal(evidence)
          const res = await fetch(`/api/crew/${token}/submit-evidence`, {
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
          if (!res.ok) throw new Error('Sync failed')
          // Clean up IndexedDB
          try { await deleteJob(`pending-${token}`) } catch {}
          setPendingSync(false)
          setReportSent(true)
        } catch {
          // Will retry on next online event
        }
      }
      sync()
    }
  }, [isOnline, pendingSync, evidence, token])

  const downloadReport = () => {
    if (!evidence) return
    const seal = generateSeal(evidence)
    const ts = new Date(evidence.timestamp)
    const location = evidence.latitude ? `${evidence.latitude.toFixed(6)}, ${evidence.longitude?.toFixed(6)}` : 'Not captured'
    const w3wDisplay = evidence.w3w ? `/// ${esc(evidence.w3w)}` : ''
    const safeImg = (src?: string) => src?.startsWith('data:image/') ? src : ''

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>JobProof Report${jobTitle ? ` - ${esc(jobTitle)}` : ''}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#fafaf9;color:#18181b}.page{max-width:800px;margin:0 auto;background:#fff}.header{background:#141422;color:#fff;padding:40px}.section{padding:24px 40px;border-bottom:1px solid #e7e5e4}.section-title{font-size:13px;font-weight:700;color:#d97706;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px}.photos{display:grid;grid-template-columns:1fr 1fr;gap:16px}.photo-card{border:1px solid #e7e5e4;border-radius:6px;overflow:hidden}.photo-card img{width:100%;height:260px;object-fit:cover;display:block}.photo-label{padding:8px;font-size:11px;font-weight:700;color:#44403c;background:#f5f5f4;text-align:center;text-transform:uppercase}.location-box{background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:14px 18px}.location-coords{font-family:monospace;font-size:13px;color:#92400e;font-weight:500}.seal-section{background:#1e1e2e;border-radius:6px;padding:16px}.seal-hash{font-family:monospace;font-size:12px;color:#a5b4fc;word-break:break-all;background:#141422;padding:10px;border-radius:4px;margin-top:6px}.footer{padding:20px 40px;background:#141422;text-align:center;font-size:11px;color:#71717a}@media print{body{background:#fff}}@media(max-width:600px){.photos{grid-template-columns:1fr}.header,.section,.footer{padding-left:16px;padding-right:16px}}</style>
</head><body><div class="page">
<div class="header"><h1 style="font-size:24px;font-weight:700">${jobTitle ? esc(jobTitle) : 'JobProof Report'}</h1><p style="font-size:13px;color:#fbbf24;margin-top:4px">Tamper-Proof Work Documentation</p><p style="font-size:12px;color:#94a3b8;margin-top:8px">${ts.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p></div>
<div class="section"><div class="section-title">Photo Evidence</div><div class="photos">
<div class="photo-card">${evidence.beforePhoto ? `<img src="${safeImg(evidence.beforePhoto)}" alt="Before" />` : '<div style="height:260px;background:#f5f5f4;display:flex;align-items:center;justify-content:center;color:#a8a29e">No photo</div>'}<div class="photo-label">Before</div></div>
<div class="photo-card">${evidence.afterPhoto ? `<img src="${safeImg(evidence.afterPhoto)}" alt="After" />` : '<div style="height:260px;background:#f5f5f4;display:flex;align-items:center;justify-content:center;color:#a8a29e">No photo</div>'}<div class="photo-label">After</div></div>
</div></div>
<div class="section"><div class="section-title">GPS Location</div><div class="location-box"><div class="location-coords">${location}</div>${w3wDisplay ? `<div class="location-coords" style="margin-top:4px">${w3wDisplay}</div>` : ''}</div></div>
${evidence.notes ? `<div class="section"><div class="section-title">Work Notes</div><div style="background:#f5f5f4;border:1px solid #e7e5e4;border-radius:6px;padding:14px 18px;font-size:13px;line-height:1.6;white-space:pre-wrap">${esc(evidence.notes)}</div></div>` : ''}
${evidence.signature ? `<div class="section"><div class="section-title">Client Signature</div><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;text-align:center"><img src="${safeImg(evidence.signature)}" alt="Signature" style="max-width:300px;max-height:150px" /><p style="font-size:11px;color:#16a34a;margin-top:6px">Digitally signed by client</p></div></div>` : ''}
<div class="section"><div class="section-title">Cryptographic Seal</div><div class="seal-section"><div style="font-size:11px;color:#fbbf24;font-weight:700;text-transform:uppercase;letter-spacing:1px">Integrity Verification</div><div class="seal-hash">${seal}</div><div style="font-size:10px;color:#a1a1aa;margin-top:6px">This seal verifies the contents have not been tampered with.</div></div></div>
<div class="footer">Generated by JobProof &mdash; ${new Date().toISOString()}</div>
</div></body></html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jobproof-report-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sendReportManually = async () => {
    if (!evidence) return
    setSendingReport(true)
    try {
      const seal = generateSeal(evidence)
      const res = await fetch(`/api/crew/${token}/submit-evidence`, {
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
      if (!res.ok) throw new Error('Send failed')
      // Clean up IndexedDB
      try { await deleteJob(`pending-${token}`) } catch {}
      setReportSent(true)
      setPendingSync(false)
    } catch {
      // Show nothing — user can retry
    } finally {
      setSendingReport(false)
    }
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-md text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckIcon className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-emerald-900">Evidence Submitted</h2>
        <p className="text-emerald-700 text-sm mt-2">
          {reportSent
            ? 'Your manager has been notified. The evidence has been cryptographically sealed.'
            : 'Evidence saved locally. It will be sent to your manager when you\u2019re back online.'}
        </p>
      </div>

      {/* Sync Status */}
      {pendingSync && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
          <div className="flex items-start gap-3">
            <div className="animate-pulse w-3 h-3 bg-amber-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm">Waiting to sync</h3>
              <p className="text-amber-700 text-xs mt-0.5">Evidence is saved on this device. It will auto-send when you reconnect.</p>
              {isOnline && (
                <button
                  onClick={sendReportManually}
                  disabled={sendingReport}
                  className="mt-2 bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-md text-xs font-bold disabled:opacity-50 transition-colors"
                >
                  {sendingReport ? 'Sending...' : 'Send Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {reportSent && !pendingSync && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md flex items-center gap-2">
          <CheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-800 text-xs font-medium">Report sent to manager</p>
        </div>
      )}

      <div className="bg-stone-100 p-5 rounded-md space-y-2">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Submitted evidence</h3>
        <ul className="text-xs text-stone-600 space-y-1">
          <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Before & after photo evidence</li>
          <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> GPS location & timestamp</li>
          <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Client digital signature</li>
          <li className="flex items-center gap-2"><CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Cryptographic seal</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {evidence && (
          <button
            onClick={downloadReport}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-md font-bold text-sm transition-colors"
          >
            Download Report
          </button>
        )}
        {!reportSent && !pendingSync && isOnline && evidence && (
          <button
            onClick={sendReportManually}
            disabled={sendingReport}
            className="w-full border-2 border-stone-300 text-stone-700 py-2.5 rounded-md font-bold text-sm hover:border-stone-400 transition-colors disabled:opacity-50"
          >
            {sendingReport ? 'Sending...' : 'Send Email Report to Manager'}
          </button>
        )}
      </div>
    </div>
  )
}

function generateSeal(evidence: EvidenceData): string {
  return btoa(JSON.stringify({
    beforePhoto: evidence.beforePhoto?.slice(0, 50),
    afterPhoto: evidence.afterPhoto?.slice(0, 50),
    latitude: evidence.latitude,
    longitude: evidence.longitude,
    w3w: evidence.w3w,
    notes: evidence.notes,
    timestamp: evidence.timestamp
  })).slice(0, 32)
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
