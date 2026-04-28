'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug ?? '')
  const redirectTo = searchParams.get('redirect') ?? `/${slug}/cliente`

  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  // Si ya está logueado, redirigir directamente
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.href = redirectTo
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    setLoading(false)
    if (err) {
      setError('No pudimos enviar el link. Verifica el email.')
    } else {
      setStep('sent')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✂️</div>
          <h1 className="text-2xl font-bold text-white">Acceder</h1>
          <p className="text-zinc-400 text-sm mt-1">Te enviamos un link a tu correo</p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white
                placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl
                hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar link de acceso'}
            </button>
          </form>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">📧</div>
            <p className="text-white font-semibold mb-1">¡Link enviado!</p>
            <p className="text-zinc-400 text-sm">
              Revisa tu correo <span className="text-white">{email}</span> y haz clic en el link para acceder.
            </p>
            <button
              onClick={() => setStep('email')}
              className="mt-4 text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
            >
              Usar otro email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
