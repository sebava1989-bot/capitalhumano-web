'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function actualizarPerfil(nombre: string, telefono: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const admin = createAdminClient()
  await admin.from('users').upsert({ id: user.id, nombre, telefono, rol: 'cliente' })
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
