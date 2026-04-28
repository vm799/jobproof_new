import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/lib/csrf-client', () => ({
  ensureCsrfToken: vi.fn(),
  csrfHeaders: (h?: Record<string, string>) => h ?? {},
}))

vi.mock('@/lib/useOnlineStatus', () => ({
  useOnlineStatus: () => ({ isOnline: true }),
}))

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({ jobs: [] }),
}) as unknown as typeof fetch

import DashboardPage from '../app/dashboard/page'

describe('DashboardPage nav', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders Upgrade link to /upgrade', () => {
    render(<DashboardPage />)
    const link = screen.getByRole('link', { name: /upgrade/i })
    expect(link.getAttribute('href')).toBe('/upgrade')
  })

  it('exposes Settings via account menu dropdown', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getByRole('button', { name: /open account menu/i }))
    const link = screen.getByRole('menuitem', { name: /settings/i })
    expect(link.getAttribute('href')).toBe('/settings')
  })

  it('renders online status badge with role status', () => {
    render(<DashboardPage />)
    const status = screen.getByRole('status')
    expect(status.textContent).toMatch(/online/i)
  })
})
