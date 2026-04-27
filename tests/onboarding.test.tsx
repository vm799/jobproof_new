import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingFlow, shouldShowOnboarding, STORAGE_KEY } from '../app/dashboard/OnboardingFlow'

describe('shouldShowOnboarding', () => {
  beforeEach(() => localStorage.clear())

  it('returns true when key not set', () => {
    expect(shouldShowOnboarding()).toBe(true)
  })

  it('returns false when key is set', () => {
    localStorage.setItem(STORAGE_KEY, '1')
    expect(shouldShowOnboarding()).toBe(false)
  })
})

describe('OnboardingFlow component', () => {
  beforeEach(() => localStorage.clear())

  it('renders first step on mount', () => {
    render(<OnboardingFlow onDone={vi.fn()} />)
    expect(screen.getByText(/Before & after/i)).toBeTruthy()
    expect(screen.getByText('Offline-first')).toBeTruthy()
  })

  it('advances to next step on Next click', () => {
    render(<OnboardingFlow onDone={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText(/GPS \+ timestamp/i)).toBeTruthy()
    expect(screen.getByText('Tamper-evident')).toBeTruthy()
  })

  it('shows final button on last step and persists key on click', () => {
    const onDone = vi.fn()
    render(<OnboardingFlow onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    const finalBtn = screen.getByRole('button', { name: /create my first job/i })
    fireEvent.click(finalBtn)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1')
    expect(onDone).toHaveBeenCalled()
  })

  it('skip button persists key', () => {
    const onDone = vi.fn()
    render(<OnboardingFlow onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /skip onboarding/i }))
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1')
    expect(onDone).toHaveBeenCalled()
  })

  it('has dialog role with labelledby', () => {
    render(<OnboardingFlow onDone={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-labelledby')).toBe('onboarding-title')
  })
})
