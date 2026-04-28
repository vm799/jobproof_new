import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AccountMenu } from '../app/dashboard/AccountMenu'

describe('AccountMenu', () => {
  beforeEach(() => vi.clearAllMocks())

  it('menu is closed by default', () => {
    render(<AccountMenu onLogout={vi.fn()} />)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('opens on trigger click and shows all menu items', () => {
    render(<AccountMenu onLogout={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /open account menu/i }))
    expect(screen.getByRole('menu')).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /settings/i }).getAttribute('href')).toBe('/settings')
    expect(screen.getByRole('menuitem', { name: /faq/i }).getAttribute('href')).toBe('/faq')
    expect(screen.getByRole('menuitem', { name: /roadmap/i }).getAttribute('href')).toBe('/roadmap')
    expect(screen.getByRole('menuitem', { name: /email support/i }).getAttribute('href')).toBe('mailto:vaishaligor25@gmail.com')
  })

  it('calls onLogout when log out item clicked', () => {
    const onLogout = vi.fn()
    render(<AccountMenu onLogout={onLogout} />)
    fireEvent.click(screen.getByRole('button', { name: /open account menu/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /log out/i }))
    expect(onLogout).toHaveBeenCalled()
  })

  it('closes menu on escape key', () => {
    render(<AccountMenu onLogout={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /open account menu/i }))
    expect(screen.getByRole('menu')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
