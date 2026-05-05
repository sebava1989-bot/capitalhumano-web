'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  barberiaId: string
  slug: string
  pctReferidor: number
  pctNuevoCliente: number
  acumulable: boolean
  maxPct: number
}

export function ReferidoConfig({ barberiaId, slug, pctReferidor, pctNuevoCliente, acumulable, maxPct }: Props) {
  const [referidor, setReferidor] = useState(pctReferidor)
  const [nuevoCliente, setNuevoCliente] = useState(pctNuevoCliente)
  const [esAcumulable, setEsAcumulable] = useState(acumulable)
  const [max, setMax] = useState(maxPct)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function guardar() {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('barberias')
      .update({
        referido_descuento_pct: referidor,
        referido_descuento_nuevo_cliente_pct: nuevoCliente,
        referido_acumulable: esAcumulable,
        referido_max_pct_por_servicio: max,
      })
      .eq('id', barberiaId)
    setLoading(false)
    if (error) { toast.error('No se pudo guardar'); return }
    toast.success('Configuración de referidos guardada')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-2">
      <p className="text-gray-900 font-semibold mb-1">Campaña de referidos</p>
      <p className="text-gray-500 text-xs mb-4">
        Configura los descuentos que se aplican cuando un cliente refiere a alguien nuevo
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Descuento al referidor */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Descuento al referidor
          </label>
          <p className="text-xs text-gray-400 mb-2">
            La persona que refirió recibe este % en su próximo corte
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} max={100} value={referidor}
              onChange={e => setReferidor(Number(e.target.value))}
              className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm
                text-center focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            />
            <span className="text-gray-500 text-sm">%</span>
          </div>
        </div>

        {/* Descuento al nuevo cliente */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Descuento al nuevo cliente
          </label>
          <p className="text-xs text-gray-400 mb-2">
            El cliente referido recibe este % en su primer corte
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} max={100} value={nuevoCliente}
              onChange={e => setNuevoCliente(Number(e.target.value))}
              className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm
                text-center focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            />
            <span className="text-gray-500 text-sm">%</span>
          </div>
        </div>

        {/* Descuento acumulable */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Descuento acumulable
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Si tiene varios referidos, ¿se suman los descuentos en un solo corte?
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEsAcumulable(true)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${esAcumulable
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
            >
              Sí, acumular
            </button>
            <button
              type="button"
              onClick={() => setEsAcumulable(false)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${!esAcumulable
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
            >
              No, dividir
            </button>
          </div>
        </div>

        {/* Máximo por servicio */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Descuento máximo por corte
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Límite máximo del descuento aplicable en un solo servicio
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} max={100} value={max}
              onChange={e => setMax(Number(e.target.value))}
              className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm
                text-center focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
            />
            <span className="text-gray-500 text-sm">%</span>
          </div>
        </div>
      </div>

      <button onClick={guardar} disabled={loading}
        className="px-5 py-2 bg-yellow-400 text-black text-sm font-bold rounded-xl
          hover:bg-yellow-300 disabled:opacity-50 transition-colors shadow-sm">
        {loading ? 'Guardando…' : 'Guardar configuración'}
      </button>
    </div>
  )
}
