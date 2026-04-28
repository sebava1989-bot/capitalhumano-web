'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OtpLoginModal } from '@/components/auth/OtpLoginModal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import type { Json } from '@/types/database'
import { crearReserva } from '@/app/[slug]/reservar/actions'
import { calcularDescuentoAlianza, type DescuentoAlianza } from '@/app/[slug]/reservar/descuento'

interface Props {
  barberia: { id: string; nombre: string; colores: Json }
  servicio: { id: string; nombre: string; precio: number; duracion_min: number }
  barbero: { id: string; nombre: string }
  fecha: Date
  hora: string
  refCode?: string
  onBack: () => void
}

export function BookingConfirm({ barberia, servicio, barbero, fecha, hora, refCode, onBack }: Props) {
  const params = useParams()
  const rawSlug = params.slug
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug ?? '')
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
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

  // Check for auto-discount (no code required)
  useEffect(() => {
    calcularDescuentoAlianza(barberia.id, servicio.id, fechaHora).then(r => {
      if (r) setAlianza(r)
    })
  }, [barberia.id, servicio.id, fechaHora])

  async function aplicarCodigo() {
    if (!codigoInput.trim()) return
    setCheckingCodigo(true)
    setCodigoError('')
    const r = await calcularDescuentoAlianza(barberia.id, servicio.id, fechaHora, codigoInput.trim())
    setCheckingCodigo(false)
    if (r) {
      setAlianza(r)
      setShowCodigoForm(false)
      setCodigoError('')
    } else {
      setCodigoError('Código no válido para este servicio o fecha.')
    }
  }

  const descuentoAlianza = alianza?.monto ?? 0
  const precioFinal = servicio.precio - descuentoAlianza

  async function confirmar() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setShowLogin(true)
        return
      }

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

      if (result.error) {
        toast.error('No pudimos confirmar tu reserva. Intenta de nuevo.')
        return
      }

      setConfirmed(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showLogin) return
    if (confirmed || loading) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) confirmar()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLogin])

  if (confirmed) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-white mb-2">¡Reserva confirmada!</h2>
        <p className="text-zinc-400 text-sm">Te enviamos la confirmación por email.</p>
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
          <span className="text-yellow-400 font-bold text-lg">
            ${precioFinal.toLocaleString('es-CL')}
          </span>
        </div>
      </div>

      {/* Código de descuento */}
      {!alianza && (
        <div className="mb-4">
          {!showCodigoForm ? (
            <button onClick={() => setShowCodigoForm(true)}
              className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors">
              ¿Tienes código de descuento?
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                value={codigoInput}
                onChange={e => setCodigoInput(e.target.value)}
                placeholder="Código de alianza"
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm
                  placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
              />
              <button onClick={aplicarCodigo} disabled={checkingCodigo || !codigoInput.trim()}
                className="px-3 py-2 bg-yellow-400 text-black text-sm font-bold rounded-lg
                  hover:bg-yellow-300 disabled:opacity-50 transition-colors">
                {checkingCodigo ? '…' : 'Aplicar'}
              </button>
            </div>
          )}
          {codigoError && <p className="text-red-400 text-xs mt-1">{codigoError}</p>}
        </div>
      )}

      <button
        onClick={confirmar}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-yellow-400 text-black font-bold
          hover:bg-yellow-300 transition-colors disabled:opacity-50"
      >
        {loading ? 'Procesando...' : 'Confirmar reserva'}
      </button>

      <button onClick={onBack} className="w-full mt-3 text-zinc-400 text-sm hover:text-white transition-colors">
        ← Volver
      </button>

      <OtpLoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        redirectTo={`/${slug}/reservar`}
        slug={slug}
      />
    </div>
  )
}
