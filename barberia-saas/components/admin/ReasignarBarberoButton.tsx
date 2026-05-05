'use client'
import { useState, useTransition, useRef, useEffect } from 'react'

interface Barbero { id: string; nombre: string }

interface Props {
  reservaId: string
  barberoActualId: string | null
  barberos: Barbero[]
  reasignarAction: (reservaId: string, nuevoBarberoId: string) => Promise<void>
}

export function ReasignarBarberoButton({ reservaId, barberoActualId, barberos, reasignarAction }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  const disponibles = barberos.filter(b => b.id !== barberoActualId)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  function seleccionar(barberoId: string) {
    setOpen(false)
    startTransition(() => reasignarAction(reservaId, barberoId))
  }

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={pending}
        className="text-xs px-2.5 py-1.5 rounded-lg font-medium
          bg-purple-500/10 text-purple-400 border border-purple-500/30
          hover:bg-purple-500/20 transition-colors whitespace-nowrap disabled:opacity-50"
      >
        {pending ? '...' : '↔ Barbero'}
      </button>

      {open && disponibles.length > 0 && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-800 border border-zinc-700
          rounded-xl shadow-2xl overflow-hidden min-w-[160px]">
          <p className="text-zinc-500 text-xs px-3 pt-2 pb-1">Reasignar a:</p>
          {disponibles.map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => seleccionar(b.id)}
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-700 transition-colors"
            >
              {b.nombre}
            </button>
          ))}
        </div>
      )}

      {open && disponibles.length === 0 && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-800 border border-zinc-700
          rounded-xl shadow-2xl px-3 py-2 min-w-[160px]">
          <p className="text-zinc-500 text-xs">Sin otros barberos</p>
        </div>
      )}
    </div>
  )
}
