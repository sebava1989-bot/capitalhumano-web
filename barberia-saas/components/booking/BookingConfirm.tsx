'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Json } from '@/types/database'
import { crearReserva } from '@/app/[slug]/reservar/actions'
import { calcularDescuentoAlianza, type DescuentoAlianza } from '@/app/[slug]/reservar/descuento'
import { actualizarPerfil } from '@/app/[slug]/cliente/actions'

interface Props {
  barberia: { id: string; nombre: string; colores: Json }
  servicio: { id: string; nombre: string; precio: number; duracion_min: number }
  barbero: { id: string; nombre: string }
  fecha: Date
  hora: string
  refCode?: string
  onBack: () => void
}

type Step = 'loading' | 'profile' | 'summary' | 'confirmed'

export function BookingConfirm({ barberia, servicio, barbero, fecha, hora, refCode, onBack }: Props) {
  const [step, setStep] = useState<Step>('loading')
  const [bookingLoading, setBookingLoading] = useState(false)

  // Profile fields
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

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return // proxy guarantees auth, shouldn't happen

      const [discount, { data: perfil }] = await Promise.all([
        calcularDescuentoAlianza(barberia.id, servicio.id, fechaHora, undefined, user.id),
        supabase.from('users').select('nombre, telefono').eq('id', user.id).maybeSingle(),
      ])

      if (discount) setAlianza(discount)

      if (!perfil?.nombre || !perfil?.telefono) {
        setPNombre(perfil?.nombre ?? '')
        setStep('profile')
      } else {
        setStep('summary')
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

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault()
    setPError('')
    if (!pNombre.trim() || !pTelefono.trim()) { setPError('Nombre y teléfono son obligatorios.'); return }
    setPLoading(true)
    const res = await actualizarPerfil(pNombre.trim(), pTelefono.trim())
    setPLoading(false)
    if (res?.error) { setPError(res.error); return }
    setStep('summary')
  }

  async function confirmar() {
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
      setStep('confirmed')
    } finally {
      setBookingLoading(false)
    }
  }

  if (step === 'confirmed') {
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

  if (step === 'profile') {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-1">Completa tu perfil</h2>
        <p className="text-zinc-400 text-sm mb-4">Solo la primera vez, para confirmar tu reserva.</p>
        <form onSubmit={handleProfile} className="space-y-3">
          <input value={pNombre} onChange={e => setPNombre(e.target.value)} required
            placeholder="Nombre completo"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
          <input type="tel" value={pTelefono} onChange={e => setPTelefono(e.target.value)} required
            placeholder="Teléfono (+56 9...)"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors" />
          {pError && <p className="text-red-400 text-xs">{pError}</p>}
          <button type="submit" disabled={pLoading}
            className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors">
            {pLoading ? 'Guardando...' : 'Continuar →'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Confirma tu reserva</h2>

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
              <input value={codigoInput} onChange={e => setCodigoInput(e.target.value)}
                placeholder="Código de alianza"
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

      <button onClick={confirmar} disabled={bookingLoading}
        className="w-full py-3 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50">
        {bookingLoading ? 'Procesando...' : 'Confirmar reserva'}
      </button>

      <button onClick={onBack} className="w-full mt-3 text-zinc-400 text-sm hover:text-white transition-colors">
        ← Volver
      </button>
    </div>
  )
}
