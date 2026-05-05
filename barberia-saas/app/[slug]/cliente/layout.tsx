import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PushPermission } from '@/components/push/PushPermission'
import { PWAInstallPrompt } from '@/components/cliente/PWAInstallPrompt'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: barberia } = await supabase
    .from('barberias').select('nombre').eq('slug', slug).maybeSingle()
  const nombre = barberia?.nombre ?? 'Barbería'
  return {
    title: nombre,
    description: `Reserva tu hora en ${nombre}`,
    manifest: `/${slug}/cliente/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      title: nombre,
      statusBarStyle: 'black-translucent',
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  }
}

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <div className="max-w-lg mx-auto px-4 py-6 flex-1 w-full">{children}</div>
      <footer className="text-center py-4 text-zinc-700 text-xs">
        Desarrollado por <span className="text-zinc-500 font-medium">Tu Amigo Digital SpA</span>
      </footer>
      <PushPermission />
      <PWAInstallPrompt />
    </div>
  )
}
