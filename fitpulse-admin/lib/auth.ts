'use client'

const TOKEN_KEY = 'fp_admin_token'
const GYM_KEY = 'fp_admin_gym'

export function login(email: string, password: string): boolean {
  if (!email || !password) return false
  localStorage.setItem(TOKEN_KEY, 'demo-admin-token')
  localStorage.setItem(GYM_KEY, JSON.stringify({
    name: 'PowerGym Santiago',
    code: 'GYM01',
    owner: email.split('@')[0],
  }))
  return true
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
