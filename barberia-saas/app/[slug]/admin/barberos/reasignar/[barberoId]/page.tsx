import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

async function reasignarCita(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const admin = createAdminClient()
  const reservaId = formData.get('reservaId') as string
  const nuevoBarberoId = formData.get('nuevoBarberoId') as string
  const slug = formData.get('slug') as string
  const clienteEmail = formData.get('clienteEmail') as string | null
  const clienteNombre = formData.get('clienteNombre') as string | null
  const nuevoBarberoNombre = formData.get('nuevoBarberoNombre') as string | null
  const barberoId = formData.get('barberoId') as string

  if (!reservaId || !nuevoBarberoId || !slug) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await admin
    .from('reservas')
    .update({ barbero_id: nuevoBarberoId })
    .eq('id', reservaId)

  if (clienteEmail && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: clienteEmail,
      subject: 'Cambio en tu reserva',
      html: `<p>Hola ${clienteNombre ?? 'Cliente'},</p>
<p>Tu cita ha sido reasignada a <strong>${nuevoBarberoNombre ?? 'otro barbero'}</strong>. El horario se mantiene igual.</p>
<p>Si tienes dudas, contáctanos directamente.</p>`,
    }).catch(() => null)
  }

  revalidatePath(`/${slug}/admin/barberos/reasignar/${barberoId}`)
}

async function cancelarCita(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const admin = createAdminClient()
  const reservaId = formData.get('reservaId') as string
  const slug = formData.get('slug') as string
  const clienteEmail = formData.get('clienteEmail') as string | null
  const clienteNombre = formData.get('clienteNombre') as string | null
  const barberoId = formData.get('barberoId') as string

  if (!reservaId || !slug) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await admin
    .from('reservas')
    .update({ estado: 'cancelada' })
    .eq('id', reservaId)

  if (clienteEmail && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: clienteEmail,
      subject: 'Tu reserva fue cancelada',
      html: `<p>Hola ${clienteNombre ?? 'Cliente'},</p>
<p>Lamentamos informarte que tu cita ha sido cancelada debido a cambios en el equipo de barberos.</p>
<p>Por favor agenda una nueva hora a tu conveniencia. ¡Te esperamos!</p>`,
    }).catch(() => null)
  }

  revalidatePath(`/${slug}/admin/barberos/reasignar/${barberoId}`)
}

async function confirmarEliminar(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const admin = createAdminClient()
  const barberoId = formData.get('barberoId') as string
  const slug = formData.get('slug') as string
  if (!barberoId || !slug) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { count } = await admin
    .from('reservas')
    .select('id', { count: 'exact', head: true })
    .eq('barbero_id', barberoId)
    .in('estado', ['pendiente', 'confirmada'])

  if ((count ?? 0) > 0) return

  await admin.from('disponibilidad').delete().eq('barbero_id', barberoId)
  await admin.from('reservas').update({ barbero_id: null }).eq('barbero_id', barberoId)
  await admin.from('barberos').delete().eq('id', barberoId)
  redirect(`/${slug}/admin/barberos`)
}

async function cancelarTodasYEliminar(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const admin = createAdminClient()
  const barberoId = formData.get('barberoId') as string
  const slug = formData.get('slug') as string
  if (!barberoId || !slug) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Obtener todas las citas pendientes/confirmadas con email del cliente
  const { data: pendientes } = await admin
    .from('reservas')
    .select('id, cliente_email, cliente_nombre')
    .eq('barbero_id', barberoId)
    .in('estado', ['pendiente', 'confirmada'])

  if (pendientes && pendientes.length > 0) {
    await admin
      .from('reservas')
      .update({ estado: 'cancelada' })
      .eq('barbero_id', barberoId)
      .in('estado', ['pendiente', 'confirmada'])

    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      for (const r of pendientes) {
        if (r.cliente_email) {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL,
            to: r.cliente_email,
            subject: 'Tu reserva fue cancelada',
            html: `<p>Hola ${r.cliente_nombre ?? 'Cliente'},</p>
<p>Lamentamos informarte que tu cita fue cancelada debido a cambios en el equipo de barberos.</p>
<p>Por favor agenda una nueva hora. ¡Te esperamos!</p>`,
          }).catch(() => null)
        }
      }
    }
  }

  await admin.from('disponibilidad').delete().eq('barbero_id', barberoId)
  await admin.from('barberos').delete().eq('id', barberoId)
  redirect(`/${slug}/admin/barberos`)
}

type Reserva = {
  id: string
  fecha_hora: string
  estado: string
  cliente_nombre: string | null
  cliente_email: string | null
  servicios: { nombre: string } | null
}

type Barbero = { id: string; nombre: string }

