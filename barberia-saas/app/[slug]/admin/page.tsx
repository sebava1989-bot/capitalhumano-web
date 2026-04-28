import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StatsCards } from '@/components/admin/StatsCards'
import { startOfDay, endOfDay, startOfMonth } from 'date-fns'

export default async function AdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id, nombre').eq('slug', slug).single()
  if (!barberia) notFound()

  const today = new Date()
  const [{ data: citasHoy }, { data: citasMes }, { data: canceladas }] = await Promise.all([
    supabase.from('reservas').select('id, precio_final')
      .eq('barberia_id', barberia.id).eq('estado', 'confirmada')
      .gte('fecha_hora', startOfDay(today).toISOString())
      .lte('fecha_hora', endOfDay(today).toISOString()),
    supabase.from('reservas').select('precio_final')
      .eq('barberia_id', barberia.id).eq('estado', 'completada')
      .gte('fecha_hora', startOfMonth(today).toISOString()),
    supabase.from('reservas').select('id')
      .eq('barberia_id', barberia.id).eq('estado', 'cancelada')
      .gte('fecha_hora', startOfDay(today).toISOString()),
  ])

  const ingresosMes = citasMes?.reduce((s, r) => s + (r.precio_final ?? 0), 0) ?? 0

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

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Agenda de hoy</h2>
        <div className="space-y-2">
          {agendaHoy?.map(r => (
            <div key={r.id} className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.estado === 'completada' ? 'bg-green-500' : 'bg-yellow-400'}`} />
              <span className="text-white font-mono text-sm w-12">
                {new Date(r.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-white flex-1">{r.cliente_nombre ?? 'Sin nombre'}</span>
              <span className="text-zinc-400 text-sm">{(r.servicios as unknown as { nombre: string })?.nombre}</span>
              <span className="text-zinc-500 text-sm">{(r.barberos as unknown as { nombre: string })?.nombre}</span>
            </div>
          ))}
          {!agendaHoy?.length && <p className="text-zinc-500 text-sm">No hay citas para hoy</p>}
        </div>
      </div>
    </div>
  )
}
