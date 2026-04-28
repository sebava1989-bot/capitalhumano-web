'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import type { Json } from '@/types/database'
import { crearReserva } from '@/app/[slug]/reservar/actions'
import { calcularDescuentoAlianza, type DescuentoAlianza } from '@/app/[slug]/reservar/descuento'
import { actualizarPerfil } from '@/app/[slug]/cliente/actions'
import { registrarCliente } from '@/app/[slug]/login/actions'

interface Props {
  barberia: { id: string; nombre: string; colores: Json }
  servicio: { id: string; nombre: string; precio: number; duracion_min: number }
  barbero: { id: string; nombre: string }
  fecha: Date
  hora: string
  refCode?: string
  onBack: () => void
}

type Step = 'loading' | 'auth' | 'profile' | 'summary' | 'confirmed'
type AuthMode = 'login' | 'registro'

export function BookingConfirm({ barberia, servicio, barbero, fecha, hora, refCode, onBack }: Props) {
  const params = useParams()
  const rawSlug = params.slug
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug ?? '')
  const [step, setStep] = useState<Step>('loading')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Auth fields
  const [aEmail, setAEmail] = useState('')
  const [aPassword, setAPassword] = useState('')
  const [aNombre, setANombre] = useState('')
  const [aTelefono, setATelefono] = useState('')
  const [aConfirm, setAConfirm] = useState('')

  // Profile fields (for users without nombre/telefono)
  const [pNombre, setPNombre] = useState('')
  const [pTelefono, setPTelefono] = useState('')
  const [pLoading, setPLoading] = useState(false)
  const [pError, setPError] = useState('')

  // Alianza discount
  const [alianza, setAlianza] = useState<DescuentoAlianza | null>(null)
  const [codigoInput, setCodigoInput] = useState('')
  const [showCodigoForm, setShowCodigoForm] = useState(false)
  const [codigoError, setCodigoError] = useState('')
  const [checkingCodigo, setCheckingCodigo] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const fechaHora = useMemo(() => {
    const d = new Date(fecha)
    const [h, m] = hora.split(':').map(Number)
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }, [fecha, hora])

  // Initial auth + alianza check
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStep('auth'); return }

      const discount = await calcularDescuentoAlianza(barberia.id, servicio.id, fechaHora, undefined, user.id)
      if (discount) setAlianza(discount)

      const { data: perfil } = await supabase.from('users').select('nombre, telefono').eq('id', user.id).maybeSingle()
      if (!perfil?.nombre || !perfil?.telefono) {
        setPNombre(perfil?.nombre ?? '')
        setStep('profile')
      } else {
        setStep('summary')
        confirmarDirectamente(user.id)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function aplicarCodigo() {
    if (!codigoInput.trim()) return
    setCheckingCodigo(true); setCodigoError('')
    const { data: { user } } = await supabase.auth.getUser()
    const r = await calcularDescuentoAlianza(barberia.id, servicio.id, fechaHora, codigoInput.trim(), user?.id)
    setCheckingCodigo(false)
    if (r) { setAlianza(r); setShowCodigoForm(false) }
    else setCodigoError('Código no válido para este servicio o fecha.')
  }

  const descuentoAlianza = alianza?.monto ?? 0
  const precioFinal = servicio.precio - descuentoAlianza

  async function confirmarDirectamente(userId?: string) {
    setBookingLoading(true)
    try {
      const result = await crearReserva({
        barberiaId: barberia.id,
        barberoId: barbero.id,
        servicioId: servicio.id,
        servicioNombre: servicio.nombre,
        barberoNombre: barbero.nombre,
        barberiaNombre: (barberia as unknown as { nombre: string }).nombre,
        precio: servicio.precio,
        fechaHora,
        refCode: refCode ?? null,
        clienteNombre: '',
        horaSlot: hora,
        alianzaCodigo: alianza?.requiereCodigo ? codigoInput.trim() : undefined,
      })
      if (result.error) { toast.error('No pudimos confirmar la reserva. Intenta de nuevo.'); return }
      setConfirmed(true)
    } finally {
      setBookingLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError(''); setAuthLoading(true)
    const { error, data } = await supabase.auth.signInWithPassword({ email: aEmail, password: aPassword })
    if (error) {
      setAuthLoading(false)
      setAuthError(error.message.includes('Invalid') ? 'Email o contraseña incorrectos.' : error.message)
      return
    }
    const user = data.user
    const discount = await calcularDescuentoAlianza(barberia.id, servicio.id, fechaHora, undefined, user.id)
    if (discount) setAlianza(discount)
    const { data: perfil } = await supabase.from('users').select('nombre, telefono').eq('id', user.id).maybeSingle()
    setAuthLoading(false)
    if (!perfil?.nombre || !perfil?.telefono) { setPNombre(perfil?.nombre ?? ''); setStep('profile') }
    else { setStep('summary'); confirmarDirectamente(user.id) }
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    if (aPassword !== aConfirm) { setAuthError('Las contraseñas no coinciden.'); return }
    setAuthLoading(true)
    const fd = new FormData()
    fd.set('nombre', aNombre); fd.set('email', aEmail)
    fd.set('telefono', aTelefono); fd.set('password', aPassword)
    const result = await registrarCliente(fd)
    if (result.error) { setAuthError(result.error); setAuthLoading(false); return }
    const { error: loginErr, data } = await supabase.auth.signInWithPassword({ email: aEmail, password: aPassword })
    if (loginErr) { setAuthError('Cuenta creada. Inicia sesión.'); setAuthMode('login'); setAuthLoading(false); return }
    const discount = await calcularDescuentoAlianza(barberia.id, servicio.id, fechaHora, undefined, data.user.id)
    if (discount) setAlianza(discount)
    setAuthLoading(false)
    setStep('summary')
    confirmarDirectamente(data.user.id)
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault()
    setPError('')
    if (!pNombre.trim() || !pTelefono.trim()) { setPError('Nombre y teléfono son obligatorios.'); return }
    setPLoading(true)
    const res = await actualizarPerfil(pNombre.trim(), pTelefono.trim())
    setPLoading(false)
    if (res?.error) { setPError(res.error); return }
    setStep('summary')
    confirmarDirectamente()
  }

  if (confirmed) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-white mb-2">¡Reserva confirmada!</h2>
        <p className="text-zinc-400 text-sm">Te enviamos la confirmación por email.</p>
      </div>
    )
  }

  if (step === 'loading') {
    return <div className="py-12 text-center text-zinc-500 text-sm">Cargando…</div>
  }

  // AUTH STEP
  if (step === 'auth') {
    return (
      <div>
        <div className="flex gap-2 mb-6">
          {(['login', 'registro'] as AuthMode[]).map(m => (
            <button key={m} onClick={() => { setAuthMode(m); setAuthError('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                authMode === m ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}>
              {m === 'login' ? 'Ya tengo cuenta' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        {authMode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="email" value={aEmail} onChange={e => setAEmail(e.target.value)} required
              placeholder="Email" autoComplete="email"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors text-sm" />
            <input type="password" value={aPassword} onChange={e => setAPassword(e.target.value)} required
              placeholder="Contraseña" autoComplete="current-password"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors text-sm" />
            {authError && <p className="text-red-400 text-xs">{authError}</p>}
            <button type="submit" disabled={authLoading}
              className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors">
              {authLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
            <a href={`/${slug}/login?redirect=${encodeURIComponent(`/${slug}/reservar`)}`}
              className="block text-center text-zinc-500 text-xs hover:text-zinc-300 transition-colors">
              ¿Olvidaste tu contraseña?
            </a>
          </form>
        ) : (
          <form onSubmit={handleRegistro} className="space-y-3">
            <input value={aNombre} onChange={e => setANombre(e.target.value)} required
              placeholder="Nombre completo" autoComplete="name"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors text-sm" />
            <input type="email" value={aEmail} onChange={e => setAEmail(e.target.value)} required
              placeholder="Email" autoComplete="email"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors text-sm" />
            <input type="tel" value={aTelefono} onChange={e => setATelefono(e.target.value)} required
              placeholder="Teléfono (+56 9...)" autoComplete="tel"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors text-sm" />
            <input type="password" value={aPassword} onChange={e => setAPassword(e.target.value)} required
              placeholder="Contraseña (mín. 6 caracteres)" autoComplete="new-password"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors text-sm" />
            <input type="password" value={aConfirm} onChange={e => setAConfirm(e.target.value)} required
              placeholder="Confirmar contraseña" autoComplete="new-password"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors text-sm" />
            {authError && <p className="text-red-400 text-xs">{authError}</p>}
            <button type="submit" disabled={authLoading}
              className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors">
              {authLoading ? 'Creando cuenta...' : 'Crear cuenta y confirmar'}
            </button>
          </form>
        )}

        <button onClick={onBack} className="w-full mt-4 text-zinc-400 text-sm hover:text-white transition-colors">
          ← Volver
        </button>
      </div>
    )
  }

  // PROFILE STEP
  if (step === 'profile') {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-1">Completa tu perfil</h2>
        <p className="text-zinc-400 text-sm mb-4">Solo la primera vez, para confirmar tu reserva.</p>
        <form onSubmit={handleProfile} className="space-y-3">
          <input value={pNombre} onChange={e => setPNombre(e.target.value)} required
            placeholder="Nombre completo"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors text-sm" />
          <input type="tel" value={pTelefono} onChange={e => setPTelefono(e.target.value)} required
            placeholder="Teléfono (+56 9...)"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors text-sm" />
          {pError && <p className="text-red-400 text-xs">{pError}</p>}
          <button type="submit" disabled={pLoading}
            className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors">
            {pLoading ? 'Guardando...' : 'Confirmar reserva'}
          </button>
        </form>
      </div>
    )
  }

  // SUMMARY STEP
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Confirmando reserva…</h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-zinc-400 text-sm">Servicio</span>
          <span className="text-white font-medium">{servicio.nombre}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400 text-sm">Barbero</span>
          <span className="text-white font-medium">{barbero.nombre}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400 text-sm">Fecha</span>
          <span className="text-white font-medium">
            {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400 text-sm">Hora</span>
          <span className="text-white font-medium">{hora}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400 text-sm">Precio</span>
          <span className="text-white">${servicio.precio.toLocaleString('es-CL')}</span>
        </div>
        {alianza && (
          <div className="flex justify-between text-green-400">
            <span className="text-sm">Dcto. alianza ({alianza.nombre})</span>
            <span className="font-medium">-${alianza.monto.toLocaleString('es-CL')}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-zinc-800 pt-3">
          <span className="text-zinc-400 text-sm">Total</span>
          <span className="text-yellow-400 font-bold text-lg">${precioFinal.toLocaleString('es-CL')}</span>
        </div>
      </div>

      {!alianza && (
        <div className="mb-4">
          {!showCodigoForm ? (
            <button onClick={() => setShowCodigoForm(true)}
              className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors">
              ¿Tienes código de descuento?
            </button>
          ) : (
            <div className="flex gap-2">
              <input value={codigoInput} onChange={e => setCodigoInput(e.target.value)} placeholder="Código de alianza"
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
              <button onClick={aplicarCodigo} disabled={checkingCodigo || !codigoInput.trim()}
                className="px-3 py-2 bg-yellow-400 text-black text-sm font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors">
                {checkingCodigo ? '…' : 'Aplicar'}
              </button>
            </div>
          )}
          {codigoError && <p className="text-red-400 text-xs mt-1">{codigoError}</p>}
        </div>
      )}

      {bookingLoading && (
        <div className="w-full py-3 rounded-xl bg-yellow-400/20 text-yellow-400 text-center font-medium text-sm">
          Procesando reserva…
        </div>
      )}
    </div>
  )
}
