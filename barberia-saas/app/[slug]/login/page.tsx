'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { registrarCliente } from './actions'

type Modo = 'login' | 'registro' | 'olvide'
type FaseOlvide = 'form' | 'enviado'

export default function LoginPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug ?? '')
  const redirectTo = searchParams.get('redirect') ?? `/${slug}/cliente`

  const [modo, setModo] = useState<Modo>('login')
  const [faseOlvide, setFaseOlvide] = useState<FaseOlvide>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // registro
  const [rNombre, setRNombre] = useState('')
  const [rEmail, setREmail] = useState('')
  const [rTelefono, setRTelefono] = useState('')
  const [rPassword, setRPassword] = useState('')
  const [rConfirm, setRConfirm] = useState('')

  // olvide
  const [oEmail, setOEmail] = useState('')

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.href = redirectTo
    })
  }, [])

  function reset() { setError(''); setLoading(false) }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    reset()
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message.includes('Invalid') ? 'Email o clave incorrectos.' : err.message)
      return
    }
    window.location.href = redirectTo
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault()
    reset()
    if (rPassword !== rConfirm) { setError('Las claves no coinciden.'); return }
    setLoading(true)
    const fd = new FormData()
    fd.set('nombre', rNombre); fd.set('email', rEmail)
    fd.set('telefono', rTelefono); fd.set('password', rPassword)
    const result = await registrarCliente(fd)
    if (result.error) { setError(result.error); setLoading(false); return }
    // Auto login after registration
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email: rEmail, password: rPassword })
    setLoading(false)
    if (loginErr) { setError('Cuenta creada. Ahora inicia sesión.'); setModo('login'); setEmail(rEmail); return }
    window.location.href = redirectTo
  }

  async function handleOlvide(e: React.FormEvent) {
    e.preventDefault()
    reset()
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(oEmail, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/${slug}/reset-password`,
    })
    setLoading(false)
    if (err) { setError('No pudimos enviar el correo. Verifica el email.'); return }
    setFaseOlvide('enviado')
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✂️</div>
          {modo === 'login' && <h1 className="text-2xl font-bold text-white">Ingresar</h1>}
          {modo === 'registro' && <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>}
          {modo === 'olvide' && <h1 className="text-2xl font-bold text-white">Recuperar clave</h1>}
        </div>

        {/* LOGIN */}
        {modo === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="Email" autoComplete="email"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Contraseña" autoComplete="current-password"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
            <div className="flex justify-between text-sm pt-1">
              <button type="button" onClick={() => { setModo('registro'); reset() }}
                className="text-zinc-400 hover:text-white transition-colors">
                ¿No tienes cuenta? Créala
              </button>
              <button type="button" onClick={() => { setModo('olvide'); reset() }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors">
                Olvidé mi clave
              </button>
            </div>
          </form>
        )}

        {/* REGISTRO */}
        {modo === 'registro' && (
          <form onSubmit={handleRegistro} className="space-y-3">
            <input value={rNombre} onChange={e => setRNombre(e.target.value)} required
              placeholder="Nombre completo" autoComplete="name"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
            <input type="email" value={rEmail} onChange={e => setREmail(e.target.value)} required
              placeholder="Email" autoComplete="email"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
            <input type="tel" value={rTelefono} onChange={e => setRTelefono(e.target.value)} required
              placeholder="Teléfono (+56 9...)" autoComplete="tel"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
            <input type="password" value={rPassword} onChange={e => setRPassword(e.target.value)} required
              placeholder="Contraseña (mín. 6 caracteres)" autoComplete="new-password"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
            <input type="password" value={rConfirm} onChange={e => setRConfirm(e.target.value)} required
              placeholder="Confirmar contraseña" autoComplete="new-password"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
            <button type="button" onClick={() => { setModo('login'); reset() }}
              className="w-full text-zinc-500 text-sm hover:text-zinc-300 transition-colors">
              ¿Ya tienes cuenta? Ingresar
            </button>
          </form>
        )}

        {/* OLVIDE */}
        {modo === 'olvide' && faseOlvide === 'form' && (
          <form onSubmit={handleOlvide} className="space-y-3">
            <p className="text-zinc-400 text-sm text-center mb-2">
              Ingresa tu email y te enviamos un link para crear una nueva clave.
            </p>
            <input type="email" value={oEmail} onChange={e => setOEmail(e.target.value)} required
              placeholder="tu@email.com"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors">
              {loading ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>
            <button type="button" onClick={() => { setModo('login'); reset() }}
              className="w-full text-zinc-500 text-sm hover:text-zinc-300 transition-colors">
              ← Volver
            </button>
          </form>
        )}

        {modo === 'olvide' && faseOlvide === 'enviado' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">📧</div>
            <p className="text-white font-semibold mb-1">¡Revisa tu correo!</p>
            <p className="text-zinc-400 text-sm">Te enviamos un link para restablecer tu contraseña.</p>
            <button onClick={() => { setModo('login'); setFaseOlvide('form'); reset() }}
              className="mt-4 text-zinc-500 text-xs hover:text-zinc-300 transition-colors">
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
