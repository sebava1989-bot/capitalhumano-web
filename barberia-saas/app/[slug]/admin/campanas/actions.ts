'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function crearCampana(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const slug = formData.get('slug') as string
  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).maybeSingle()
  if (!barberia) return { error: 'Barbería no encontrada' }

  const { error } = await supabase.from('campanas').insert({
    barberia_id: barberia.id,
    titulo: formData.get('titulo') as string,
    asunto: formData.get('asunto') as string,
    mensaje_html: formData.get('mensaje_html') as string,
    segmento: formData.get('segmento') as string,
    estado: 'borrador',
  })

  if (error) return { error: error.message }
  revalidatePath(`/${slug}/admin/campanas`)
  return { ok: true }
}

export async function enviarCampana(campanaId: string, slug: string) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: campana } = await supabase
    .from('campanas').select('*').eq('id', campanaId).single()
  if (!campana) return { error: 'Campaña no encontrada' }
  if (campana.estado === 'enviada') return { error: 'Ya fue enviada' }

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).maybeSingle()
  if (!barberia) return { error: 'Barbería no encontrada' }

  // Marcar como enviando
  await adminSupabase.from('campanas').update({ estado: 'enviando' }).eq('id', campanaId)

  // Obtener clientes según segmento
  const ahora = Date.now()
  const hace30 = new Date(ahora - 30 * 24 * 60 * 60 * 1000).toISOString()
  const hace60 = new Date(ahora - 60 * 24 * 60 * 60 * 1000).toISOString()

  const { data: reservas } = await adminSupabase
    .from('reservas')
    .select('cliente_id, cliente_email, cliente_nombre, fecha_hora')
    .eq('barberia_id', barberia.id)
    .eq('estado', 'completada')
    .order('fecha_hora', { ascending: false })

  // Agrupar por cliente
  const clienteMap = new Map<string, { email: string; nombre: string; ultimaVisita: string; primeraVisita: string }>()
  for (const r of reservas ?? []) {
    const id = r.cliente_id as string
    if (!id || !r.cliente_email) continue
    const prev = clienteMap.get(id)
    if (!prev) {
      clienteMap.set(id, {
        email: r.cliente_email as string,
        nombre: (r.cliente_nombre as string) ?? 'Cliente',
        ultimaVisita: r.fecha_hora as string,
        primeraVisita: r.fecha_hora as string,
      })
    } else {
      if (r.fecha_hora > prev.ultimaVisita) prev.ultimaVisita = r.fecha_hora as string
      if (r.fecha_hora < prev.primeraVisita) prev.primeraVisita = r.fecha_hora as string
    }
  }

  // Filtrar por segmento
  const segmento = campana.segmento as string
  const destinatarios = [...clienteMap.values()].filter(c => {
    if (segmento === 'todos') return true
    const esNuevo = c.primeraVisita >= hace30
    const esInactivo = c.ultimaVisita < hace60
    if (segmento === 'nuevo') return esNuevo
    if (segmento === 'inactivo') return esInactivo
    if (segmento === 'frecuente') return !esNuevo && !esInactivo
    return false
  })

  // Enviar emails en batches de 10
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  let enviados = 0

  for (const dest of destinatarios) {
    const html = campana.mensaje_html
      .replace(/\{\{nombre\}\}/g, dest.nombre)
    const { error: emailErr } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: dest.email,
      subject: campana.asunto,
      html,
    })
    if (!emailErr) enviados++
  }

  await adminSupabase.from('campanas').update({
    estado: enviados > 0 ? 'enviada' : 'error',
    enviados,
    enviada_at: new Date().toISOString(),
  }).eq('id', campanaId)

  revalidatePath(`/${slug}/admin/campanas`)
  return { ok: true, enviados }
}

export async function eliminarCampana(campanaId: string, slug: string) {
  const supabase = await createClient()
  await supabase.from('campanas').delete().eq('id', campanaId)
  revalidatePath(`/${slug}/admin/campanas`)
}
