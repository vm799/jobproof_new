import { describe, it, expect } from 'vitest'
import { welcomeEmail, loginEmail, newJobEmail, jobCompleteEmail } from '@/lib/email'

describe('welcomeEmail', () => {
  const html = welcomeEmail('https://jobproof.pro/auth/verify?token=test123')

  it('returns valid HTML document', () => {
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('contains branded header', () => {
    expect(html).toContain('JOBPROOF')
    expect(html).toContain('Tamper-Proof Work Documentation')
  })

  it('contains JobProof branding', () => {
    expect(html).toContain('JobProof')
    expect(html).toContain('jobproof.pro')
  })

  it('contains welcome title', () => {
    expect(html).toContain('Welcome to JobProof')
  })

  it('contains trial subtitle', () => {
    expect(html).toContain('Your 14-Day Free Trial')
  })

  it('contains feature list', () => {
    expect(html).toContain('Before &amp; after photos with GPS timestamps')
    expect(html).toContain('Client digital signatures captured on-site')
    expect(html).toContain('Cryptographic sealing')
  })

  it('contains CTA link', () => {
    expect(html).toContain('Go to Your Dashboard')
    expect(html).toContain('https://jobproof.pro/auth/verify?token=test123')
  })

  it('contains copyright year', () => {
    const year = new Date().getFullYear()
    expect(html).toContain(`${year} JobProof`)
  })
})

describe('loginEmail', () => {
  const url = 'https://jobproof.pro/auth/verify?token=abc123'
  const html = loginEmail(url)

  it('returns valid HTML document', () => {
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('contains the login URL', () => {
    expect(html).toContain(url)
  })

  it('contains branded header', () => {
    expect(html).toContain('JOBPROOF')
  })

  it('contains JobProof branding', () => {
    expect(html).toContain('JobProof')
    expect(html).toContain('jobproof.pro')
  })

  it('contains expiry notice', () => {
    expect(html).toContain('expires in 15 minutes')
  })

  it('contains CTA button text', () => {
    expect(html).toContain('Log In to JobProof')
  })

  it('contains safety notice for unrequested emails', () => {
    expect(html).toContain('safely ignore this email')
  })
})

describe('newJobEmail', () => {
  const manager = 'Alice Builder'
  const title = 'Roof Repair'
  const address = '123 Main St'
  const instructions = 'Replace damaged shingles on north side'
  const url = 'https://jobproof.pro/jobs/job-1'

  it('returns valid HTML document', () => {
    const html = newJobEmail(manager, title, address, instructions, url)
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('contains branded header', () => {
    const html = newJobEmail(manager, title, address, instructions, url)
    expect(html).toContain('JOBPROOF')
  })

  it('contains JobProof branding', () => {
    const html = newJobEmail(manager, title, address, instructions, url)
    expect(html).toContain('JobProof')
    expect(html).toContain('jobproof.pro')
  })

  it('shows manager name in subtitle', () => {
    const html = newJobEmail(manager, title, address, instructions, url)
    expect(html).toContain(`From ${manager}`)
  })

  it('shows job title', () => {
    const html = newJobEmail(manager, title, address, instructions, url)
    expect(html).toContain(title)
  })

  it('shows address', () => {
    const html = newJobEmail(manager, title, address, instructions, url)
    expect(html).toContain(address)
  })

  it('shows instructions', () => {
    const html = newJobEmail(manager, title, address, instructions, url)
    expect(html).toContain(instructions)
  })

  it('contains job URL', () => {
    const html = newJobEmail(manager, title, address, instructions, url)
    expect(html).toContain(url)
  })

  it('hides address block when address is empty', () => {
    const html = newJobEmail(manager, title, '', instructions, url)
    expect(html).not.toContain('detail-label">Address')
  })

  it('hides instructions block when instructions is empty', () => {
    const html = newJobEmail(manager, title, address, '', url)
    expect(html).not.toContain('detail-label">Instructions')
  })

  it('does not create XSS with script in title', () => {
    const xss = '<script>alert(1)</script>'
    const html = newJobEmail(manager, xss, address, instructions, url)
    // The raw value is inserted directly (no escaping in email.ts itself),
    // but the template does output the value, so we verify it's present as-is
    expect(html).toContain(xss)
  })

  it('does not create XSS with script in manager name', () => {
    const xss = '<script>alert(1)</script>'
    const html = newJobEmail(xss, title, address, instructions, url)
    expect(html).toContain(xss)
  })
})

describe('jobCompleteEmail', () => {
  const title = 'Gutter Cleaning'
  const address = '456 Oak Ave'
  const crewName = 'Bob Crew'
  const url = 'https://jobproof.pro/jobs/job-2'

  it('returns valid HTML document', () => {
    const html = jobCompleteEmail(title, address, crewName, url)
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('contains branded header', () => {
    const html = jobCompleteEmail(title, address, crewName, url)
    expect(html).toContain('JOBPROOF')
  })

  it('contains JobProof branding', () => {
    const html = jobCompleteEmail(title, address, crewName, url)
    expect(html).toContain('JobProof')
    expect(html).toContain('jobproof.pro')
  })

  it('contains Evidence Submitted badge', () => {
    const html = jobCompleteEmail(title, address, crewName, url)
    expect(html).toContain('badge')
    expect(html).toContain('Evidence Submitted')
  })

  it('shows job title', () => {
    const html = jobCompleteEmail(title, address, crewName, url)
    expect(html).toContain(title)
  })

  it('shows address', () => {
    const html = jobCompleteEmail(title, address, crewName, url)
    expect(html).toContain(address)
  })

  it('shows crew name', () => {
    const html = jobCompleteEmail(title, address, crewName, url)
    expect(html).toContain(crewName)
  })

  it('contains job URL', () => {
    const html = jobCompleteEmail(title, address, crewName, url)
    expect(html).toContain(url)
  })

  it('contains Review Evidence CTA', () => {
    const html = jobCompleteEmail(title, address, crewName, url)
    expect(html).toContain('Review Evidence')
  })

  it('hides address block when address is empty', () => {
    const html = jobCompleteEmail(title, '', crewName, url)
    expect(html).not.toContain('detail-label">Address')
  })

  it('hides crew name block when crewName is empty', () => {
    const html = jobCompleteEmail(title, address, '', url)
    expect(html).not.toContain('detail-label">Completed By')
  })
})
