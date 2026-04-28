import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@3'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async () => {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const windowStart = new Date(in24h.getTime() - 15 * 60 * 1000)
  const windowEnd   = new Date(in24h.getTime() + 15 * 60 * 1000)

  const { data: reservas, error } = await supabase
    .from('reservas')
    .select(`
      id, fecha_hora, cliente_email, cliente_nombre,
      servicios!inner(nombre),
      barberos!inner(nombre),
      barberias!inner(nombre)
    `)
    .eq('estado', 'confirmada')
    .gte('fecha_hora', windowStart.toISOString())
    .lte('fecha_hora', windowEnd.toISOString())

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sent = 0
  for (const r of reservas ?? []) {
    if (!r.cliente_email) continue
    const hora = new Date(r.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const servicioNombre = (r.servicios as Record<string, string>).nombre
    const barberoNombre  = (r.barberos as Record<string, string>).nombre
    const barberiaNombre = (r.barberias as Record<string, string>).nombre

    await resend.emails.send({
      from: Deno.env.get('RESEND_FROM_EMAIL')!,
      to: r.cliente_email,
      subject: `⏰ Recordatorio: tu cita en ${barberiaNombre} es mañana a las ${hora}`,
      html: `<p>Hola ${r.cliente_nombre ?? 'Cliente'}, tu cita de <strong>${servicioNombre}</strong> con <strong>${barberoNombre}</strong> es mañana a las <strong>${hora}</strong>.</p>`,
    })
    sent++
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
