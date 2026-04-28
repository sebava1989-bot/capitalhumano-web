'use client'
import { useParams } from 'next/navigation'

export function useTenant() {
  const params = useParams()
  return { slug: params.slug as string }
}
