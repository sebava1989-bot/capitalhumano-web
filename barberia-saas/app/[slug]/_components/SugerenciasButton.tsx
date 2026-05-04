'use client'
import { useState } from 'react'
import { enviarSugerencia } from '../sugerencias/actions'

type Tipo = 'elogio' | 'sugerencia' | 'reclamo'

const TIPOS: { value: Tipo; label: string; emoji: string; color: string }[] = [
  { value: 'elogio', label: 'Elogio', emoji: '⭐', color: 'border-green-400 text-green-400' },
  { value: 'sugerencia', label: 'Sugerencia', emoji: '💡', color: 'border-yellow-400 text-yellow-400' },
  { value: 'reclamo', label: 'Reclamo', emoji: '⚠️', color: 'border-red-400 text-red-400' },
]

export function SugerenciasButton({ barberiaId }: { barberiaId: string }) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<Tipo>('sugerencia')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<'ok' | 'ratelimit' | 'error' | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleEnviar() {
    if (!mensaje.trim()) return
    setLoading(true)
    const res = await enviarSugerencia(barberiaId, tipo, mensaje.trim())
    setLoading(false)
    if (res.ok) {
      setResultado('ok')
      setTimeout(() => {
        setOpen(false)
        setResultado(null)
        setMensaje('')
        setTipo('sugerencia')
      }, 2000)
    } else if (res.error === 'rate_limit') {
      setResultado('ratelimit')
    } else {
      setResultado('error')
      setErrorMsg(res.error ?? 'Error al enviar')
    }
  }

  function handleClose() {
    setOpen(false)
    setResultado(null)
    setMensaje('')
    setTipo('sugerencia')
    setErrorMsg('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-yellow-400 text-black
          flex items-center justify-center text-2xl
          shadow-[0_0_24px_rgba(250,204,21,0.4)] hover:shadow-[0_0_32px_rgba(250,204,21,0.6)]
          hover:bg-yellow-300 transition-all duration-200 hover:-translate-y-0.5"
        aria-label="Enviar sugerencia o reclamo"
      >
        💬
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            {resultado === 'ok' ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🙏</div>
                <p className="font-bold text-zinc-800 text-lg">¡Gracias por tu mensaje!</p>
                <p className="text-zinc-500 text-sm mt-1">Tu opinión nos ayuda a mejorar</p>
              </div>
            ) : resultado === 'ratelimit' ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">⏰</div>
                <p className="font-bold text-zinc-800">Ya enviaste hoy</p>
                <p className="text-zinc-500 text-sm mt-1">Puedes enviar una vez por día</p>
                <button onClick={handleClose} className="mt-4 text-sm text-yellow-600 underline">Cerrar</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-zinc-800 text-lg">Tu opinión</h2>
                  <button onClick={handleClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
                </div>

                <div className="flex gap-2 mb-4">
                  {TIPOS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTipo(t.value)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all
                        ${tipo === t.value ? t.color + ' bg-zinc-50' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <textarea
                    value={mensaje}
                    onChange={e => setMensaje(e.target.value.slice(0, 500))}
                    placeholder="Escribe tu mensaje aquí..."
                    rows={4}
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 text-sm
                      placeholder-zinc-400 focus:outline-none focus:border-yellow-400 resize-none transition-colors"
                  />
                  <span className="absolute bottom-3 right-3 text-xs text-zinc-400">{mensaje.length}/500</span>
                </div>

                {resultado === 'error' && (
                  <p className="text-red-500 text-sm mt-2 text-center">{errorMsg}</p>
                )}

                <button
                  onClick={handleEnviar}
                  disabled={loading || !mensaje.trim()}
                  className="mt-4 w-full bg-yellow-400 text-black font-bold py-3 rounded-xl
                    hover:bg-yellow-300 transition-colors shadow-[0_0_16px_rgba(250,204,21,0.25)]
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
