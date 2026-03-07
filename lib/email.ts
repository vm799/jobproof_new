const APP_URL = 'https://jobproof.pro'
const YEAR = new Date().getFullYear()

function emailShell(title: string, subtitle: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f172a 0%,#1e2d5e 50%,#1e3a5f 100%);padding:32px 32px 28px;text-align:center;">
      <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#1e2d5e,#243570);border:2px solid rgba(251,191,36,0.5);border-radius:10px;margin-bottom:14px;text-align:center;line-height:44px;font-size:24px;color:#fbbf24;">&#10003;</div>
      <p style="color:#ffffff;font-size:24px;margin:0 0 2px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">JOBPROOF</p>
      <p style="color:#fbbf24;font-size:11px;margin:0;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;">Tamper-Proof Work Documentation</p>
      ${title !== 'JOBPROOF' ? `<p style="color:#ffffff;font-size:18px;margin:16px 0 0;font-weight:600;">${title}</p>` : ''}
      ${subtitle ? `<p style="color:#fbbf24;font-size:13px;margin:4px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${subtitle}</p>` : ''}
    </div>
    <div style="height:4px;background:linear-gradient(90deg,#f59e0b,#f97316,#f59e0b);"></div>
    <!-- Body -->
    <div style="padding:32px;">
      ${bodyHtml}
    </div>
    <!-- Footer -->
    <div style="text-align:center;padding:20px 32px;background:#0f172a;border-top:1px solid #334155;">
      <p style="font-size:12px;color:#94a3b8;margin:0 0 4px;line-height:1.5;"><a href="${APP_URL}" style="color:#fbbf24;text-decoration:none;font-weight:600;">jobproof.pro</a> &mdash; Tamper-proof work documentation</p>
      <p style="font-size:12px;color:#64748b;margin:4px 0 0;">&copy; ${YEAR} JobProof. All rights reserved.</p>
    </div>
  </div>
</div>
</body>
</html>`
}

export function welcomeEmail(): string {
  return emailShell('Welcome to JobProof', 'Your 14-Day Free Trial', `
    <p style="font-size:16px;color:#f1f5f9;font-weight:600;margin:0 0 8px;">You're in.</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.65;margin:0 0 16px;">Your free trial starts today and runs for 14 days &mdash; no credit card needed.</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.65;margin:0 0 16px;">JobProof gives your crew tamper-proof documentation that holds up when it matters:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr><td style="padding:10px 0;font-size:14px;color:#94a3b8;border-bottom:1px solid #334155;"><span style="color:#22c55e;font-weight:700;margin-right:10px;">&#10003;</span> Before &amp; after photos with GPS timestamps</td></tr>
      <tr><td style="padding:10px 0;font-size:14px;color:#94a3b8;border-bottom:1px solid #334155;"><span style="color:#22c55e;font-weight:700;margin-right:10px;">&#10003;</span> Client digital signatures captured on-site</td></tr>
      <tr><td style="padding:10px 0;font-size:14px;color:#94a3b8;border-bottom:1px solid #334155;"><span style="color:#22c55e;font-weight:700;margin-right:10px;">&#10003;</span> Cryptographic sealing &mdash; evidence can't be altered</td></tr>
      <tr><td style="padding:10px 0;font-size:14px;color:#94a3b8;border-bottom:1px solid #334155;"><span style="color:#22c55e;font-weight:700;margin-right:10px;">&#10003;</span> Works 100% offline, syncs when you're back online</td></tr>
      <tr><td style="padding:10px 0;font-size:14px;color:#94a3b8;"><span style="color:#22c55e;font-weight:700;margin-right:10px;">&#10003;</span> what3words precision location for every job</td></tr>
    </table>
    <p style="text-align:center;margin:28px 0 0;">
      <a href="${APP_URL}/demo" style="display:inline-block;background:#fbbf24;color:#0f172a;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(251,191,36,0.4);">Try the Demo</a>
    </p>
    <p style="text-align:center;margin-top:16px;">
      <a href="${APP_URL}/login" style="display:inline-block;background:#334155;color:#f1f5f9;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;border:1px solid #475569;">Go to Dashboard</a>
    </p>
  `)
}

export function loginEmail(loginUrl: string): string {
  return emailShell('Log In to JobProof', '', `
    <p style="text-align:center;color:#cbd5e1;font-size:15px;line-height:1.65;margin:0 0 16px;">Click the button below to securely log in to your dashboard:</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${loginUrl}" style="display:inline-block;background:#fbbf24;color:#0f172a;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(251,191,36,0.4);">Log In to JobProof</a>
    </p>
    <div style="height:1px;background:#334155;margin:24px 0;"></div>
    <p style="font-size:13px;color:#64748b;text-align:center;">This link expires in 15 minutes.<br>If you didn&rsquo;t request this, you can safely ignore this email.</p>
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
    <p style="color:#cbd5e1;font-size:15px;line-height:1.65;margin:0 0 16px;">You've been assigned a new job. Open it on your phone to document the work with photos, GPS, and client signature.</p>
    <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:14px 16px;margin:12px 0;">
      <p style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:0.8px;margin:0;">Job Title</p>
      <p style="font-size:15px;color:#f1f5f9;font-weight:500;margin:3px 0 0;">${jobTitle}</p>
    </div>
    ${address ? `<div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:14px 16px;margin:12px 0;"><p style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:0.8px;margin:0;">Address</p><p style="font-size:15px;color:#f1f5f9;font-weight:500;margin:3px 0 0;">${address}</p></div>` : ''}
    ${instructions ? `<div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:14px 16px;margin:12px 0;"><p style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:0.8px;margin:0;">Instructions</p><p style="font-size:15px;color:#f1f5f9;font-weight:500;margin:3px 0 0;">${instructions}</p></div>` : ''}
    <p style="text-align:center;margin:28px 0 0;">
      <a href="${jobUrl}" style="display:inline-block;background:#fbbf24;color:#0f172a;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(251,191,36,0.4);">Open Job</a>
    </p>
    <div style="height:1px;background:#334155;margin:24px 0;"></div>
    <p style="font-size:13px;color:#64748b;text-align:center;">Open this link on your phone for the best experience.</p>
  `)
}

export function jobCompleteEmail(
  jobTitle: string,
  address: string,
  crewName: string,
  jobUrl: string
): string {
  return emailShell('Job Complete', '', `
    <p style="text-align:center;margin:0 0 20px;"><!-- badge --><span style="display:inline-block;background:#064e3b;color:#34d399;font-size:11px;font-weight:700;padding:6px 14px;border-radius:12px;text-transform:uppercase;letter-spacing:0.5px;border:1px solid #065f46;">Evidence Submitted</span></p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.65;margin:0 0 16px;">Your crew has completed the job and submitted their evidence &mdash; including before/after photos, GPS location, and client signature.</p>
    <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:14px 16px;margin:12px 0;">
      <p style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:0.8px;margin:0;">Job</p>
      <p style="font-size:15px;color:#f1f5f9;font-weight:500;margin:3px 0 0;">${jobTitle}</p>
    </div>
    ${address ? `<div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:14px 16px;margin:12px 0;"><p style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:0.8px;margin:0;">Address</p><p style="font-size:15px;color:#f1f5f9;font-weight:500;margin:3px 0 0;">${address}</p></div>` : ''}
    ${crewName ? `<div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:14px 16px;margin:12px 0;"><p style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:0.8px;margin:0;">Completed By</p><p style="font-size:15px;color:#f1f5f9;font-weight:500;margin:3px 0 0;">${crewName}</p></div>` : ''}
    <p style="text-align:center;margin:28px 0 0;">
      <a href="${jobUrl}" style="display:inline-block;background:#fbbf24;color:#0f172a;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(251,191,36,0.4);">Review Evidence</a>
    </p>
  `)
}
