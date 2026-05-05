import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: barberia } = await supabase
    .from('barberias')
    .select('nombre, logo_url')
    .eq('slug', slug)
    .maybeSingle()

  const navItems = [
    { href: `/${slug}/admin`, label: 'Panel Central', icon: '📊' },
    { href: `/${slug}/admin/clientes`, label: 'Clientes', icon: '👥' },
    { href: `/${slug}/admin/campanas`, label: 'Campañas', icon: '📣' },
    { href: `/${slug}/admin/resumen`, label: 'Resumen Ejecutivo', icon: '📈' },
    { href: `/${slug}/admin/alianzas`, label: 'Alianzas', icon: '🤝' },
    { href: `/${slug}/admin/barberos`, label: 'Barberos', icon: '✂️' },
    { href: `/${slug}/admin/servicios`, label: 'Servicios', icon: '💈' },
    { href: `/${slug}/admin/sugerencias`, label: 'Sugerencias', icon: '💬' },
    { href: `/${slug}/admin/configuracion`, label: 'Configuración', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <aside className="hidden md:flex w-64 flex-col bg-zinc-900 border-r border-zinc-800/60 p-5
        shadow-[4px_0_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 mb-8 px-1">
          <img
            src={barberia?.logo_url ?? '/barberia-icon.png'}
            alt={barberia?.nombre ?? 'Logo'}
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className="font-bold text-white text-base">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400
                hover:text-white hover:bg-white/5
                hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.3)]
                transition-all text-sm font-medium group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="text-zinc-700 text-xs text-center pt-4 border-t border-zinc-800/60">
          Desarrollado por<br />
          <span className="text-zinc-600 font-medium">Tu Amigo Digital SpA</span>
        </p>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
