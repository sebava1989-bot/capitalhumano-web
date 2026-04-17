'use client'

const TOKEN_KEY = 'fp_admin_token'
const GYM_KEY = 'fp_admin_gym'
const API_URL = 'https://fitpulse-production-d06c.up.railway.app/api'

export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || 'Error al iniciar sesión' }
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(GYM_KEY, JSON.stringify(data.gym))
    return { ok: true }
  } catch {
    return { ok: false, error: 'No se pudo conectar al servidor' }
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(GYM_KEY)
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(TOKEN_KEY)
}

export function getGymInfo() {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(GYM_KEY)
  return raw ? JSON.parse(raw) : null
}
