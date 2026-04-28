'use server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function registrarCliente(formData: FormData) {
  const nombre = (formData.get('nombre') as string ?? '').trim()
  const email = (formData.get('email') as string ?? '').trim().toLowerCase()
  const telefono = (formData.get('telefono') as string ?? '').trim()
  const password = formData.get('password') as string

  if (!nombre || !email || !telefono || !password) return { error: 'Completa todos los campos' }
  if (password.length < 6) return { error: 'La clave debe tener mínimo 6 caracteres' }

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered')) {
      return { error: 'Este email ya está registrado. Inicia sesión.' }
    }
    return { error: error.message }
  }

  await admin.from('users').upsert({
    id: data.user.id,
    nombre,
    telefono,
    rol: 'cliente',
  })

  return { ok: true }
}
