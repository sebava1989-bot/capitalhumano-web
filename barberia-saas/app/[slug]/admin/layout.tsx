import Link from 'next/link'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const navItems = [
    { href: `/${slug}/admin`, label: 'Dashboard', icon: '📊' },
    { href: `/${slug}/admin/clientes`, label: 'Clientes', icon: '👥' },
    { href: `/${slug}/admin/campanas`, label: 'Campañas', icon: '📣' },
    { href: `/${slug}/admin/suscripciones`, label: 'Suscripciones', icon: '💳' },
    { href: `/${slug}/admin/alianzas`, label: 'Alianzas', icon: '🤝' },
    { href: `/${slug}/admin/barberos`, label: 'Barberos', icon: '✂️' },
    { href: `/${slug}/admin/servicios`, label: 'Servicios', icon: '💈' },
    { href: `/${slug}/admin/sugerencias`, label: 'Sugerencias', icon: '💬' },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <aside className="hidden md:flex w-56 flex-col bg-zinc-900 border-r border-zinc-800 p-4">
        <div className="text-yellow-400 font-bold text-lg mb-8 px-2">⚙ Admin</div>
        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-400
                hover:text-white hover:bg-zinc-800 transition-colors text-sm"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 text-white overflow-auto">{children}</main>
    </div>
  )
}
