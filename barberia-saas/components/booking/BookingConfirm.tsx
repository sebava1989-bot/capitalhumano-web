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
  const supabase = useMemo(() => createClient(), [])

  async function confirmar() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setShowLogin(true)
        return
      }

      const fechaHora = new Date(fecha)
      const [h, m] = hora.split(':').map(Number)
      fechaHora.setHours(h, m, 0, 0)

      const result = await crearReserva({
        barberiaId: barberia.id,
        barberoId: barbero.id,
        servicioId: servicio.id,
        servicioNombre: servicio.nombre,
        barberoNombre: barbero.nombre,
        barberiaNombre: (barberia as unknown as { nombre: string }).nombre,
        precio: servicio.precio,
        fechaHora: fechaHora.toISOString(),
        refCode: refCode ?? null,
        clienteNombre: '',
        horaSlot: hora,
      })

      if (result.error) {
        toast.error('No pudimos confirmar tu reserva. Intenta de nuevo.')
        return
      }

      if (result.emailError) {
        console.error('Email error:', result.emailError)
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

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 mb-6">
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
        <div className="flex justify-between border-t border-zinc-800 pt-3">
          <span className="text-zinc-400 text-sm">Total</span>
          <span className="text-yellow-400 font-bold text-lg">
            ${servicio.precio.toLocaleString('es-CL')}
          </span>
        </div>
      </div>

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
