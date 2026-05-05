'use client'
import { useState, useTransition } from 'react'

interface Props {
  barberoId: string
  metaActual: number
  guardarMeta: (barberoId: string, meta: number) => Promise<void>
}

export function MetaBarberoCell({ barberoId, metaActual, guardarMeta }: Props) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(String(metaActual || ''))
  const [pending, startTransition] = useTransition()

  function guardar() {
    const meta = parseInt(valor.replace(/\D/g, '')) || 0
    startTransition(async () => {
      await guardarMeta(barberoId, meta)
      setEditando(false)
    })
  }

  if (editando) {
    return (
      <div className="flex items-center gap-1 min-w-[120px]">
        <input
          type="text"
          value={valor}
          onChange={e => setValor(e.target.value.replace(/\D/g, ''))}
          className="w-20 bg-zinc-800 border border-yellow-400/60 rounded px-2 py-1
            text-white text-xs focus:outline-none"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') setEditando(false) }}
        />
        <button onClick={guardar} disabled={pending}
          className="text-yellow-400 text-xs font-bold hover:text-yellow-300 disabled:opacity-50">
          {pending ? '…' : 'OK'}
        </button>
        <button onClick={() => setEditando(false)} className="text-zinc-600 text-xs hover:text-white">✕</button>
      </div>
    )
  }

  return (
    <button onClick={() => setEditando(true)}
      className="text-left hover:text-yellow-400 transition-colors group">
      <span className={metaActual > 0 ? 'text-zinc-300' : 'text-zinc-600'}>
        {metaActual > 0 ? `$${metaActual.toLocaleString('es-CL')}` : '—'}
      </span>
      <span className="text-zinc-700 text-xs ml-1 group-hover:text-yellow-400/60">✏️</span>
    </button>
  )
}
