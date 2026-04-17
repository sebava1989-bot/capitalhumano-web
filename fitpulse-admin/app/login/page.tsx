'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import { Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await login(email, password)
    setLoading(false)
    if (result.ok) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#CC3D00] flex items-center justify-center shadow-lg shadow-orange-200 mb-4">
            <Zap className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1a1a1a]">FitPulse Admin</h1>
          <p className="text-sm text-[#6b7280] mt-1">Panel del dueño del gimnasio</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e7eb] p-8 shadow-sm">
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="dueño@migym.cl"
              className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#FF4D00] text-white font-bold text-sm hover:bg-[#CC3D00] transition-colors disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar al panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
