'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

interface ReservaInput {
  barberiaId: string
  barberoId: string
  servicioId: string
  servicioNombre: string
  barberoNombre: string
  barberiaNombre: string
  precio: number
  fechaHora: string
  refCode?: string | null
  clienteNombre: string
  horaSlot: string
}

export async function crearReserva(input: ReservaInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: userData } = await supabase.from('users').select('nombre').eq('id', user.id).maybeSingle()
  const nombre = input.clienteNombre || userData?.nombre || user.email?.split('@')[0] || 'Cliente'

  const { data: reserva, error } = await supabase.from('reservas').insert({
    barberia_id: input.barberiaId,
    cliente_id: user.id,
    barbero_id: input.barberoId,
    servicio_id: input.servicioId,
    fecha_hora: input.fechaHora,
    precio: input.precio,
    descuento: 0,
    precio_final: input.precio,
    estado: 'confirmada' as const,
    origen: 'web' as const,
    ref_code: input.refCode ?? null,
    cliente_email: user.email,
    cliente_nombre: nombre,
  }).select('id').single()

  if (error) return { error: error.message }

  // Marcar slot como ocupado en disponibilidad (admin client para bypass RLS)
  const adminSupabase = createAdminClient()
  const fechaDate = new Date(input.fechaHora)
  const fechaStr2 = fechaDate.toISOString().split('T')[0]
  const horaSlot = input.horaSlot
  const { data: disp } = await adminSupabase
    .from('disponibilidad')
    .select('id, slots')
    .eq('barbero_id', input.barberoId)
    .eq('barberia_id', input.barberiaId)
    .eq('fecha', fechaStr2)
    .maybeSingle()

  const slotsActuales = Array.isArray(disp?.slots) ? disp.slots as { hora: string; reserva_id: string }[] : []
  const slotsActualizados = [...slotsActuales, { hora: horaSlot, reserva_id: reserva.id }]

  if (disp?.id) {
    await adminSupabase.from('disponibilidad').update({ slots: slotsActualizados }).eq('id', disp.id)
  } else {
    await adminSupabase.from('disponibilidad').insert({
      barbero_id: input.barberoId,
      barberia_id: input.barberiaId,
      fecha: fechaStr2,
      slots: slotsActualizados,
    })
  }

  // Enviar email de confirmación
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fecha = new Date(input.fechaHora)
  const fechaStr = fecha.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  const horaStr = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  const { error: emailErr } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: user.email!,
    subject: `✅ Reserva confirmada — ${input.barberiaNombre}`,
    html: `
      <h2 style="color:#e8c84a">✅ Reserva confirmada</h2>
      <p>Hola ${nombre},</p>
      <p>Tu hora en <strong>${input.barberiaNombre}</strong> está confirmada:</p>
      <ul>
        <li>Servicio: ${input.servicioNombre}</li>
        <li>Barbero: ${input.barberoNombre}</li>
        <li>Fecha: ${fechaStr}</li>
        <li>Hora: ${horaStr}</li>
        <li>Total: $${input.precio.toLocaleString('es-CL')}</li>
      </ul>
      <p style="color:#888;font-size:12px">Si necesitas cancelar, responde este correo.</p>
    `,
  })
  if (emailErr) {
    return { ok: true, reservaId: reserva.id, emailError: emailErr.message }
  }

  return { ok: true, reservaId: reserva.id }
}
