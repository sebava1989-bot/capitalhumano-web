'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { crearAlianza, toggleAlianza, eliminarAlianza } from './actions'
import { toast } from 'sonner'

interface Alianza {
  id: string; nombre: string; descripcion: string | null; tipo: string
  beneficio: string | null; activo: boolean
  descuento_pct: number | null; dias_semana: number[] | null
  servicio_ids: string[] | null; requiere_codigo: boolean; codigo_acceso: string | null
}

interface Servicio { id: string; nombre: string }

const TIPO_LABEL: Record<string, string> = {
  partner: '🤝 Partner', proveedor: '📦 Proveedor', institucional: '🏛️ Institucional',
}

const DIAS_LABEL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function AlianzasPage() {
  const params = useParams()
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug ?? '')
  const [alianzas, setAlianzas] = useState<Alianza[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [requiereCodigo, setRequiereCodigo] = useState(false)
  const supabase = createClient()

  async function load() {
    const { data: barberia } = await supabase
      .from('barberias').select('id').eq('slug', slug).maybeSingle()
    if (!barberia) return
    const [{ data: alianzasData }, { data: serviciosData }] = await Promise.all([
      supabase.from('alianzas').select('*').eq('barberia_id', barberia.id).order('created_at', { ascending: false }),
      supabase.from('servicios').select('id, nombre').eq('barberia_id', barberia.id).eq('activo', true),
    ])
    setAlianzas(alianzasData ?? [])
    setServicios(serviciosData ?? [])
  }

  useEffect(() => { load() }, [slug])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('slug', slug)
    fd.set('requiere_codigo', requiereCodigo ? 'true' : 'false')
    const result = await crearAlianza(fd)
    setLoading(false)
    if (result && 'error' in result) { toast.error(result.error); return }
    toast.success('Alianza creada')
    setShowForm(false)
    setRequiereCodigo(false)
    await load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Alianzas</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-yellow-400 text-black font-bold text-sm rounded-xl hover:bg-yellow-300 transition-colors">
          + Nueva alianza
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-1">Nombre</label>
              <input name="nombre" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-1">Tipo</label>
              <select name="tipo" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm">
                <option value="partner">Partner</option>
                <option value="institucional">Institucional</option>
                <option value="proveedor">Proveedor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-1">Descripción</label>
            <input name="descripcion" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
          </div>

          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-1">Texto del beneficio (visible para clientes)</label>
            <input name="beneficio" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Ej: 15% dcto en corte los martes" />
          </div>

          {/* Descuento */}
          <div className="border border-zinc-700 rounded-xl p-3 space-y-3">
            <p className="text-zinc-300 text-sm font-medium">Descuento automático</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-1">Descuento %</label>
                <input name="descuento_pct" type="number" min="1" max="100"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="Ej: 15" />
              </div>
              <div className="flex items-end">
                <p className="text-zinc-500 text-xs">Dejar vacío = sin descuento automático</p>
              </div>
            </div>

            {/* Días de semana */}
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-2">Válido los días (vacío = todos)</label>
              <div className="flex gap-2 flex-wrap">
                {DIAS_LABEL.map((d, i) => (
                  <label key={i} className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" name="dias_semana" value={i}
                      className="w-4 h-4 rounded accent-yellow-400" />
                    <span className="text-zinc-300 text-sm">{d}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Servicios */}
            {servicios.length > 0 && (
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-2">Aplica solo a (vacío = todos los servicios)</label>
                <div className="flex gap-2 flex-wrap">
                  {servicios.map(s => (
                    <label key={s.id} className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" name="servicio_ids" value={s.id}
                        className="w-4 h-4 rounded accent-yellow-400" />
                      <span className="text-zinc-300 text-sm">{s.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Requiere código */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setRequiereCodigo(!requiereCodigo)}
                className={`w-10 h-6 rounded-full transition-colors ${requiereCodigo ? 'bg-yellow-400' : 'bg-zinc-700'}`}>
                <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${requiereCodigo ? 'translate-x-4' : ''}`} />
              </button>
              <span className="text-zinc-300 text-sm">Requiere código de acceso</span>
            </div>

            {requiereCodigo && (
              <div>
                <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-1">Código de acceso</label>
                <input name="codigo_acceso" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="Ej: CORP2026" />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-yellow-400 text-black text-sm font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-50">
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setRequiereCodigo(false) }}
              className="px-4 py-2 bg-zinc-800 text-zinc-400 text-sm rounded-lg hover:text-white">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {alianzas.map(a => (
          <div key={a.id} className={`bg-zinc-900 border rounded-xl p-4 ${a.activo ? 'border-zinc-800' : 'border-zinc-800/40 opacity-60'}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center text-lg flex-shrink-0">🤝</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium">{a.nombre}</p>
                  <span className="text-xs text-zinc-500">{TIPO_LABEL[a.tipo] ?? a.tipo}</span>
                  {a.descuento_pct && (
                    <span className="bg-yellow-400/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full font-medium">
                      -{a.descuento_pct}%
                    </span>
                  )}
                  {a.requiere_codigo && (
                    <span className="bg-zinc-700 text-zinc-300 text-xs px-2 py-0.5 rounded-full">
                      🔑 {a.codigo_acceso}
                    </span>
                  )}
                </div>
                {a.descripcion && <p className="text-zinc-400 text-xs mt-0.5">{a.descripcion}</p>}
                {a.beneficio && <p className="text-yellow-400 text-xs mt-0.5">{a.beneficio}</p>}
                {a.dias_semana && a.dias_semana.length > 0 && (
                  <p className="text-zinc-500 text-xs mt-1">
                    Solo {a.dias_semana.map(d => DIAS_LABEL[d]).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => toggleAlianza(a.id, !a.activo, slug).then(() =>
                  setAlianzas(prev => prev.map(x => x.id === a.id ? { ...x, activo: !a.activo } : x))
                )} className="text-xs text-zinc-500 hover:text-white">
                  {a.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => eliminarAlianza(a.id, slug).then(() =>
                  setAlianzas(prev => prev.filter(x => x.id !== a.id))
                )} className="text-xs text-zinc-500 hover:text-red-400">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
        {!alianzas.length && <p className="text-zinc-500 text-sm text-center py-10">No hay alianzas registradas</p>}
      </div>
    </div>
  )
}
