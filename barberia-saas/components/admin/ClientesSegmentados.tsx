'use client'
import { useState } from 'react'
import { asignarAlianza, quitarAlianza, cargarDescuentoMasivo } from '@/app/[slug]/admin/clientes/actions'
import { toast } from 'sonner'

export type Segmento = 'nuevo' | 'frecuente' | 'inactivo'

export interface ClienteSegmentado {
  id: string
  nombre: string
  email: string
  telefono: string
  referralCode: string
  totalVisitas: number
  visitasCompletadas: number
  ultimaVisita: string | null
  primerVisita: string | null
  gastoTotal: number
  segmento: Segmento
  alianzasAsignadas: string[]
}

interface AlianzaDisponible { id: string; nombre: string; descuento_pct: number | null }

interface Props {
  clientes: ClienteSegmentado[]
  alianzasDisponibles: AlianzaDisponible[]
  slug: string
  barberiaId: string
}

const SEGMENTO_LABEL: Record<Segmento, string> = {
  nuevo: 'Nuevo', frecuente: 'Frecuente', inactivo: 'Inactivo',
}

const SEGMENTO_COLOR: Record<Segmento, string> = {
  nuevo: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  frecuente: 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30',
  inactivo: 'bg-zinc-700/40 text-zinc-400 border border-zinc-600/30',
}

type Filtro = 'todos' | Segmento

