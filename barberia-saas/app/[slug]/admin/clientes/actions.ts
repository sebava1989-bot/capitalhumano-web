'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import Anthropic from '@anthropic-ai/sdk'

export async function asignarAlianza(clienteId: string, alianzaId: string, slug: string) {
  const supabase = await createClient()
  await supabase.from('alianza_clientes').upsert({ alianza_id: alianzaId, cliente_id: clienteId })
  revalidatePath(`/${slug}/admin/clientes`)
}

export async function quitarAlianza(clienteId: string, alianzaId: string, slug: string) {
  const supabase = await createClient()
  await supabase.from('alianza_clientes').delete()
    .eq('alianza_id', alianzaId).eq('cliente_id', clienteId)
  revalidatePath(`/${slug}/admin/clientes`)
}

export async function cargarDescuentoMasivo(
  barberiaId: string,
  clienteIds: string[],
  pct: number,
  motivo: string,
  slug: string,
  mensaje?: string,
) {
  if (!clienteIds.length || pct < 1 || pct > 100) return { error: 'Datos inválidos' }
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: barberia } = await supabase.from('barberias').select('nombre').eq('id', barberiaId).maybeSingle()
  const barberiaNombre = barberia?.nombre ?? 'Tu barbería'

  const rows = clienteIds.map(cliente_id => ({
    barberia_id: barberiaId,
    cliente_id,
    descuento_pct: pct,
    motivo,
  }))
  const { error } = await supabase.from('descuentos_masivos').insert(rows)
  if (error) return { error: error.message }

  // Generar texto del email
  let textoEmail = mensaje?.trim() ?? ''
  if (!textoEmail) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const ai = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [{
          role: 'user',
          content: `Escribe un mensaje corto (2-3 oraciones, tono cercano) para notificar a un cliente de barbería que tiene un ${pct}% de descuento disponible en ${barberiaNombre}. Motivo interno: "${motivo}". Solo el texto del mensaje, sin saludos ni firma.`,
        }],
      })
      textoEmail = (ai.content[0] as { type: string; text: string }).text.trim()
    } catch {
      textoEmail = `Tienes un ${pct}% de descuento disponible en ${barberiaNombre}. Se aplicará automáticamente en tu próxima reserva.`
    }
  }

  // Enviar emails
  const resend = new Resend(process.env.RESEND_API_KEY)
  const emailPromises = clienteIds.map(async (clienteId) => {
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(clienteId)
    const email = authUser?.user?.email
    if (!email) return
    const { data: perfil } = await adminSupabase.from('users').select('nombre').eq('id', clienteId).maybeSingle()
    const nombre = perfil?.nombre ?? 'Cliente'
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: `🎁 Tienes un ${pct}% de descuento en ${barberiaNombre}`,
      html: `
        <h2 style="color:#e8c84a">🎁 Tienes un descuento especial</h2>
        <p>Hola ${nombre},</p>
        <p>${textoEmail}</p>
        <div style="background:#1c1c1e;border-radius:12px;padding:16px;margin:16px 0;text-align:center">
          <p style="color:#a1a1aa;font-size:12px;margin:0 0 4px">Tu descuento disponible</p>
          <p style="color:#e8c84a;font-size:36px;font-weight:bold;margin:0">${pct}%</p>
          <p style="color:#a1a1aa;font-size:12px;margin:4px 0 0">Se aplica automáticamente en tu próxima reserva</p>
        </div>
        <p style="color:#888;font-size:12px">Este descuento es exclusivo para ti y tiene validez limitada.</p>
      `,
    })
  })
  await Promise.allSettled(emailPromises)

  revalidatePath(`/${slug}/admin/clientes`)
  return { ok: true, total: clienteIds.length }
}
