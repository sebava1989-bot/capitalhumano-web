'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { crearAlianza, toggleAlianza, eliminarAlianza } from './actions'
import { toast } from 'sonner'
import { useEffect } from 'react'

interface Alianza {
  id: string; nombre: string; descripcion: string | null; tipo: string
  beneficio: string | null; logo_url: string | null; activo: boolean
}

const TIPO_LABEL: Record<string, string> = {
  partner: '🤝 Partner', proveedor: '📦 Proveedor', institucional: '🏛️ Institucional',
}

export default function AlianzasPage() {
  const params = useParams()
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug ?? '')
  const [alianzas, setAlianzas] = useState<Alianza[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: barberia } = await supabase
        .from('barberias').select('id').eq('slug', slug).maybeSingle()
      if (!barberia) return
      const { data } = await supabase
        .from('alianzas').select('*').eq('barberia_id', barberia.id).order('created_at', { ascending: false })
      setAlianzas(data ?? [])
    }
    load()
  }, [slug])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    fd.set('slug', slug)
    const result = await crearAlianza(fd)
    setLoading(false)
    if (result && 'error' in result) { toast.error(result.error); return }
    toast.success('Alianza creada')
    setShowForm(false)
    // Reload
    const { data: barberia } = await supabase.from('barberias').select('id').eq('slug', slug).maybeSingle()
    if (barberia) {
      const { data } = await supabase.from('alianzas').select('*').eq('barberia_id', barberia.id).order('created_at', { ascending: false })
      setAlianzas(data ?? [])
    }
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
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 space-y-3">
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
            <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-1">Beneficio para clientes</label>
            <input name="beneficio" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Ej: 15% dcto en primera compra" />
          </div>
          <div>
            <label className="text-zinc-400 text-xs uppercase tracking-wide block mb-1">URL del logo</label>
            <input name="logo_url" type="url" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-yellow-400 text-black text-sm font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-50">
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-zinc-800 text-zinc-400 text-sm rounded-lg hover:text-white">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {alianzas.map(a => (
          <div key={a.id} className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 ${a.activo ? 'border-zinc-800' : 'border-zinc-800/40 opacity-60'}`}>
            {a.logo_url
              ? <img src={a.logo_url} alt={a.nombre} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              : <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center text-lg flex-shrink-0">🤝</div>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">{a.nombre}</p>
                <span className="text-xs text-zinc-500">{TIPO_LABEL[a.tipo] ?? a.tipo}</span>
              </div>
              {a.descripcion && <p className="text-zinc-400 text-xs truncate">{a.descripcion}</p>}
              {a.beneficio && <p className="text-yellow-400 text-xs">{a.beneficio}</p>}
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
        ))}
        {!alianzas.length && <p className="text-zinc-500 text-sm text-center py-10">No hay alianzas registradas</p>}
      </div>
    </div>
  )
}
