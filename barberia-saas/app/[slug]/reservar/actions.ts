'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { calcularDescuentoAlianza } from './descuento'

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
  alianzaCodigo?: string
}

export async function crearReserva(input: ReservaInput) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: userData } = await supabase.from('users').select('nombre').eq('id', user.id).maybeSingle()
  const nombre = input.clienteNombre || userData?.nombre || user.email?.split('@')[0] || 'Cliente'

  let descuento = 0
  // Descuento por alianza (se suma al de referido si ambos aplican)
  let alianzaDescuento = 0
  let alianzaId: string | null = null
  const alianzaResult = await calcularDescuentoAlianza(
    input.barberiaId, input.servicioId, input.fechaHora, input.alianzaCodigo
  )
  if (alianzaResult) {
    // Verificar que el cliente no haya agotado los usos permitidos
    const maxUsos = alianzaResult.maxUsosPorCliente
    let usosPrevios = 0
    if (maxUsos !== null) {
      const { count } = await adminSupabase
        .from('alianza_usos')
        .select('id', { count: 'exact', head: true })
        .eq('alianza_id', alianzaResult.alianzaId)
        .eq('cliente_id', user.id)
      usosPrevios = count ?? 0
    }
    if (maxUsos === null || usosPrevios < maxUsos) {
      alianzaDescuento = alianzaResult.monto
      alianzaId = alianzaResult.alianzaId
      descuento += alianzaDescuento
    }
  }

  // Descuento masivo pendiente (cargado por el admin a segmentos)
  let descuentoMasivoId: string | null = null
  const { data: dctoMasivo } = await adminSupabase
    .from('descuentos_masivos')
    .select('id, descuento_pct')
    .eq('barberia_id', input.barberiaId)
    .eq('cliente_id', user.id)
    .eq('canjeado', false)
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (dctoMasivo) {
    descuento += Math.round(input.precio * dctoMasivo.descuento_pct / 100)
    descuentoMasivoId = dctoMasivo.id
  }

  // Premios de referido pendientes — lógica acumulable
  const premiosCanjeadosIds: string[] = []
  const { data: barberiaConfRaw } = await adminSupabase
    .from('barberias')
    .select('referido_acumulable, referido_max_pct_por_servicio')
    .eq('id', input.barberiaId)
    .maybeSingle()
  const barberiaConf = barberiaConfRaw as { referido_acumulable: boolean; referido_max_pct_por_servicio: number } | null
  const acumulable = barberiaConf?.referido_acumulable ?? true
  const maxPct = barberiaConf?.referido_max_pct_por_servicio ?? 50

  const { data: premiosPendientes } = await adminSupabase
    .from('referido_premios')
    .select('id, descuento_pct')
    .eq('barberia_id', input.barberiaId)
    .eq('referidor_id', user.id)
    .eq('canjeado', false)
    .order('created_at')

  if (premiosPendientes && premiosPendientes.length > 0) {
    if (acumulable) {
      let pctRestante = maxPct
      for (const premio of premiosPendientes) {
        if (pctRestante <= 0) break
        const pctUsado = Math.min(premio.descuento_pct, pctRestante)
        descuento += Math.round(input.precio * pctUsado / 100)
        premiosCanjeadosIds.push(premio.id)
        pctRestante -= pctUsado
      }
    } else {
      const premio = premiosPendientes[0]
      descuento += Math.round(input.precio * premio.descuento_pct / 100)
      premiosCanjeadosIds.push(premio.id)
    }
  }

  const precioFinal = input.precio - descuento

  const { data: reserva, error } = await supabase.from('reservas').insert({
    barberia_id: input.barberiaId,
    cliente_id: user.id,
    barbero_id: input.barberoId,
    servicio_id: input.servicioId,
    fecha_hora: input.fechaHora,
    precio: input.precio,
    descuento,
    precio_final: precioFinal,
    estado: 'confirmada' as const,
    origen: 'web' as const,
    ref_code: input.refCode ?? null,
    cliente_email: user.email,
    cliente_nombre: nombre,
  }).select('id').single()

  if (error) return { error: error.message }

  // Registrar uso del descuento de alianza
  if (alianzaId) {
    await adminSupabase.from('alianza_usos').insert({
      alianza_id: alianzaId,
      cliente_id: user.id,
      reserva_id: reserva.id,
    })
  }

  // Marcar descuentos como canjeados
  if (descuentoMasivoId) {
    await adminSupabase.from('descuentos_masivos')
      .update({ canjeado: true, reserva_canje_id: reserva.id })
      .eq('id', descuentoMasivoId)
  }
  if (premiosCanjeadosIds.length > 0) {
    await adminSupabase.from('referido_premios')
      .update({ canjeado: true, reserva_canje_id: reserva.id })
      .in('id', premiosCanjeadosIds)
  }

  // Marcar slot como ocupado en disponibilidad
  const fechaDate = new Date(input.fechaHora)
  const fechaStr2 = fechaDate.toISOString().split('T')[0]
  const { data: disp } = await adminSupabase
    .from('disponibilidad').select('id, slots')
    .eq('barbero_id', input.barberoId).eq('barberia_id', input.barberiaId)
    .eq('fecha', fechaStr2).maybeSingle()

  const slotsActuales = Array.isArray(disp?.slots) ? disp.slots as { hora: string; reserva_id: string }[] : []
  const slotsActualizados = [...slotsActuales, { hora: input.horaSlot, reserva_id: reserva.id }]

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

  // Emails
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fecha = new Date(input.fechaHora)
  const fechaStr = fecha.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  const horaStr = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  const descuentoItems = [
    input.refCode && descuento - alianzaDescuento > 0
      ? `<li style="color:#4ade80">Descuento referido: -$${(descuento - alianzaDescuento).toLocaleString('es-CL')}</li>`
      : '',
    alianzaDescuento > 0 && alianzaResult
      ? `<li style="color:#4ade80">Dcto. alianza (${alianzaResult.nombre}): -$${alianzaDescuento.toLocaleString('es-CL')}</li>`
      : '',
  ].filter(Boolean).join('')

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
        <li>Precio: $${input.precio.toLocaleString('es-CL')}</li>
        ${descuentoItems}
        <li><strong>Total: $${precioFinal.toLocaleString('es-CL')}</strong></li>
      </ul>
      <p style="color:#888;font-size:12px">Si necesitas cancelar, responde este correo.</p>
    `,
  })

  if (emailErr) {
    return { ok: true, reservaId: reserva.id, descuento, emailError: emailErr.message }
  }

  return { ok: true, reservaId: reserva.id, descuento }
}
