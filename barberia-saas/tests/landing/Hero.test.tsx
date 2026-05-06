import { render, screen } from '@testing-library/react'
import { Hero } from '@/components/landing/Hero'

describe('Hero', () => {
  it('renders the main headline', () => {
    render(<Hero phone="56912345678" />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders the demo CTA link', () => {
    render(<Hero phone="56912345678" />)
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me/56912345678')
    )
  })
})