export default async function ReasignarPage({
  params,
}: {
  params: Promise<{ slug: string; barberoId: string }>
}) {
  const { slug, barberoId } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).maybeSingle()
  if (!barberia) notFound()

  const { data: barbero } = await supabase
    .from('barberos').select('id, nombre').eq('id', barberoId).maybeSingle()
  if (!barbero) notFound()

  const { data: pendientesRaw } = await supabase
    .from('reservas')
    .select('id, fecha_hora, estado, cliente_nombre, cliente_email, servicios(nombre)')
    .eq('barbero_id', barberoId)
    .in('estado', ['pendiente', 'confirmada'])
    .order('fecha_hora')

  const pendientes: Reserva[] = (pendientesRaw ?? []).map(r => ({
    ...r,
    servicios: r.servicios as { nombre: string } | null,
  }))

  const { data: otrosBarberosRaw } = await supabase
    .from('barberos')
    .select('id, nombre')
    .eq('barberia_id', barberia.id)
    .eq('activo', true)
    .neq('id', barberoId)
    .order('nombre')

  const otrosBarberos: Barbero[] = (otrosBarberosRaw ?? []) as Barbero[]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <a href={`/${slug}/admin/barberos`}
          className="text-gray-400 hover:text-gray-700 transition-colors text-sm">
          ← Barberos
        </a>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
        <p className="text-yellow-800 font-semibold text-sm">
          Antes de eliminar a <strong>{barbero.nombre}</strong>, debes reasignar o cancelar sus citas pendientes
        </p>
        <p className="text-yellow-700 text-xs mt-1">
          {pendientes.length} {pendientes.length === 1 ? 'cita pendiente' : 'citas pendientes'}
        </p>
      </div>

      {pendientes.length > 0 ? (
        <div className="space-y-3 mb-6">
          {pendientes.map(r => (
            <div key={r.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-gray-900 font-semibold">{r.cliente_nombre ?? 'Cliente sin nombre'}</p>
                  <p className="text-gray-500 text-sm">
                    {new Date(r.fecha_hora).toLocaleDateString('es-CL', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })}{' '}
                    {new Date(r.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {r.servicios && <p className="text-gray-400 text-xs mt-0.5">{r.servicios.nombre}</p>}
                  {r.cliente_email && (
                    <p className="text-gray-400 text-xs">{r.cliente_email}</p>
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border
                  ${r.estado === 'confirmada'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                  {r.estado}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {otrosBarberos.length > 0 && (
                  <form action={reasignarCita} className="flex gap-2 flex-1 min-w-0">
                    <input type="hidden" name="reservaId" value={r.id} />
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="barberoId" value={barberoId} />
                    <input type="hidden" name="clienteEmail" value={r.cliente_email ?? ''} />
                    <input type="hidden" name="clienteNombre" value={r.cliente_nombre ?? ''} />
                    <select name="nuevoBarberoId" required
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm
                        focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 min-w-0">
                      <option value="">Seleccionar barbero...</option>
                      {otrosBarberos.map(b => (
                        <option key={b.id} value={b.id} data-nombre={b.nombre}>{b.nombre}</option>
                      ))}
                    </select>
                    {/* Pass barbero name via hidden + JS not possible in RSC, use server-side lookup */}
                    <input type="hidden" name="nuevoBarberoNombre" value="" />
                    <button type="submit"
                      className="px-4 py-2 bg-yellow-400 text-black text-sm font-bold rounded-xl
                        hover:bg-yellow-300 transition-colors whitespace-nowrap shadow-sm">
                      Reasignar
                    </button>
                  </form>
                )}
                <form action={cancelarCita}>
                  <input type="hidden" name="reservaId" value={r.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="barberoId" value={barberoId} />
                  <input type="hidden" name="clienteEmail" value={r.cliente_email ?? ''} />
                  <input type="hidden" name="clienteNombre" value={r.cliente_nombre ?? ''} />
                  <button type="submit"
                    className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-xl
                      border border-red-200 hover:bg-red-100 transition-colors whitespace-nowrap">
                    Cancelar cita
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 mb-6">
          <p className="text-4xl mb-2">✓</p>
          <p className="text-sm">No quedan citas pendientes</p>
        </div>
      )}

      <div className="space-y-3">
        {pendientes.length > 0 && (
          <form action={cancelarTodasYEliminar}>
            <input type="hidden" name="barberoId" value={barberoId} />
            <input type="hidden" name="slug" value={slug} />
            <button type="submit"
              className="w-full py-3 bg-red-600 text-white font-bold rounded-2xl
                hover:bg-red-700 transition-colors shadow-sm">
              Cancelar todas las citas y eliminar {barbero.nombre}
            </button>
          </form>
        )}

        <form action={confirmarEliminar}>
          <input type="hidden" name="barberoId" value={barberoId} />
          <input type="hidden" name="slug" value={slug} />
          <button
            type="submit"
            disabled={pendientes.length > 0}
            className="w-full py-3 border border-red-600/50 text-red-400 font-bold rounded-2xl
              hover:bg-red-600/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            {pendientes.length > 0
              ? `Eliminar solo si no hay citas (${pendientes.length} pendiente${pendientes.length > 1 ? 's' : ''})`
              : `Eliminar ${barbero.nombre} definitivamente`}
          </button>
        </form>
      </div>
    </div>
  )
}
