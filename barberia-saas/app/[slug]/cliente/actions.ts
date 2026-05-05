'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function generarRefCode(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  for (let i = 0; i < 10; i++) {
    const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const { count } = await admin
      .from('users').select('id', { count: 'exact', head: true }).eq('referral_code', code)
    if ((count ?? 0) === 0) return code
  }
  return 'R' + Date.now().toString(36).toUpperCase().slice(-5)
}

export async function actualizarPerfil(nombre: string, telefono: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const admin = createAdminClient()
  // Mantener referral_code existente o generar uno nuevo
  const { data: existing } = await admin.from('users').select('referral_code').eq('id', user.id).maybeSingle()
  const referral_code = existing?.referral_code ?? await generarRefCode(admin)
  await admin.from('users').upsert({ id: user.id, nombre, telefono, rol: 'cliente', referral_code })
  return { ok: true }
}

export async function calificarReserva(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const reservaId = formData.get('reserva_id') as string
  const calificacion = Number(formData.get('calificacion'))
  const nota = formData.get('nota') as string
  const slug = formData.get('slug') as string

  if (!reservaId || calificacion < 1 || calificacion > 5) return

  // Obtener barberia_id de la reserva para confirmar el premio del referidor
  const { data: reserva } = await supabase
    .from('reservas')
    .select('barberia_id')
    .eq('id', reservaId)
    .eq('cliente_id', user.id)
    .maybeSingle()

  const admin = createAdminClient()
  await admin.from('reservas')
    .update({ calificacion, nota_cliente: nota || null })
    .eq('id', reservaId)
    .eq('cliente_id', user.id)

  // Confirmar el premio de referido pendiente para quien refirió a este cliente
  if (reserva?.barberia_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: premiosConfirmados } = await (admin as any)
      .from('referido_premios')
      .select('id, referidor_id, descuento_pct')
      .eq('referido_id', user.id)
      .eq('barberia_id', reserva.barberia_id)
      .eq('confirmado', false)
      .eq('canjeado', false)

    if (premiosConfirmados && premiosConfirmados.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from('referido_premios')
        .update({ confirmado: true })
        .eq('referido_id', user.id)
        .eq('barberia_id', reserva.barberia_id)
        .eq('confirmado', false)
        .eq('canjeado', false)

      // Notificar al referidor por push
      const referidorId = premiosConfirmados[0].referidor_id
      const descuentoPct = premiosConfirmados[0].descuento_pct
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: referidor } = await (admin as any)
        .from('users')
        .select('fcm_token, nombre')
        .eq('id', referidorId)
        .maybeSingle()

      const fcmToken = referidor?.fcm_token
      const fcmKey = process.env.FCM_SERVER_KEY
      if (fcmToken && fcmKey) {
        fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${fcmKey}`,
          },
          body: JSON.stringify({
            to: fcmToken,
            notification: {
              title: '🎁 ¡Ganaste un descuento!',
              body: `Tu referido completó su primera cita. Tienes un ${descuentoPct}% de descuento disponible.`,
              sound: 'default',
            },
          }),
        }).catch(() => null)
      }
    }
  }

  revalidatePath(`/${slug}/cliente`)
}
