'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const params = useParams()
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Supabase establece la sesión automáticamente al aterrizar desde el link de recuperación
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Las claves no coinciden.'); return }
    if (password.length < 6) { setError('Mínimo 6 caracteres.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => { window.location.href = `/${slug}/cliente` }, 2000)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-white font-bold text-xl">¡Clave actualizada!</p>
          <p className="text-zinc-400 text-sm mt-1">Redirigiendo…</p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Verificando sesión…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-white">Nueva contraseña</h1>
          <p className="text-zinc-400 text-sm mt-1">Elige una clave segura</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            placeholder="Nueva contraseña (mín. 6 caracteres)" autoComplete="new-password"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
            placeholder="Confirmar contraseña" autoComplete="new-password"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors">
            {loading ? 'Guardando...' : 'Guardar nueva clave'}
          </button>
        </form>
      </div>
    </div>
  )
}
