'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  barberiaId: string
  pctActual: number
  slug: string
}

export function ReferidoConfig({ barberiaId, pctActual, slug }: Props) {
  const [pct, setPct] = useState(pctActual)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function guardar() {
    if (pct < 1 || pct > 100) return
    setLoading(true)
    const { error } = await supabase
      .from('barberias')
      .update({ referido_descuento_pct: pct })
      .eq('id', barberiaId)
    setLoading(false)
    if (error) { toast.error('No se pudo guardar'); return }
    toast.success(`Campaña de referidos: ${pct}% guardado`)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-2">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-white font-medium">Campaña de referidos</p>
          <p className="text-zinc-500 text-xs mt-0.5">
            Descuento que recibe el referidor cuando su amigo completa su primera cita
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number" min={1} max={100} value={pct}
            onChange={e => setPct(Number(e.target.value))}
            className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-yellow-400"
          />
          <span className="text-zinc-400 text-sm">%</span>
          <button onClick={guardar} disabled={loading}
            className="px-4 py-2 bg-yellow-400 text-black text-sm font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors">
            {loading ? '…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
