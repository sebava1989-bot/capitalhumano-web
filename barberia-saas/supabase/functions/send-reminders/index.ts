import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@3'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

function buildReminderHtml({ clienteNombre, servicio, barbero, hora }: {
  clienteNombre: string
  servicio: string
  barbero: string
  hora: string
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#111111;font-family:sans-serif;margin:0;padding:0">
  <div style="max-width:500px;margin:0 auto;padding:32px 16px">
    <h1 style="color:#e8c84a;font-size:22px;margin-bottom:16px">⏰ Tu cita es mañana</h1>
    <p style="color:#ffffff">Hola ${clienteNombre}, te recordamos:</p>
    <div style="background:#1a1a1a;padding:16px;border-radius:8px">
      <p style="color:#aaaaaa;margin:4px 0">Servicio: <span style="color:#fff">${servicio}</span></p>
      <p style="color:#aaaaaa;margin:4px 0">Barbero: <span style="color:#fff">${barbero}</span></p>
      <p style="color:#e8c84a;font-weight:bold;margin:4px 0">Hora: ${hora}</p>
    </div>
    <p style="color:#666666;font-size:12px;margin-top:24px">Si necesitas cancelar, responde este correo.</p>
  </div>
</body>
</html>`
}

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

    try {
      await resend.emails.send({
        from: Deno.env.get('RESEND_FROM_EMAIL')!,
        to: r.cliente_email,
        subject: `⏰ Recordatorio: tu cita en ${barberiaNombre} es mañana a las ${hora}`,
        html: buildReminderHtml({
          clienteNombre: r.cliente_nombre ?? 'Cliente',
          servicio: servicioNombre,
          barbero: barberoNombre,
          hora,
        }),
      })
      sent++
    } catch (err) {
      console.error(`Failed reminder for reserva ${r.id}:`, err)
    }
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
