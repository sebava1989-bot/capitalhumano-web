import { render, screen } from '@testing-library/react'
import { Features } from '@/components/landing/Features'

describe('Features', () => {
  it('renders section heading', () => {
    render(<Features />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('renders 4 feature cards', () => {
    render(<Features />)
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })
})
