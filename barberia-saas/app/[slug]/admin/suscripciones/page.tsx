import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

const ESTADO_COLOR: Record<string, string> = {
  activa: 'text-green-400',
  cancelada: 'text-red-400',
  vencida: 'text-zinc-500',
  pendiente: 'text-yellow-400',
}

export default async function SuscripcionesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).maybeSingle()
  if (!barberia) notFound()

  const { data: suscripciones } = await supabase
    .from('suscripciones')
    .select('id, cliente_nombre, cliente_email, plan, estado, precio, inicio_at, vence_at, flow_subscription_id')
    .eq('barberia_id', barberia.id)
    .order('created_at', { ascending: false })

  const activas = suscripciones?.filter(s => s.estado === 'activa').length ?? 0
  const mrr = suscripciones
    ?.filter(s => s.estado === 'activa')
    .reduce((sum, s) => sum + (s.precio ?? 0), 0) ?? 0

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Suscripciones</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Activas</p>
          <p className="text-2xl font-bold text-green-400">{activas}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">MRR</p>
          <p className="text-2xl font-bold text-yellow-400">${Math.round(mrr / 1000)}k</p>
        </div>
      </div>

      {!process.env.FLOW_API_KEY && (
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mb-6">
          <p className="text-yellow-400 text-sm font-medium">Configuración pendiente</p>
          <p className="text-zinc-400 text-xs mt-1">
            Agrega <code className="bg-zinc-800 px-1 rounded">FLOW_API_KEY</code> y{' '}
            <code className="bg-zinc-800 px-1 rounded">FLOW_SECRET_KEY</code> en Vercel para activar pagos.
          </p>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800">
            <tr>
              <th className="text-left p-3 text-zinc-400 font-medium">Cliente</th>
              <th className="text-left p-3 text-zinc-400 font-medium hidden sm:table-cell">Plan</th>
              <th className="text-left p-3 text-zinc-400 font-medium hidden md:table-cell">Vence</th>
              <th className="text-left p-3 text-zinc-400 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {suscripciones?.map(s => (
              <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="p-3">
                  <p className="text-white">{s.cliente_nombre ?? '—'}</p>
                  <p className="text-zinc-500 text-xs">{s.cliente_email}</p>
                </td>
                <td className="p-3 text-zinc-300 hidden sm:table-cell capitalize">
                  {s.plan} · ${(s.precio ?? 0).toLocaleString('es-CL')}
                </td>
                <td className="p-3 text-zinc-400 hidden md:table-cell">
                  {s.vence_at ? new Date(s.vence_at).toLocaleDateString('es-CL') : '—'}
                </td>
                <td className="p-3">
                  <span className={`text-xs font-medium ${ESTADO_COLOR[s.estado] ?? 'text-zinc-400'}`}>
                    {s.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!suscripciones?.length && (
          <p className="text-zinc-500 text-center py-10 text-sm">No hay suscripciones aún</p>
        )}
      </div>
    </div>
  )
}
