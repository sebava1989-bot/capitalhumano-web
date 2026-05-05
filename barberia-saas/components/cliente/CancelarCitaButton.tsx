'use client'
import { useState, useTransition } from 'react'

interface Props {
  reservaId: string
  slug: string
  cancelarAction: (reservaId: string) => Promise<void>
}

export function CancelarCitaButton({ reservaId, slug, cancelarAction }: Props) {
  const [modal, setModal] = useState(false)
  const [pending, startTransition] = useTransition()

  function cancelar() {
    startTransition(async () => {
      await cancelarAction(reservaId)
      setModal(false)
    })
  }

  return (
    <>
      <button onClick={() => setModal(true)}
        className="mt-3 w-full text-xs text-red-400 border border-red-400/30 rounded-lg py-2
          hover:bg-red-400/10 transition-colors">
        Cancelar cita
      </button>

      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm">
            <p className="text-white font-bold text-lg mb-1">¿Qué deseas hacer?</p>
            <p className="text-zinc-400 text-sm mb-6">Puedes cambiar tu cita a otro horario o cancelarla definitivamente.</p>

            <div className="space-y-3">
              <a href={`/${slug}/reservar`}
                className="block w-full text-center py-3 bg-yellow-400 text-black font-bold rounded-xl
                  hover:bg-yellow-300 transition-colors">
                Cambiar a otro horario
              </a>
              <button onClick={cancelar} disabled={pending}
                className="w-full py-3 border border-red-500/50 text-red-400 font-medium rounded-xl
                  hover:bg-red-500/10 transition-colors disabled:opacity-50">
                {pending ? 'Cancelando…' : 'Cancelar definitivamente'}
              </button>
              <button onClick={() => setModal(false)}
                className="w-full py-2 text-zinc-500 text-sm hover:text-zinc-300 transition-colors">
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
