import { render, screen } from '@testing-library/react'
import { Pricing } from '@/components/landing/Pricing'

describe('Pricing', () => {
  it('renders the price', () => {
    render(<Pricing phone="56912345678" />)
    expect(screen.getByText(/15\.000/)).toBeInTheDocument()
  })

  it('renders the no-contract disclaimer', () => {
    render(<Pricing phone="56912345678" />)
    expect(screen.getByText(/sin contrato/i)).toBeInTheDocument()
  })

  it('renders CTA link to WhatsApp', () => {
    render(<Pricing phone="56912345678" />)
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me/56912345678')
    )
  })
})
