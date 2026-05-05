import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: barberia } = await supabase
    .from('barberias')
    .select('nombre')
    .eq('slug', slug)
    .maybeSingle()

  const nombre = barberia?.nombre ?? 'Barbería'

  return NextResponse.json({
    name: nombre,
    short_name: nombre.split(' ')[0],
    description: `Reserva tu hora en ${nombre}`,
    start_url: `/${slug}/cliente`,
    scope: `/${slug}/`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }, {
    headers: { 'Content-Type': 'application/manifest+json' }
  })
}