function AlianzaCell({ cliente, alianzas, slug }: { cliente: ClienteSegmentado; alianzas: AlianzaDisponible[]; slug: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const asignadas = cliente.alianzasAsignadas

  async function toggle(alianzaId: string) {
    setLoading(true)
    if (asignadas.includes(alianzaId)) {
      await quitarAlianza(cliente.id, alianzaId, slug)
    } else {
      await asignarAlianza(cliente.id, alianzaId, slug)
    }
    setLoading(false)
    setOpen(false)
  }

  const asignadaNombre = alianzas.find(a => asignadas.includes(a.id))?.nombre

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={loading}
        className={`text-xs px-2 py-1 rounded-lg transition-colors ${
          asignadaNombre
            ? 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30'
            : 'bg-zinc-800 text-zinc-500 hover:text-white'
        }`}>
        {loading ? '…' : asignadaNombre ? `🤝 ${asignadaNombre}` : '+ Alianza'}
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl min-w-[180px]">
          {alianzas.length === 0 && (
            <p className="text-zinc-500 text-xs p-3">No hay alianzas con descuento</p>
          )}
          {alianzas.map(a => (
            <button key={a.id} onClick={() => toggle(a.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 flex items-center justify-between gap-2 ${
                asignadas.includes(a.id) ? 'text-yellow-400' : 'text-white'
              }`}>
              <span>{a.nombre}</span>
              <span className="text-zinc-500 text-xs">
                {asignadas.includes(a.id) ? '✓ Quitar' : `${a.descuento_pct}%`}
              </span>
            </button>
          ))}
          <button onClick={() => setOpen(false)}
            className="w-full text-center text-zinc-600 text-xs py-2 hover:text-zinc-400 border-t border-zinc-800">
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}

export function ClientesSegmentados({ clientes, alianzasDisponibles, slug, barberiaId }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [showDcto, setShowDcto] = useState(false)
  const [dctoMotivo, setDctoMotivo] = useState('')
  const [dctoPct, setDctoPct] = useState(10)
  const [dctoMensaje, setDctoMensaje] = useState('')
  const [dctoLoading, setDctoLoading] = useState(false)

  const filtrados = busqueda.trim()
    ? clientes.filter(c => {
        const q = busqueda.toLowerCase()
        return c.nombre.toLowerCase().includes(q)
          || c.email.toLowerCase().includes(q)
          || c.telefono.includes(q)
          || c.referralCode.toLowerCase().includes(q)
      })
    : clientes

  const conteos = {
    todos: filtrados.length,
    nuevo: filtrados.filter(c => c.segmento === 'nuevo').length,
    frecuente: filtrados.filter(c => c.segmento === 'frecuente').length,
    inactivo: filtrados.filter(c => c.segmento === 'inactivo').length,
  }

  const visibles = filtro === 'todos' ? filtrados : filtrados.filter(c => c.segmento === filtro)

  async function aplicarDescuento() {
    if (!visibles.length || dctoPct < 1 || dctoPct > 100) return
    setDctoLoading(true)
    const motivo = dctoMotivo.trim() || `Descuento ${filtro === 'todos' ? 'general' : filtro}`
    const result = await cargarDescuentoMasivo(barberiaId, visibles.map(c => c.id), dctoPct, motivo, slug, dctoMensaje.trim() || undefined)
    setDctoLoading(false)
    if (result?.error) { toast.error(result.error); return }
    toast.success(`${dctoPct}% cargado y notificado a ${result?.total} cliente${result?.total === 1 ? '' : 's'}`)
    setShowDcto(false)
    setDctoMotivo('')
    setDctoMensaje('')
  }

  return (
    <div>
      <input
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, email, teléfono o código..."
        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors mb-4"
      />
      <div className="flex gap-2 mb-4 flex-wrap items-center justify-between">
        {(['todos', 'frecuente', 'nuevo', 'inactivo'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtro === f ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}>
            {f === 'todos' ? 'Todos' : SEGMENTO_LABEL[f]}
            <span className={`ml-1.5 text-xs ${filtro === f ? 'text-black/60' : 'text-zinc-600'}`}>{conteos[f]}</span>
          </button>
        ))}
        {visibles.length > 0 && (
          <button onClick={() => setShowDcto(!showDcto)}
            className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-xl hover:bg-zinc-700 hover:text-white transition-colors whitespace-nowrap">
            🎁 Cargar descuento
          </button>
        )}
      </div>

      {showDcto && (
        <div className="mb-4 bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-3">
          <p className="text-white text-sm font-medium">
            Cargar descuento a{' '}
            <span className="text-yellow-400">{visibles.length} cliente{visibles.length !== 1 ? 's' : ''}</span>
            {filtro !== 'todos' && <span className="text-zinc-400"> ({SEGMENTO_LABEL[filtro as Segmento]}s)</span>}
          </p>
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="text-zinc-500 text-xs block mb-1">Descuento %</label>
              <input type="number" min={1} max={100} value={dctoPct}
                onChange={e => setDctoPct(Number(e.target.value))}
                className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-yellow-400" />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="text-zinc-500 text-xs block mb-1">Motivo (opcional)</label>
              <input value={dctoMotivo} onChange={e => setDctoMotivo(e.target.value)}
                placeholder={`Descuento ${filtro === 'todos' ? 'general' : filtro}`}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-yellow-400" />
            </div>
            <button onClick={aplicarDescuento} disabled={dctoLoading}
              className="px-4 py-2 bg-yellow-400 text-black text-sm font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors">
              {dctoLoading ? 'Enviando…' : 'Aplicar y notificar'}
            </button>
            <button onClick={() => setShowDcto(false)}
              className="px-3 py-2 bg-zinc-800 text-zinc-400 text-sm rounded-lg hover:text-white">
              Cancelar
            </button>
          </div>
          <div>
            <label className="text-zinc-500 text-xs block mb-1">Mensaje para el email (opcional — si lo dejas en blanco, la IA genera uno)</label>
            <textarea
              value={dctoMensaje}
              onChange={e => setDctoMensaje(e.target.value)}
              rows={2}
              placeholder="Ej: Celebramos tu fidelidad con este descuento especial. ¡Nos vemos pronto!"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-yellow-400 resize-none"
            />
          </div>
          <p className="text-zinc-600 text-xs">El descuento se aplica automáticamente en la próxima reserva de cada cliente y se les notifica por email.</p>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800">
            <tr>
              <th className="text-left p-3 text-zinc-400 font-medium">Cliente</th>
              <th className="text-left p-3 text-zinc-400 font-medium hidden lg:table-cell">Teléfono</th>
              <th className="text-left p-3 text-zinc-400 font-medium hidden xl:table-cell">Cód. referido</th>
              <th className="text-left p-3 text-zinc-400 font-medium hidden md:table-cell">Visitas</th>
              <th className="text-left p-3 text-zinc-400 font-medium hidden md:table-cell">Gasto</th>
              <th className="text-left p-3 text-zinc-400 font-medium hidden sm:table-cell">Última visita</th>
              <th className="text-left p-3 text-zinc-400 font-medium">Segmento</th>
              {alianzasDisponibles.length > 0 && (
                <th className="text-left p-3 text-zinc-400 font-medium">Alianza</th>
              )}
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
                <td className="p-3 text-zinc-400 text-xs hidden lg:table-cell">
                  {c.telefono || <span className="text-zinc-700">—</span>}
                </td>
                <td className="p-3 hidden xl:table-cell">
                  {c.referralCode
                    ? <span className="font-mono text-xs bg-zinc-800 text-yellow-400 px-2 py-0.5 rounded">{c.referralCode}</span>
                    : <span className="text-zinc-700 text-xs">—</span>
                  }
                </td>
                <td className="p-3 text-zinc-300 hidden md:table-cell">
                  {c.visitasCompletadas}
                  {c.totalVisitas > c.visitasCompletadas && (
                    <span className="text-zinc-600 text-xs"> (+{c.totalVisitas - c.visitasCompletadas})</span>
                  )}
                </td>
                <td className="p-3 text-yellow-400 font-medium hidden md:table-cell">
                  ${Math.round(c.gastoTotal / 1000)}k
                </td>
                <td className="p-3 text-zinc-400 hidden sm:table-cell">
                  {c.ultimaVisita ? new Date(c.ultimaVisita).toLocaleDateString('es-CL') : '—'}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEGMENTO_COLOR[c.segmento]}`}>
                    {SEGMENTO_LABEL[c.segmento]}
                  </span>
                </td>
                {alianzasDisponibles.length > 0 && (
                  <td className="p-3">
                    <AlianzaCell cliente={c} alianzas={alianzasDisponibles} slug={slug} />
                  </td>
                )}
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
