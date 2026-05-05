'use client'
import { useState, useTransition } from 'react'

interface Props {
  metaActual: number
  barberiaId: string
  guardarMeta: (barberiaId: string, meta: number) => Promise<void>
}

export function MetaSemanal({ metaActual, barberiaId, guardarMeta }: Props) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(String(metaActual || ''))
  const [pending, startTransition] = useTransition()

  function guardar() {
    const meta = parseInt(valor.replace(/\D/g, '')) || 0
    startTransition(async () => {
      await guardarMeta(barberiaId, meta)
      setEditando(false)
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-zinc-400 text-xs uppercase tracking-wide mb-3">Meta semanal</p>
      {editando ? (
        <div className="flex gap-2 items-center">
          <span className="text-white font-bold text-lg">$</span>
          <input
            type="text"
            value={valor}
            onChange={e => setValor(e.target.value.replace(/\D/g, ''))}
            className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2
              text-white text-xl font-bold focus:outline-none focus:border-yellow-400 transition-colors"
            placeholder="0"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') setEditando(false) }}
          />
          <button onClick={guardar} disabled={pending}
            className="px-3 py-2 bg-yellow-400 text-black text-sm font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors">
            {pending ? '...' : 'OK'}
          </button>
          <button onClick={() => setEditando(false)}
            className="px-3 py-2 text-zinc-500 hover:text-white text-sm transition-colors">
            ✕
          </button>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-2">
          <p className="text-3xl font-bold text-white">
            {metaActual > 0 ? `$${metaActual.toLocaleString('es-CL')}` : <span className="text-zinc-600 text-xl">Sin meta</span>}
          </p>
          <button onClick={() => setEditando(true)}
            className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors mb-1 flex-shrink-0">
            ✏️ Editar
          </button>
        </div>
      )}
    </div>
  )
}
