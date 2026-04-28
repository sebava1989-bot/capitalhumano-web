'use client'
import { useState } from 'react'

export type Segmento = 'nuevo' | 'frecuente' | 'inactivo'

export interface ClienteSegmentado {
  id: string
  nombre: string
  email: string
  totalVisitas: number
  visitasCompletadas: number
  ultimaVisita: string | null
  primerVisita: string | null
  gastoTotal: number
  segmento: Segmento
}

const SEGMENTO_LABEL: Record<Segmento, string> = {
  nuevo: 'Nuevo',
  frecuente: 'Frecuente',
  inactivo: 'Inactivo',
}

const SEGMENTO_COLOR: Record<Segmento, string> = {
  nuevo: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  frecuente: 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30',
  inactivo: 'bg-zinc-700/40 text-zinc-400 border border-zinc-600/30',
}

type Filtro = 'todos' | Segmento

export function ClientesSegmentados({ clientes }: { clientes: ClienteSegmentado[] }) {
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const conteos = {
    todos: clientes.length,
    nuevo: clientes.filter(c => c.segmento === 'nuevo').length,
    frecuente: clientes.filter(c => c.segmento === 'frecuente').length,
    inactivo: clientes.filter(c => c.segmento === 'inactivo').length,
  }

  const visibles = filtro === 'todos' ? clientes : clientes.filter(c => c.segmento === filtro)

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['todos', 'frecuente', 'nuevo', 'inactivo'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtro === f
                ? 'bg-yellow-400 text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {f === 'todos' ? 'Todos' : SEGMENTO_LABEL[f]}
            <span className={`ml-1.5 text-xs ${filtro === f ? 'text-black/60' : 'text-zinc-600'}`}>
              {conteos[f]}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800">
            <tr>
              <th className="text-left p-3 text-zinc-400 font-medium">Cliente</th>
              <th className="text-left p-3 text-zinc-400 font-medium hidden md:table-cell">Visitas</th>
              <th className="text-left p-3 text-zinc-400 font-medium hidden md:table-cell">Gasto total</th>
              <th className="text-left p-3 text-zinc-400 font-medium hidden sm:table-cell">Última visita</th>
              <th className="text-left p-3 text-zinc-400 font-medium">Segmento</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map(c => (
              <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {c.nombre[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{c.nombre}</p>
                      <p className="text-zinc-500 text-xs truncate">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-zinc-300 hidden md:table-cell">
                  {c.visitasCompletadas}
                  {c.totalVisitas > c.visitasCompletadas && (
                    <span className="text-zinc-600 text-xs"> (+{c.totalVisitas - c.visitasCompletadas} pend.)</span>
                  )}
                </td>
                <td className="p-3 text-yellow-400 font-medium hidden md:table-cell">
                  ${Math.round(c.gastoTotal / 1000)}k
                </td>
                <td className="p-3 text-zinc-400 hidden sm:table-cell">
                  {c.ultimaVisita
                    ? new Date(c.ultimaVisita).toLocaleDateString('es-CL')
                    : '—'}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEGMENTO_COLOR[c.segmento]}`}>
                    {SEGMENTO_LABEL[c.segmento]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibles.length === 0 && (
          <p className="text-zinc-500 text-center py-10 text-sm">
            {filtro === 'todos' ? 'Aún no hay clientes con reservas' : `No hay clientes ${SEGMENTO_LABEL[filtro as Segmento].toLowerCase()}s`}
          </p>
        )}
      </div>
    </div>
  )
}
