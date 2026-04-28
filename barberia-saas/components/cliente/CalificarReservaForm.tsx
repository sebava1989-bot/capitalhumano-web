'use client'
import { useState } from 'react'
import { calificarReserva } from '@/app/[slug]/cliente/actions'

interface Props {
  reservaId: string
  slug: string
}

export function CalificarReservaForm({ reservaId, slug }: Props) {
  const [selected, setSelected] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    if (selected === 0) return
    setLoading(true)
    await calificarReserva(formData)
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="mt-2 flex gap-1">
        {[1,2,3,4,5].map(i => (
          <span key={i} className={`text-sm ${i <= selected ? 'text-yellow-400' : 'text-zinc-700'}`}>★</span>
        ))}
        <span className="text-zinc-500 text-xs ml-1">¡Gracias!</span>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="mt-2">
      <input type="hidden" name="reserva_id" value={reservaId} />
      <input type="hidden" name="calificacion" value={selected} />
      <input type="hidden" name="slug" value={slug} />
      <div className="flex items-center gap-1 mb-1">
        {[1,2,3,4,5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            className="text-lg leading-none transition-colors"
          >
            <span className={(i <= (hovered || selected)) ? 'text-yellow-400' : 'text-zinc-600'}>★</span>
          </button>
        ))}
      </div>
      {selected > 0 && (
        <>
          <input
            type="text"
            name="nota"
            placeholder="Comentario (opcional)"
            className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white placeholder-zinc-500 mb-1 mt-1"
          />
          <button
            type="submit"
            disabled={loading}
            className="text-xs bg-yellow-400 text-black font-semibold px-3 py-1 rounded hover:bg-yellow-300 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Enviar'}
          </button>
        </>
      )}
    </form>
  )
}
