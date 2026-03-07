const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jobproof.pro'
const YEAR = new Date().getFullYear()

// Inline SVG logo for email (base64-encoded data URI for maximum email client compatibility)
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" width="48" height="48"><defs><linearGradient id="cg" x1="60" y1="80" x2="160" y2="60" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#f59e0b"/><stop offset="60%" stop-color="#f97316"/><stop offset="100%" stop-color="#ea580c"/></linearGradient></defs><path d="M100 12 L168 38 L168 100 C168 142 136 172 100 188 C64 172 32 142 32 100 L32 38 Z" fill="#1e2d5e"/><path d="M100 22 L158 45 L158 100 C158 136 130 163 100 177 C70 163 42 136 42 100 L42 45 Z" fill="#243570"/><path d="M63 102 L87 128 L145 70" stroke="url(#cg)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const LOGO_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString('base64')}`

const EMAIL_STYLES = `
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f4; color: #1c1917; }
  .wrap { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #141422 0%, #1e2d5e 50%, #243570 100%); padding: 28px 32px; text-align: center; }
  .header img { display: inline-block; margin-bottom: 12px; }
  .header h1 { color: #ffffff; font-size: 20px; margin: 0 0 4px; font-weight: 700; letter-spacing: -0.3px; }
  .header p { color: #fbbf24; font-size: 13px; margin: 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .body { padding: 32px; }
  .body p { color: #44403c; font-size: 15px; line-height: 1.65; margin: 0 0 16px; }
  .cta { display: inline-block; background: linear-gradient(135deg, #f59e0b, #f97316); color: #141422; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; letter-spacing: -0.2px; box-shadow: 0 2px 8px rgba(245,158,11,0.35); }
  .cta:hover { background: #f59e0b; }
  .detail { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 14px 16px; margin: 12px 0; }
  .detail-label { font-size: 10px; color: #a8a29e; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px; margin: 0; }
  .detail-value { font-size: 15px; color: #1c1917; font-weight: 500; margin: 3px 0 0; }
  .features { margin: 20px 0; padding: 0; list-style: none; }
  .features li { padding: 8px 0; font-size: 14px; color: #57534e; border-bottom: 1px solid #f5f5f4; }
  .features li:last-child { border-bottom: none; }
  .features li::before { content: "\\2713"; color: #059669; margin-right: 10px; font-weight: 700; font-size: 15px; }
  .divider { height: 1px; background: #e7e5e4; margin: 24px 0; }
  .footer { text-align: center; padding: 20px 32px; background: #fafaf9; border-top: 1px solid #e7e5e4; }
  .footer p { font-size: 12px; color: #a8a29e; margin: 0 0 4px; line-height: 1.5; }
  .footer a { color: #f59e0b; text-decoration: none; font-weight: 600; }
  .badge { display: inline-block; background: #ecfdf5; color: #059669; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-amber { background: #fffbeb; color: #d97706; }
`

function emailShell(title: string, subtitle: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>${EMAIL_STYLES}</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="header">
      <img src="${LOGO_DATA_URI}" alt="JobProof" width="48" height="48" style="display:block;margin:0 auto 12px;" />
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>
    <div class="body">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p><a href="${APP_URL}">jobproof.pro</a> &mdash; Tamper-proof work documentation for construction</p>
      <p>&copy; ${YEAR} JobProof. All rights reserved.</p>
    </div>
  </div>
</div>
</body>
</html>`
}

export function welcomeEmail(): string {
  return emailShell('Welcome to JobProof', 'Your 14-Day Free Trial', `
    <p>You're in. Your free trial starts today and runs for 14 days &mdash; no credit card needed.</p>
    <p>JobProof gives your crew tamper-proof documentation that holds up when it matters:</p>
    <ul class="features">
      <li>Before &amp; after photos with GPS timestamps</li>
      <li>Client digital signatures captured on-site</li>
      <li>Cryptographic sealing &mdash; evidence can't be altered</li>
      <li>Works 100% offline, syncs when you're back online</li>
      <li>what3words precision location for every job</li>
    </ul>
    <p style="text-align:center;margin-top:28px;">
      <a href="${APP_URL}/demo" class="cta">Start Documenting Jobs</a>
    </p>
  `)
}

export function loginEmail(loginUrl: string): string {
  return emailShell('Log In to JobProof', '', `
    <p style="text-align:center;">Click the button below to securely log in to your dashboard:</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${loginUrl}" class="cta">Log In to JobProof</a>
    </p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#78716c;text-align:center;">This link expires in 15 minutes.<br>If you didn&rsquo;t request this, you can safely ignore this email.</p>
  `)
}

export function newJobEmail(
  managerName: string,
  jobTitle: string,
  address: string,
  instructions: string,
  jobUrl: string
): string {
  return emailShell('New Job Assigned', `From ${managerName}`, `
    <p>You've been assigned a new job. Open it on your phone to document the work with photos, GPS, and client signature.</p>
    <div class="detail">
      <p class="detail-label">Job Title</p>
      <p class="detail-value">${jobTitle}</p>
    </div>
    ${address ? `<div class="detail"><p class="detail-label">Address</p><p class="detail-value">${address}</p></div>` : ''}
    ${instructions ? `<div class="detail"><p class="detail-label">Instructions</p><p class="detail-value">${instructions}</p></div>` : ''}
    <p style="text-align:center;margin-top:28px;">
      <a href="${jobUrl}" class="cta">Open Job</a>
    </p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#78716c;text-align:center;">Open this link on your phone for the best experience.</p>
  `)
}

export function jobCompleteEmail(
  jobTitle: string,
  address: string,
  crewName: string,
  jobUrl: string
): string {
  return emailShell('Job Complete', '', `
    <p style="text-align:center;margin-bottom:20px;"><span class="badge">Evidence Submitted</span></p>
    <p>Your crew has completed the job and submitted their evidence &mdash; including before/after photos, GPS location, and client signature.</p>
    <div class="detail">
      <p class="detail-label">Job</p>
      <p class="detail-value">${jobTitle}</p>
    </div>
    ${address ? `<div class="detail"><p class="detail-label">Address</p><p class="detail-value">${address}</p></div>` : ''}
    ${crewName ? `<div class="detail"><p class="detail-label">Completed By</p><p class="detail-value">${crewName}</p></div>` : ''}
    <p style="text-align:center;margin-top:28px;">
      <a href="${jobUrl}" class="cta">Review Evidence</a>
    </p>
  `)
}
