'use client'
import { useState } from 'react'
import { enviarCampana, eliminarCampana } from '@/app/[slug]/admin/campanas/actions'
import { toast } from 'sonner'

interface Campana {
  id: string
  titulo: string
  asunto: string
  segmento: string
  estado: string
  enviados: number
  enviada_at: string | null
  created_at: string
}

const SEGMENTO_LABEL: Record<string, string> = {
  todos: 'Todos',
  nuevo: 'Nuevos',
  frecuente: 'Frecuentes',
  inactivo: 'Inactivos',
}

const ESTADO_COLOR: Record<string, string> = {
  borrador: 'text-zinc-400',
  enviando: 'text-blue-400',
  enviada: 'text-green-400',
  error: 'text-red-400',
}

export function CampanasTable({ campanas, slug }: { campanas: Campana[]; slug: string }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleEnviar(id: string) {
    setLoading(id)
    const result = await enviarCampana(id, slug)
    setLoading(null)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success(`Enviada a ${result.enviados} clientes`)
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar esta campaña?')) return
    await eliminarCampana(id, slug)
  }

  if (!campanas.length) {
    return <p className="text-zinc-500 text-sm text-center py-10">No hay campañas creadas aún</p>
  }

  return (
    <div className="space-y-3">
      {campanas.map(c => (
        <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-white font-semibold">{c.titulo}</p>
              <p className="text-zinc-400 text-sm truncate">{c.asunto}</p>
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-zinc-500">
                  Segmento: <span className="text-zinc-300">{SEGMENTO_LABEL[c.segmento] ?? c.segmento}</span>
                </span>
                <span className={ESTADO_COLOR[c.estado] ?? 'text-zinc-400'}>
                  {c.estado}
                  {c.estado === 'enviada' && ` · ${c.enviados} envíos`}
                </span>
              </div>
              {c.enviada_at && (
                <p className="text-zinc-600 text-xs mt-1">
                  {new Date(c.enviada_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {c.estado === 'borrador' && (
                <button
                  onClick={() => handleEnviar(c.id)}
                  disabled={loading === c.id}
                  className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-bold rounded-lg
                    hover:bg-yellow-300 disabled:opacity-50 transition-colors"
                >
                  {loading === c.id ? 'Enviando…' : 'Enviar'}
                </button>
              )}
              {c.estado === 'borrador' && (
                <button
                  onClick={() => handleEliminar(c.id)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-xs rounded-lg
                    hover:text-red-400 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
