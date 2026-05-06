import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { Suspense } from 'react'
import { WspReferralButton } from '@/components/cliente/WspReferralButton'
import { CalificarReservaForm } from '@/components/cliente/CalificarReservaForm'
import { CancelarCitaButton } from '@/components/cliente/CancelarCitaButton'
import { FeedbackServicioCard } from '@/components/cliente/FeedbackServicioCard'
import { InstallPWAButton } from '@/components/cliente/InstallPWAButton'
import { RecomendacionIA } from './recomendacion'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return {
    manifest: `/${slug}/cliente/manifest.webmanifest`,
  }
}

async function cancelarReserva(reservaId: string) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  // Verificar que la reserva pertenece al usuario
  const { data: reserva } = await supabase.from('reservas')
    .select('id, cliente_id, barberia_id, barbero_id, servicio_id, fecha_hora, cliente_nombre')
    .eq('id', reservaId)
    .eq('cliente_id', user.id)
    .maybeSingle()
  if (!reserva) return
  // Usar admin client para bypassear RLS en el update
  const admin = createAdminClient()
  await admin.from('reservas')
    .update({ estado: 'cancelada' })
    .eq('id', reservaId)
  // Notificar al admin vía Edge Function
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  fetch(`${supabaseUrl}/functions/v1/notify-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ record: reserva, tipo: 'cancelacion' }),
  }).catch(() => null)
  // Obtener slug de la barbería para revalidar el panel admin
  const { data: barberia } = await admin.from('barberias')
    .select('slug')
    .eq('id', reserva.barberia_id)
    .maybeSingle()
  revalidatePath('/', 'layout')
  if (barberia?.slug) revalidatePath(`/${barberia.slug}/admin`)
}

export default async function ClientePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${slug}/reservar?login=true`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barberia } = await (supabase as any)
    .from('barberias').select('id, nombre, referido_descuento_nuevo_cliente_pct, referido_descuento_referido_pct').eq('slug', slug).single()
  if (!barberia) notFound()

  const admin = createAdminClient()
  const [{ data: userData }, { data: premiosRaw }, { data: descuentosMasivos }] = await Promise.all([
    supabase.from('users').select('nombre, referral_code').eq('id', user.id).single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('referido_premios')
      .select('id, descuento_pct, created_at, referido_id')
      .eq('referidor_id', user.id)
      .eq('barberia_id', barberia.id)
      .eq('canjeado', false)
      .eq('confirmado', true)
      .order('created_at', { ascending: false }),
    supabase.from('descuentos_masivos')
      .select('id, descuento_pct, motivo, created_at')
      .eq('cliente_id', user.id)
      .eq('barberia_id', barberia.id)
      .eq('canjeado', false)
      .order('created_at', { ascending: false }),
  ])

  // Enriquecer premios con nombre del referido y servicio de su cita
  const premios = await Promise.all((premiosRaw ?? []).map(async (p: { id: string; descuento_pct: number; created_at: string; referido_id: string }) => {
    const [{ data: referido }, { data: ultimaReserva }] = await Promise.all([
      admin.from('users').select('nombre').eq('id', p.referido_id).maybeSingle(),
      admin.from('reservas')
        .select('servicios(nombre)')
        .eq('cliente_id', p.referido_id)
        .eq('barberia_id', barberia.id)
        .eq('estado', 'completada')
        .order('fecha_hora', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    return {
      ...p,
      referidoNombre: referido?.nombre ?? 'Un amigo',
      servicioNombre: (ultimaReserva?.servicios as unknown as { nombre: string } | null)?.nombre ?? null,
    }
  }))

  // Reserva completada reciente sin calificar → mostrar card de feedback prominente
  const { data: sinCalificar } = await supabase
    .from('reservas')
    .select('id, servicios(nombre), barberos(nombre)')
    .eq('cliente_id', user.id)
    .eq('barberia_id', barberia.id)
    .eq('estado', 'completada')
    .is('calificacion', null)
    .order('fecha_hora', { ascending: false })
    .limit(1)
    .maybeSingle()

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const { data: proximaCita } = await supabase
    .from('reservas')
    .select('id, fecha_hora, estado, servicios(nombre), barberos(nombre)')
    .eq('cliente_id', user.id)
    .eq('barberia_id', barberia.id)
    .in('estado', ['confirmada', 'en_curso', 'pendiente'])
    .gte('fecha_hora', startOfToday.toISOString())
    .order('fecha_hora')
    .limit(1)
    .maybeSingle()

  const { data: historial } = await supabase
    .from('reservas')
    .select('id, fecha_hora, estado, precio_final, calificacion, servicios(nombre), barberos(nombre)')
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

      <Suspense fallback={null}>
        <RecomendacionIA clienteId={user.id} barberiaNombre={barberia.nombre} />
      </Suspense>

      {sinCalificar && (
        <FeedbackServicioCard
          reservaId={sinCalificar.id}
          barberiaNombre={barberia.nombre}
          barberiaId={barberia.id}
          servicio={(sinCalificar.servicios as unknown as { nombre: string })?.nombre ?? ''}
          barbero={(sinCalificar.barberos as unknown as { nombre: string })?.nombre ?? ''}
          slug={slug}
        />
      )}

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
          <CancelarCitaButton reservaId={proximaCita.id} slug={slug} cancelarAction={cancelarReserva} />
        </div>
      )}

      <div className="mb-4">
        <InstallPWAButton />
      </div>

      {userData?.referral_code && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-2">Tu código de referido</p>
          <p className="text-white text-xl font-bold tracking-widest mb-3">{userData.referral_code}</p>
          <WspReferralButton
            referralCode={userData.referral_code}
            slug={slug}
            barberiaNombre={barberia.nombre}
            descuentoPct={(barberia as Record<string, number>).referido_descuento_nuevo_cliente_pct || (barberia as Record<string, number>).referido_descuento_referido_pct || 10}
          />
          <p className="text-zinc-500 text-xs mt-2">Tu amigo recibe un descuento en su primera cita, ¡y tú también ganas un premio cuando se atienda!</p>
        </div>
      )}

      {descuentosMasivos && descuentosMasivos.length > 0 && (
        <div className="bg-zinc-900 border border-yellow-400/30 rounded-xl p-4 mb-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-2">🎁 Descuentos disponibles</p>
          {descuentosMasivos.map(d => (
            <div key={d.id} className="flex items-center justify-between py-1">
              <div>
                <p className="text-yellow-400 font-bold text-lg">{d.descuento_pct}% de descuento</p>
                <p className="text-zinc-500 text-xs">{d.motivo}</p>
              </div>
              <span className="text-zinc-500 text-xs">Se aplica en tu próxima reserva</span>
            </div>
          ))}
        </div>
      )}

      {premios && premios.length > 0 && (
        <div className="bg-zinc-900 border border-green-500/30 rounded-xl p-4 mb-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-3">🎁 Premios por referidos</p>
          {premios.map(p => (
            <div key={p.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-green-400 font-bold text-lg">{p.descuento_pct}% de descuento</p>
                <p className="text-zinc-300 text-sm">
                  Tu referido <span className="font-semibold text-white">{p.referidoNombre}</span> fue atendido
                  {p.servicioNombre && <span className="text-zinc-400"> · {p.servicioNombre}</span>}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">Se aplica automáticamente en tu próxima reserva</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-zinc-400 text-xs uppercase tracking-wide mb-3">Historial</p>
        <div className="space-y-2">
          {historial?.map(r => {
            const barberoNombre = (r.barberos as unknown as { nombre: string } | null)?.nombre
            return (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white text-sm font-medium">{(r.servicios as unknown as { nombre: string })?.nombre}</p>
                  <p className="text-zinc-400 text-xs">
                    {new Date(r.fecha_hora).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  {barberoNombre && (
                    <p className="text-zinc-500 text-xs mt-0.5">✂️ {barberoNombre}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-white text-sm">${(r.precio_final ?? 0).toLocaleString('es-CL')}</p>
                  <span className={`text-xs ${r.estado === 'completada' ? 'text-green-400' : 'text-red-400'}`}>
                    {r.estado}
                  </span>
                </div>
              </div>
              {r.estado === 'completada' && (
                r.calificacion ? (
                  <div className="mt-2 flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className={`text-sm ${i <= (r.calificacion as number) ? 'text-yellow-400' : 'text-zinc-700'}`}>★</span>
                    ))}
                  </div>
                ) : (
                  <CalificarReservaForm reservaId={r.id} slug={slug} />
                )
              )}
            </div>
          )})}
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
