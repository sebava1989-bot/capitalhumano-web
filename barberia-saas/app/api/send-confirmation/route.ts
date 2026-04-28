import { Resend } from 'resend'
import { render } from '@react-email/render'
import { ReservationConfirmed } from '@/emails/ReservationConfirmed'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  let reservaId: string
  try {
    const body = await request.json()
    reservaId = body?.reservaId
    if (!reservaId || typeof reservaId !== 'string') {
      return NextResponse.json({ error: 'reservaId requerido' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: reserva, error } = await supabase
    .from('reservas')
    .select(`
      id, fecha_hora, precio_final, cliente_email, cliente_nombre,
      servicios!inner(nombre),
      barberos!inner(nombre),
      barberias!inner(nombre)
    `)
    .eq('id', reservaId)
    .single()

  if (error || !reserva || !reserva.cliente_email) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  const fecha = new Date(reserva.fecha_hora)
  const servicioNombre = (reserva.servicios as unknown as Record<string, string>).nombre
  const barberoNombre = (reserva.barberos as unknown as Record<string, string>).nombre
  const barberiaNombre = (reserva.barberias as unknown as Record<string, string>).nombre

  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: reserva.cliente_email,
    subject: `✅ Reserva confirmada — ${barberiaNombre}`,
    html: await render(ReservationConfirmed({
      clienteNombre: reserva.cliente_nombre ?? 'Cliente',
      servicio: servicioNombre,
      barbero: barberoNombre,
      fecha: fecha.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }),
      hora: fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      barberiaNombre,
      precio: `$${reserva.precio_final.toLocaleString('es-CL')}`,
    })),
  })

  if (sendError) {
    return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
