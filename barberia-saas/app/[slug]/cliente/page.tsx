import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { CopyReferralButton } from '@/components/cliente/CopyReferralButton'

export default async function ClientePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${slug}/reservar?login=true`)

  const { data: barberia } = await supabase
    .from('barberias').select('id, nombre').eq('slug', slug).single()
  if (!barberia) notFound()

  const { data: userData } = await supabase
    .from('users').select('nombre, referral_code').eq('id', user.id).single()

  const { data: proximaCita } = await supabase
    .from('reservas')
    .select('id, fecha_hora, servicios(nombre), barberos(nombre)')
    .eq('cliente_id', user.id)
    .eq('barberia_id', barberia.id)
    .eq('estado', 'confirmada')
    .gte('fecha_hora', new Date().toISOString())
    .order('fecha_hora')
    .limit(1)
    .maybeSingle()

  const { data: historial } = await supabase
    .from('reservas')
    .select('id, fecha_hora, estado, precio_final, servicios(nombre), barberos(nombre)')
    .eq('cliente_id', user.id)
    .eq('barberia_id', barberia.id)
    .in('estado', ['completada', 'cancelada'])
    .order('fecha_hora', { ascending: false })
    .limit(10)

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-white text-lg font-bold">
          {userData?.nombre?.[0] ?? '?'}
        </div>
        <div>
          <p className="font-bold text-white text-lg">{userData?.nombre}</p>
          <p className="text-zinc-400 text-sm">{barberia.nombre}</p>
        </div>
      </div>

      {proximaCita && (
        <div className="bg-zinc-900 border border-yellow-400/30 rounded-xl p-4 mb-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-2">Próxima cita</p>
          <p className="text-white font-semibold">
            {new Date(proximaCita.fecha_hora).toLocaleDateString('es-CL', {
              weekday: 'long', day: 'numeric', month: 'long'
            })}
          </p>
          <p className="text-yellow-400 font-bold">
            {new Date(proximaCita.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            {' — '}{(proximaCita.servicios as unknown as { nombre: string })?.nombre} con {(proximaCita.barberos as unknown as { nombre: string })?.nombre}
          </p>
        </div>
      )}

      {userData?.referral_code && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-2">Tu código de referido</p>
          <div className="flex items-center justify-between">
            <p className="text-white text-xl font-bold tracking-widest">{userData.referral_code}</p>
            <CopyReferralButton referralCode={userData.referral_code} slug={slug} />
          </div>
          <p className="text-zinc-500 text-xs mt-2">Comparte y gana descuentos al traer amigos</p>
        </div>
      )}

      <div>
        <p className="text-zinc-400 text-xs uppercase tracking-wide mb-3">Historial</p>
        <div className="space-y-2">
          {historial?.map(r => (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-white text-sm font-medium">{(r.servicios as unknown as { nombre: string })?.nombre}</p>
                <p className="text-zinc-400 text-xs">
                  {new Date(r.fecha_hora).toLocaleDateString('es-CL')} · {(r.barberos as unknown as { nombre: string })?.nombre}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white text-sm">${(r.precio_final ?? 0).toLocaleString('es-CL')}</p>
                <span className={`text-xs ${r.estado === 'completada' ? 'text-green-400' : 'text-red-400'}`}>
                  {r.estado}
                </span>
              </div>
            </div>
          ))}
          {!historial?.length && <p className="text-zinc-500 text-sm">Aún no tienes reservas pasadas</p>}
        </div>
      </div>

      <Link href={`/${slug}/reservar`}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-black font-bold
          px-8 py-3 rounded-full shadow-lg hover:bg-yellow-300 transition-colors">
        + Nueva reserva
      </Link>
    </div>
  )
}
