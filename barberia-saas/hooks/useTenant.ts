'use client'
import { useParams } from 'next/navigation'

export function useTenant() {
  const params = useParams()
  const rawSlug = params.slug
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug ?? '')
  return { slug }
}
