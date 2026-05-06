'use client'
import { useState } from 'react'
import { calificarReserva } from '@/app/[slug]/cliente/actions'
import { enviarSugerencia } from '@/app/[slug]/sugerencias/actions'

interface Props {
  reservaId: string
  barberiaNombre: string
  barberiaId: string
  servicio: string
  barbero: string
  slug: string
}

export function FeedbackServicioCard({ reservaId, barberiaNombre, barberiaId, servicio, barbero, slug }: Props) {
  const [step, setStep] = useState<'rating' | 'sugerencia' | 'done'>('rating')
  const [selected, setSelected] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<'elogio' | 'sugerencia' | 'reclamo'>('elogio')
  const [mensaje, setMensaje] = useState('')
  const [anonimo, setAnonimo] = useState(true)
  const [nombre, setNombre] = useState('')

  async function enviarCalificacion() {
    if (selected === 0) return
    setLoading(true)
    const fd = new FormData()
    fd.append('reserva_id', reservaId)
    fd.append('calificacion', String(selected))
    fd.append('slug', slug)
    await calificarReserva(fd)
    setLoading(false)
    setStep('sugerencia')
  }

  const [errorMsg, setErrorMsg] = useState('')

  async function enviarFeedback() {
    if (!mensaje.trim()) { setStep('done'); return }
    setLoading(true)
    const result = await enviarSugerencia(barberiaId, tipo, mensaje, anonimo ? undefined : nombre || undefined)
    setLoading(false)
    if (!result.ok) {
      setErrorMsg(result.error === 'rate_limit' ? 'Ya enviaste una opinión hoy. ¡Gracias!' : 'Error al enviar, intenta de nuevo.')
      return
    }
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="bg-zinc-900 border border-green-500/40 rounded-2xl p-5 mb-4 text-center">
        <p className="text-2xl mb-2">🙏</p>
        <p className="text-white font-bold">¡Gracias por tu opinión!</p>
        <p className="text-zinc-400 text-sm mt-1">Tu feedback ayuda a mejorar {barberiaNombre}.</p>
      </div>
    )
  }

  if (step === 'sugerencia') {
    return (
      <div className="bg-zinc-900 border border-yellow-400/30 rounded-2xl p-5 mb-4">
        <p className="text-yellow-400 font-bold text-base mb-1">¿Tienes algo que comentar?</p>
        <p className="text-zinc-400 text-xs mb-4">Opcional — tu opinión es muy valiosa para {barberiaNombre}</p>

        <div className="flex gap-2 mb-3">
          {(['elogio', 'sugerencia', 'reclamo'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                tipo === t
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {t === 'elogio' ? '⭐ Elogio' : t === 'sugerencia' ? '💡 Sugerencia' : '⚠️ Reclamo'}
            </button>
          ))}
        </div>

        <textarea
          value={mensaje}
          onChange={e => setMensaje(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Escribe tu comentario..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm placeholder-zinc-500 resize-none mb-3"
        />

        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setAnonimo(!anonimo)}
            className={`w-9 h-5 rounded-full transition-colors ${anonimo ? 'bg-zinc-600' : 'bg-yellow-400'}`}
          >
            <span className={`block w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${anonimo ? 'translate-x-0' : 'translate-x-4'}`} />
          </button>
          <span className="text-zinc-400 text-xs">{anonimo ? 'Anónimo' : 'Con mi nombre'}</span>
        </div>

        {!anonimo && (
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Tu nombre"
            maxLength={60}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm placeholder-zinc-500 mb-3"
          />
        )}

        {errorMsg && <p className="text-red-400 text-xs mb-2">{errorMsg}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep('done')}
            className="flex-1 py-2 rounded-xl text-zinc-400 text-sm border border-zinc-700 hover:border-zinc-500 transition-colors"
          >
            Omitir
          </button>
          <button
            type="button"
            onClick={enviarFeedback}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-yellow-400 text-black font-bold text-sm hover:bg-yellow-300 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Enviar'}
          </button>
        </div>
      </div>
    )
  }

  // step === 'rating'
  return (
    <div className="bg-zinc-900 border border-yellow-400/40 rounded-2xl p-5 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center text-xl">✂️</div>
        <div>
          <p className="text-white font-bold">¿Cómo estuvo tu corte?</p>
          <p className="text-zinc-400 text-xs">{servicio} con {barbero}</p>
        </div>
      </div>

      <div className="flex justify-center gap-3 mb-4">
        {[1,2,3,4,5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            className="text-4xl transition-transform hover:scale-110"
          >
            <span className={(i <= (hovered || selected)) ? 'text-yellow-400' : 'text-zinc-600'}>★</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={enviarCalificacion}
        disabled={selected === 0 || loading}
        className="w-full py-3 rounded-xl bg-yellow-400 text-black font-bold text-sm hover:bg-yellow-300 transition-colors disabled:opacity-40"
      >
        {loading ? 'Guardando...' : selected === 0 ? 'Selecciona una calificación' : 'Continuar'}
      </button>
    </div>
  )
}
