'use server'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

type Tipo = 'elogio' | 'sugerencia' | 'reclamo'

export async function enviarSugerencia(
  barberiaId: string,
  tipo: Tipo,
  mensaje: string
): Promise<{ ok: boolean; error?: string }> {
  if (!['elogio', 'sugerencia', 'reclamo'].includes(tipo)) {
    return { ok: false, error: 'Tipo inválido' }
  }
  if (!mensaje || mensaje.length < 1 || mensaje.length > 500) {
    return { ok: false, error: 'Mensaje inválido' }
  }

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'
  const ipHash = crypto.createHash('sha256').update(ip + barberiaId).digest('hex')

  const adminSupabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminSupabase as any

  // Rate limit: 1 por IP+barbería por 24h
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await db
    .from('sugerencias')
    .select('id', { count: 'exact', head: true })
    .eq('barberia_id', barberiaId)
    .eq('ip_hash', ipHash)
    .gte('created_at', desde)

  if ((count ?? 0) > 0) {
    return { ok: false, error: 'rate_limit' }
  }

  const { error: insertError } = await db.from('sugerencias').insert({
    barberia_id: barberiaId,
    tipo,
    mensaje,
    ip_hash: ipHash,
  })

  if (insertError) {
    return { ok: false, error: insertError.message }
  }

  // Notificación FCM al admin
  const { data: barberia } = await adminSupabase
    .from('barberias')
    .select('fcm_token_admin')
    .eq('id', barberiaId)
    .maybeSingle()

  const fcmToken = (barberia as { fcm_token_admin?: string | null } | null)?.fcm_token_admin
  if (fcmToken && process.env.FCM_SERVER_KEY) {
    const tipoLabel = { elogio: 'Elogio ⭐', sugerencia: 'Sugerencia 💡', reclamo: 'Reclamo ⚠️' }[tipo]
    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${process.env.FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: {
          title: tipoLabel,
          body: mensaje.length > 80 ? mensaje.slice(0, 77) + '...' : mensaje,
        },
        data: { tipo, barberia_id: barberiaId },
      }),
    }).catch(() => null)
  }

  return { ok: true }
}
