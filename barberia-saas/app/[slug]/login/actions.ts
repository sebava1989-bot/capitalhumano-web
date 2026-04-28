'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

async function generarRefCode(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  for (let i = 0; i < 10; i++) {
    const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const { count } = await (admin as unknown as SupabaseClient)
      .from('users').select('id', { count: 'exact', head: true }).eq('referral_code', code)
    if ((count ?? 0) === 0) return code
  }
  return 'R' + Date.now().toString(36).toUpperCase().slice(-5)
}

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

  const referral_code = await generarRefCode(admin)

  await admin.from('users').upsert({
    id: data.user.id,
    nombre,
    telefono,
    rol: 'cliente',
    referral_code,
  })

  return { ok: true }
}
