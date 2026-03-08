import type { JobData } from '../types'
import { generateSeal } from './sealGeneration'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function safeImgSrc(src: string): string {
  // Only allow data: URIs (base64 images from canvas/camera)
  if (src.startsWith('data:image/')) return src
  return ''
}

export function buildReportHtml(jobData: JobData, jobId: string): string {
  const seal = generateSeal(jobData)
  const ts = new Date(jobData.timestamp)
  const location = jobData.latitude ? `${jobData.latitude.toFixed(6)}, ${jobData.longitude?.toFixed(6)}` : 'Not captured'
  const w3wDisplay = jobData.w3w ? `/// ${esc(jobData.w3w)}` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>JobProof Report - ${esc(jobId)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: #fafaf9; color: #18181b; }
  .page { max-width: 800px; margin: 0 auto; background: #fff; }
  .header { background: linear-gradient(135deg, #141422, #1e1e2e); color: #fff; padding: 40px; }
  .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
  .header .subtitle { font-size: 14px; color: #fbbf24; font-weight: 500; }
  .meta-bar { display: flex; flex-wrap: wrap; gap: 24px; padding: 20px 40px; background: #f5f5f4; border-bottom: 1px solid #e7e5e4; font-size: 13px; }
  .meta-item { display: flex; flex-direction: column; gap: 2px; }
  .meta-label { color: #78716c; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
  .meta-value { color: #18181b; font-weight: 500; }
  .section { padding: 32px 40px; border-bottom: 1px solid #e7e5e4; }
  .section-title { font-size: 14px; font-weight: 700; color: #d97706; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
  .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .photo-card { border: 1px solid #e7e5e4; border-radius: 6px; overflow: hidden; }
  .photo-card img { width: 100%; height: 280px; object-fit: cover; display: block; }
  .photo-label { padding: 10px 14px; font-size: 11px; font-weight: 700; color: #44403c; background: #f5f5f4; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
  .notes-text { background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 6px; padding: 16px 20px; font-size: 14px; line-height: 1.6; color: #292524; white-space: pre-wrap; }
  .location-box { display: flex; align-items: center; gap: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 16px 20px; }
  .location-pin { width: 36px; height: 36px; background: #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; flex-shrink: 0; }
  .location-coords { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #92400e; font-weight: 500; }
  .location-label { font-size: 11px; color: #78716c; }
  .signature-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 20px; text-align: center; }
  .signature-box img { max-width: 320px; max-height: 160px; margin: 0 auto; display: block; }
  .signature-label { font-size: 11px; color: #16a34a; margin-top: 8px; font-weight: 500; }
  .satisfaction-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 20px; }
  .satisfaction-check { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; color: #166534; }
  .satisfaction-check .tick { width: 22px; height: 22px; background: #16a34a; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; flex-shrink: 0; }
  .satisfaction-feedback { margin-top: 12px; background: #fff; border: 1px solid #bbf7d0; border-radius: 4px; padding: 12px 16px; font-size: 13px; color: #292524; line-height: 1.5; white-space: pre-wrap; }
  .satisfaction-feedback-label { font-size: 11px; color: #78716c; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .seal-section { background: #1e1e2e; border-radius: 6px; padding: 20px; }
  .seal-title { font-size: 12px; color: #fbbf24; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .seal-hash { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #a5b4fc; word-break: break-all; background: #141422; padding: 12px; border-radius: 4px; margin-top: 8px; }
  .seal-note { font-size: 11px; color: #a1a1aa; margin-top: 8px; }
  .footer { padding: 24px 40px; background: #141422; text-align: center; font-size: 11px; color: #71717a; }
  @media print { body { background: #fff; } .page { box-shadow: none; } }
  @media (max-width: 600px) { .photos { grid-template-columns: 1fr; } .header, .section, .meta-bar, .footer { padding-left: 20px; padding-right: 20px; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" width="44" height="44" style="flex-shrink:0;">
        <defs>
          <linearGradient id="cg" x1="60" y1="80" x2="160" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="60%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#ea580c"/>
          </linearGradient>
        </defs>
        <path d="M100 12 L168 38 L168 100 C168 142 136 172 100 188 C64 172 32 142 32 100 L32 38 Z" fill="#1e2d5e"/>
        <path d="M100 22 L158 45 L158 100 C158 136 130 163 100 177 C70 163 42 136 42 100 L42 45 Z" fill="#243570"/>
        <path d="M63 102 L87 128 L145 70" stroke="url(#cg)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div>
        <h1 style="margin:0;">JobProof Report</h1>
        <div class="subtitle">Tamper-Proof Work Documentation</div>
      </div>
    </div>
  </div>
  <div class="meta-bar">
    <div class="meta-item"><span class="meta-label">Job ID</span><span class="meta-value">${esc(jobId)}</span></div>
    <div class="meta-item"><span class="meta-label">Date</span><span class="meta-value">${ts.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
    <div class="meta-item"><span class="meta-label">Time</span><span class="meta-value">${ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
    <div class="meta-item"><span class="meta-label">Exported</span><span class="meta-value">${new Date().toLocaleString()}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Photo Evidence</div>
    <div class="photos">
      <div class="photo-card">
        ${jobData.beforePhoto ? `<img src="${safeImgSrc(jobData.beforePhoto)}" alt="Before" />` : '<div style="height:280px;background:#f5f5f4;display:flex;align-items:center;justify-content:center;color:#a8a29e;">No photo</div>'}
        <div class="photo-label">Before</div>
      </div>
      <div class="photo-card">
        ${jobData.afterPhoto ? `<img src="${safeImgSrc(jobData.afterPhoto)}" alt="After" />` : '<div style="height:280px;background:#f5f5f4;display:flex;align-items:center;justify-content:center;color:#a8a29e;">No photo</div>'}
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
        ${w3wDisplay ? `<div class="location-coords" style="color:#92400e;margin-top:4px;">${w3wDisplay}</div>` : ''}
        <div class="location-label">${jobData.latitude ? `Lat ${jobData.latitude.toFixed(6)}, Lon ${jobData.longitude?.toFixed(6)}` : 'Location was not captured for this job'}</div>
      </div>
    </div>
  </div>
  ${jobData.notes ? `<div class="section"><div class="section-title">Work Notes</div><div class="notes-text">${esc(jobData.notes)}</div></div>` : ''}
  <div class="section">
    <div class="section-title">Client Signature</div>
    <div class="signature-box">
      ${jobData.signature ? `<img src="${safeImgSrc(jobData.signature)}" alt="Client Signature" /><div class="signature-label">Digitally signed by client</div>` : '<div style="color:#a8a29e;padding:20px;">No signature captured</div>'}
    </div>
  </div>
  ${jobData.clientSatisfied ? `<div class="section">
    <div class="section-title">Client Sign-Off</div>
    <div class="satisfaction-box">
      <div class="satisfaction-check">
        <span class="tick">&#x2713;</span>
        Client confirms work completed to their satisfaction
      </div>
      ${jobData.clientFeedback ? `<div><div class="satisfaction-feedback-label">Client Notes</div><div class="satisfaction-feedback">${esc(jobData.clientFeedback)}</div></div>` : ''}
    </div>
  </div>` : ''}
  <div class="section">
    <div class="section-title">Cryptographic Seal</div>
    <div class="seal-section">
      <div class="seal-title">Integrity Verification</div>
      <div class="seal-hash">${esc(seal)}</div>
      <div class="seal-note">This cryptographic seal verifies that the contents of this report have not been tampered with since creation.</div>
    </div>
  </div>
  <div class="footer" style="padding:24px 40px 12px;">
    <div style="max-width:600px;margin:0 auto 16px;text-align:left;font-size:9px;color:#52525b;line-height:1.6;border-top:1px solid #27272a;padding-top:12px;">
      <strong style="text-transform:uppercase;letter-spacing:0.5px;font-size:8px;color:#71717a;">Disclaimer:</strong>
      JobProof is a documentation tool. It does not provide legal advice and makes no guarantees regarding admissibility of documentation in legal proceedings. Cryptographic seals verify data integrity but are not a substitute for qualified legal counsel. Always consult a licensed lawyer before relying on evidence in court proceedings, lien claims, or insurance disputes.
    </div>
    Generated by JobProof &mdash; Tamper-proof work documentation for construction professionals<br>Report ID: ${esc(jobId)} &bull; ${new Date().toISOString()}
  </div>
</div>
</body>
</html>`
}
