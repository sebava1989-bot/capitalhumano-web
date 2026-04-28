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

  await supabase.from('reservas')
    .update({ calificacion, nota_cliente: nota || null })
    .eq('id', reservaId)
    .eq('cliente_id', user.id)

  revalidatePath(`/${slug}/cliente`)
}
