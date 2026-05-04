'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const email = `${codigo.toLowerCase().trim()}@barberia.local`
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Código o contraseña incorrectos')
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Error de sesión'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('users')
      .select('rol, barberia_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !['admin', 'superadmin'].includes(profile.rol)) {
      await supabase.auth.signOut()
      setError('Esta cuenta no tiene acceso de administrador')
      setLoading(false)
      return
    }

    if (!profile.barberia_id) {
      await supabase.auth.signOut()
      setError('Esta cuenta no tiene una barbería asignada')
      setLoading(false)
      return
    }

    const { data: barberia } = await supabase
      .from('barberias')
      .select('slug')
      .eq('id', profile.barberia_id)
      .maybeSingle()

    if (!barberia?.slug) {
      await supabase.auth.signOut()
      setError('No se encontró la barbería asociada')
      setLoading(false)
      return
    }

    router.push(`/${barberia.slug}/admin`)
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">✂️</span>
          <h1 className="text-2xl font-bold text-white mt-3">Admin Barbería</h1>
          <p className="text-zinc-400 text-sm mt-1">Acceso para administradores</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Código de barbería</label>
            <input
              type="text"
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              placeholder="STYLE2024"
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white
                placeholder-zinc-600 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white
                placeholder-zinc-600 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl
              hover:bg-yellow-300 transition-colors shadow-[0_0_20px_rgba(250,204,21,0.25)]
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  )
}
