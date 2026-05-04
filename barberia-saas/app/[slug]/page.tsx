import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SugerenciasButton } from './_components/SugerenciasButton'

export default async function BarberiaLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id, nombre, logo_url, colores').eq('slug', slug).eq('activo', true).maybeSingle()
  if (!barberia) notFound()

  const { data: servicios } = await supabase
    .from('servicios').select('id, nombre, precio, duracion_min')
    .eq('barberia_id', barberia.id).eq('activo', true).order('orden').limit(6)

  const { data: barberos } = await supabase
    .from('barberos').select('id, nombre, foto_url')
    .eq('barberia_id', barberia.id).eq('activo', true)

  const { data: alianzas } = await supabase
    .from('alianzas').select('id, nombre, descripcion, tipo, beneficio, descuento_pct')
    .eq('barberia_id', barberia.id).eq('activo', true)

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="flex flex-col items-center justify-center min-h-[40vh] px-4 py-16 text-center">
        {barberia.logo_url && (
          <img src={barberia.logo_url} alt={barberia.nombre} className="h-20 mb-4" />
        )}
        <h1 className="text-4xl font-bold text-white mb-2">{barberia.nombre}</h1>
        <p className="text-zinc-400 mb-8">Tu estilo, tu identidad</p>
        <Link href={`/${slug}/reservar`}
          className="px-8 py-4 bg-yellow-400 text-black font-bold text-lg rounded-full
            hover:bg-yellow-300 transition-all duration-200
            shadow-[0_0_20px_rgba(250,204,21,0.25)] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)]">
          Reservar hora
        </Link>
      </section>

      {servicios && servicios.length > 0 && (
        <section className="max-w-2xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Nuestros servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servicios.map(s => (
              <div key={s.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4
                  flex justify-between items-center hover:-translate-y-0.5 hover:shadow-xl
                  hover:border-white/20 transition-all duration-200">
                <div>
                  <p className="text-white font-medium">{s.nombre}</p>
                  <p className="text-zinc-400 text-sm">{s.duracion_min} min</p>
                </div>
                <p className="text-yellow-400 font-bold">${s.precio.toLocaleString('es-CL')}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {barberos && barberos.length > 0 && (
        <section className="max-w-2xl mx-auto px-4 py-8 pb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Nuestro equipo</h2>
          <div className="flex justify-center gap-6 flex-wrap">
            {barberos.map(b => (
              <div key={b.id} className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-zinc-700 mb-2 overflow-hidden
                  ring-2 ring-white/10">
                  {b.foto_url
                    ? <img src={b.foto_url} alt={b.nombre} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">{b.nombre?.[0] ?? '?'}</div>
                  }
                </div>
                <p className="text-white text-sm font-medium">{b.nombre}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {alianzas && alianzas.length > 0 && (
        <section className="max-w-2xl mx-auto px-4 py-8 pb-16">
          <h2 className="text-2xl font-bold mb-2 text-center">Alianzas</h2>
          <p className="text-zinc-400 text-center text-sm mb-6">Beneficios exclusivos para nuestros clientes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {alianzas.map(a => (
              <div key={a.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4
                  flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-xl
                  hover:border-white/20 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">🤝</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{a.nombre}</p>
                    {a.descuento_pct && (
                      <span className="bg-yellow-400/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full font-medium">-{a.descuento_pct}%</span>
                    )}
                  </div>
                  {a.descripcion && <p className="text-zinc-400 text-xs">{a.descripcion}</p>}
                  {a.beneficio && (
                    <p className="text-yellow-400 text-xs font-medium mt-0.5">{a.beneficio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <SugerenciasButton barberiaId={barberia.id} />
    </main>
  )
}
