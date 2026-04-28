import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function BarberiaLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id, nombre, logo_url, colores').eq('slug', slug).eq('activo', true).single()
  if (!barberia) notFound()

  const { data: servicios } = await supabase
    .from('servicios').select('nombre, precio, duracion_min')
    .eq('barberia_id', barberia.id).eq('activo', true).order('orden').limit(6)

  const { data: barberos } = await supabase
    .from('barberos').select('nombre, foto_url')
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
          className="px-8 py-4 bg-yellow-400 text-black font-bold text-lg rounded-full hover:bg-yellow-300 transition-colors">
          Reservar hora
        </Link>
      </section>

      {servicios && servicios.length > 0 && (
        <section className="max-w-2xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Nuestros servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servicios.map(s => (
              <div key={s.nombre} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
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
              <div key={b.nombre} className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-zinc-700 mb-2 overflow-hidden">
                  {b.foto_url
                    ? <img src={b.foto_url} alt={b.nombre} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">{b.nombre[0]}</div>
                  }
                </div>
                <p className="text-white text-sm font-medium">{b.nombre}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
