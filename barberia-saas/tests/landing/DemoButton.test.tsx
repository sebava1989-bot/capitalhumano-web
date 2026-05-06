import { render, screen } from '@testing-library/react'
import { DemoButton } from '@/components/landing/DemoButton'

describe('DemoButton', () => {
  it('renders with correct WhatsApp href', () => {
    render(<DemoButton phone="56912345678" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me/56912345678')
    )
  })

  it('renders label text', () => {
    render(<DemoButton phone="56912345678" />)
    expect(screen.getByText(/demo/i)).toBeInTheDocument()
  })
})
