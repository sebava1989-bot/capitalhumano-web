'use client'
import { useFormStatus } from 'react-dom'

interface Props {
  children: React.ReactNode
  pendingText: string
  className: string
}

export function AdminActionButton({ children, pendingText, className }: Props) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-40 disabled:cursor-not-allowed transition-all`}>
      {pending ? pendingText : children}
    </button>
  )
}
