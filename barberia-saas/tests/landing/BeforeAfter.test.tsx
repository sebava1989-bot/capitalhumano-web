import { render, screen } from '@testing-library/react'
import { BeforeAfter } from '@/components/landing/BeforeAfter'

describe('BeforeAfter', () => {
  it('renders before and after headings', () => {
    render(<BeforeAfter />)
    expect(screen.getByText(/sin barberdesk/i)).toBeInTheDocument()
    expect(screen.getByText(/con barberdesk/i)).toBeInTheDocument()
  })

  it('renders 3 pain point cards', () => {
    render(<BeforeAfter />)
    expect(screen.getAllByRole('listitem')).toHaveLength(6) // 3 antes + 3 después
  })
})
