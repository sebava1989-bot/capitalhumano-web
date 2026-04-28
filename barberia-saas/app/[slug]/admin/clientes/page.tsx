import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClientesSegmentados } from '@/components/admin/ClientesSegmentados'
import type { ClienteSegmentado, Segmento } from '@/components/admin/ClientesSegmentados'

export default async function ClientesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).maybeSingle()
  if (!barberia) notFound()

  const { data: reservas } = await supabase
    .from('reservas')
    .select('cliente_id, cliente_nombre, cliente_email, fecha_hora, estado, precio_final')
    .eq('barberia_id', barberia.id)
    .in('estado', ['completada', 'confirmada'])
    .order('fecha_hora', { ascending: false })

  const ahora = Date.now()
  const hace30 = ahora - 30 * 24 * 60 * 60 * 1000
  const hace60 = ahora - 60 * 24 * 60 * 60 * 1000

  type ClienteAcc = {
    id: string
    nombre: string
    email: string
    totalVisitas: number
    visitasCompletadas: number
    gastoTotal: number
    ultimaVisita: number
    primerVisita: number
  }

  const mapa = new Map<string, ClienteAcc>()
  for (const r of reservas ?? []) {
    const id = r.cliente_id as string
    const ts = new Date(r.fecha_hora as string).getTime()
    const prev = mapa.get(id)
    if (!prev) {
      mapa.set(id, {
        id,
        nombre: (r.cliente_nombre as string | null) ?? 'Sin nombre',
        email: (r.cliente_email as string | null) ?? '',
        totalVisitas: 1,
        visitasCompletadas: r.estado === 'completada' ? 1 : 0,
        gastoTotal: r.estado === 'completada' ? (r.precio_final as number ?? 0) : 0,
        ultimaVisita: ts,
        primerVisita: ts,
      })
    } else {
      prev.totalVisitas++
      if (r.estado === 'completada') {
        prev.visitasCompletadas++
        prev.gastoTotal += (r.precio_final as number ?? 0)
      }
      if (ts > prev.ultimaVisita) prev.ultimaVisita = ts
      if (ts < prev.primerVisita) prev.primerVisita = ts
    }
  }

  function getSegmento(c: ClienteAcc): Segmento {
    if (c.primerVisita >= hace30) return 'nuevo'
    if (c.ultimaVisita < hace60) return 'inactivo'
    return 'frecuente'
  }

  const clientes: ClienteSegmentado[] = [...mapa.values()]
    .sort((a, b) => b.ultimaVisita - a.ultimaVisita)
    .map(c => ({
      id: c.id,
      nombre: c.nombre,
      email: c.email,
      totalVisitas: c.totalVisitas,
      visitasCompletadas: c.visitasCompletadas,
      gastoTotal: c.gastoTotal,
      ultimaVisita: new Date(c.ultimaVisita).toISOString(),
      primerVisita: new Date(c.primerVisita).toISOString(),
      segmento: getSegmento(c),
    }))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>
      <ClientesSegmentados clientes={clientes} />
    </div>
  )
}
