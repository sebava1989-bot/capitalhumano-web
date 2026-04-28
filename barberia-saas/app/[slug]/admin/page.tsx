import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StatsCards } from '@/components/admin/StatsCards'
import { AgendaCalendar } from '@/components/admin/AgendaCalendar'
import { TopServicios } from '@/components/admin/TopServicios'
import { TopClientes } from '@/components/admin/TopClientes'
import { startOfDay, endOfDay, startOfMonth } from 'date-fns'

export default async function AdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id, nombre').eq('slug', slug).maybeSingle()
  if (!barberia) notFound()

  const today = new Date()
  const [{ data: citasHoy }, { data: citasMes }, { data: canceladas }] = await Promise.all([
    supabase.from('reservas').select('id, precio_final')
      .eq('barberia_id', barberia.id).eq('estado', 'confirmada')
      .gte('fecha_hora', startOfDay(today).toISOString())
      .lte('fecha_hora', endOfDay(today).toISOString()),
    supabase.from('reservas').select('precio_final, servicio_id, cliente_id, cliente_nombre, servicios(nombre)')
      .eq('barberia_id', barberia.id).eq('estado', 'completada')
      .gte('fecha_hora', startOfMonth(today).toISOString()),
    supabase.from('reservas').select('id')
      .eq('barberia_id', barberia.id).eq('estado', 'cancelada')
      .gte('fecha_hora', startOfDay(today).toISOString()),
  ])

  const ingresosMes = citasMes?.reduce((s, r) => s + (r.precio_final ?? 0), 0) ?? 0

  const serviciosMap = new Map<string, { nombre: string; count: number; total: number }>()
  for (const r of citasMes ?? []) {
    const nombre = (r.servicios as { nombre: string } | null)?.nombre ?? 'Sin nombre'
    const key = r.servicio_id as string
    const prev = serviciosMap.get(key) ?? { nombre, count: 0, total: 0 }
    serviciosMap.set(key, { nombre, count: prev.count + 1, total: prev.total + (r.precio_final ?? 0) })
  }
  const topServicios = [...serviciosMap.values()].sort((a, b) => b.count - a.count).slice(0, 5)

  const clientesMap = new Map<string, { nombre: string; count: number; total: number }>()
  for (const r of citasMes ?? []) {
    const nombre = (r.cliente_nombre as string | null) ?? 'Anónimo'
    const key = r.cliente_id as string
    const prev = clientesMap.get(key) ?? { nombre, count: 0, total: 0 }
    clientesMap.set(key, { nombre, count: prev.count + 1, total: prev.total + (r.precio_final ?? 0) })
  }
  const topClientes = [...clientesMap.values()].sort((a, b) => b.count - a.count).slice(0, 5)

  const stats = [
    { label: 'Citas hoy', value: String(citasHoy?.length ?? 0), color: 'text-blue-400' },
    { label: 'Ingresos mes', value: `$${Math.round(ingresosMes / 1000)}k`, color: 'text-green-400' },
    { label: 'Canceladas hoy', value: String(canceladas?.length ?? 0), color: 'text-red-400' },
    { label: 'Completadas mes', value: String(citasMes?.length ?? 0), color: 'text-yellow-400' },
  ]

  const { data: agendaHoy } = await supabase
    .from('reservas')
    .select('id, fecha_hora, estado, cliente_nombre, servicios(nombre), barberos(nombre)')
    .eq('barberia_id', barberia.id)
    .in('estado', ['confirmada', 'completada'])
    .gte('fecha_hora', startOfDay(today).toISOString())
    .lte('fecha_hora', endOfDay(today).toISOString())
    .order('fecha_hora')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{barberia.nombre}</h1>
      <StatsCards stats={stats} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopServicios items={topServicios} />
        <TopClientes items={topClientes} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Agenda de hoy</h2>
        <AgendaCalendar items={agendaHoy ?? []} />
      </div>
    </div>
  )
}
