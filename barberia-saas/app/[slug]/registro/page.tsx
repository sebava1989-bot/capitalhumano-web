'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { registrarClienteBarberia } from './actions'

export default function RegistroPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug ?? '')
  const refCode = searchParams.get('ref') ?? ''

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [barberiaNombre, setBarberiaNombre] = useState('')

  const supabase = createClient()

  useEffect(() => {
    supabase.from('barberias').select('nombre').eq('slug', slug).maybeSingle()
      .then(({ data }) => { if (data) setBarberiaNombre(data.nombre) })
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(`/${slug}/cliente`)
    })
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    setError('')
    const fd = new FormData()
    fd.set('nombre', nombre)
    fd.set('email', email)
    fd.set('telefono', telefono)
    fd.set('password', password)
    if (refCode) fd.set('referredByCode', refCode)

    const result = await registrarClienteBarberia(fd)
    if (result.error) { setError(result.error); setLoading(false); return }

    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (loginErr) { setError('Cuenta creada. Inicia sesión.'); router.push(`/${slug}/login`); return }
    const destino = refCode ? `/${slug}/reservar?ref=${refCode}` : `/${slug}/reservar`
    router.push(destino)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✂️</div>
          <h1 className="text-2xl font-bold text-white">{barberiaNombre || 'Barbería'}</h1>
          <p className="text-zinc-400 text-sm mt-1">Crea tu cuenta y reserva tu hora</p>
          {refCode && (
            <div className="mt-3 inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30
              text-yellow-400 text-xs px-3 py-1.5 rounded-full">
              <span>🎁</span>
              <span>Tienes un descuento por referido</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={nombre} onChange={e => setNombre(e.target.value)} required
            placeholder="Nombre completo" autoComplete="name"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white
              placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="Email" autoComplete="email"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white
              placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
          <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} required
            placeholder="Teléfono (+56 9...)" autoComplete="tel"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white
              placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            placeholder="Contraseña (mín. 6 caracteres)"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white
              placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
            placeholder="Confirmar contraseña"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white
              placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl
              hover:bg-yellow-300 disabled:opacity-50 transition-colors
              shadow-[0_0_20px_rgba(250,204,21,0.2)]">
            {loading ? 'Creando cuenta...' : 'Crear cuenta y reservar'}
          </button>

          <p className="text-center text-zinc-500 text-sm pt-1">
            ¿Ya tienes cuenta?{' '}
            <a href={`/${slug}/login`} className="text-yellow-400 hover:text-yellow-300 transition-colors">
              Iniciar sesión
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
