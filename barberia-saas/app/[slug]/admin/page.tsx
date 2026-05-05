import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { StatsCards } from '@/components/admin/StatsCards'
import { TopServicios } from '@/components/admin/TopServicios'
import { TopClientes } from '@/components/admin/TopClientes'
import { WspInviteButton } from '@/components/admin/WspInviteButton'
import { startOfDay, endOfDay, startOfMonth, startOfWeek, endOfWeek, format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Suspense } from 'react'
import { PrediccionDemanda } from './prediccion'

async function completarCita(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const reservaId = formData.get('reservaId') as string
  const slug = formData.get('slug') as string
  if (!reservaId || !slug) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Obtener datos de la reserva con el cliente
  const { data: reserva } = await supabase
    .from('reservas')
    .select('id, cliente_id, barberia_id, estado')
    .eq('id', reservaId)
    .maybeSingle()

  if (!reserva || reserva.estado === 'completada') return

  // Marcar como completada
  await supabase.from('reservas').update({ estado: 'completada' }).eq('id', reservaId)

  // Verificar si el cliente fue referido y si esta es su primera cita completada
  if (reserva.cliente_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clienteData } = await (supabase as any)
      .from('users')
      .select('referred_by_code')
      .eq('id', reserva.cliente_id)
      .maybeSingle()

    const referredByCode = clienteData?.referred_by_code
    if (referredByCode) {
      // Verificar que sea la PRIMERA cita completada de este cliente en esta barbería
      const { count } = await supabase
        .from('reservas')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', reserva.cliente_id)
        .eq('barberia_id', reserva.barberia_id)
        .eq('estado', 'completada')

      if ((count ?? 0) === 1) {
        // Es la primera → dar premio al referidor y descuento al nuevo cliente
        const { data: barberia } = await supabase
          .from('barberias')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .select('referido_descuento_pct, referido_descuento_nuevo_cliente_pct' as any)
          .eq('id', reserva.barberia_id)
          .maybeSingle()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: referidor } = await (supabase as any)
          .from('users')
          .select('id')
          .eq('referral_code', referredByCode)
          .maybeSingle()

        if (referidor && barberia) {
          const b = barberia as unknown as Record<string, number>
          // Premio al referidor
          const descReferidor = b.referido_descuento_pct ?? 10
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('referido_premios').insert({
            referidor_id: referidor.id,
            referido_id: reserva.cliente_id,
            barberia_id: reserva.barberia_id,
            descuento_pct: descReferidor,
            canjeado: false,
            confirmado: false,
          })

          // Descuento al nuevo cliente para su próxima cita
          const descNuevo = b.referido_descuento_nuevo_cliente_pct ?? 0
          if (descNuevo > 0) {
            await supabase.from('descuentos_masivos').insert({
              cliente_id: reserva.cliente_id,
              barberia_id: reserva.barberia_id,
              descuento_pct: descNuevo,
              motivo: 'Descuento por primera cita como cliente referido',
              canjeado: false,
            })
          }
        }
      }
    }
  }

  revalidatePath(`/${slug}/admin`)
}

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
    { label: 'Citas hoy', value: String(citasHoy?.length ?? 0), color: 'text-blue-600' },
    { label: 'Ingresos mes', value: `$${Math.round(ingresosMes / 1000)}k`, color: 'text-green-600' },
    { label: 'Canceladas hoy', value: String(canceladas?.length ?? 0), color: 'text-red-500' },
    { label: 'Completadas mes', value: String(citasMes?.length ?? 0), color: 'text-yellow-500' },
  ]

  const semanaStart = startOfWeek(today, { weekStartsOn: 1 })
  const semanaEnd = endOfWeek(today, { weekStartsOn: 1 })

  const { data: agendaSemana } = await supabase
    .from('reservas')
    .select('id, fecha_hora, estado, cliente_nombre, precio, descuento, precio_final, servicios(nombre), barberos(nombre)')
    .eq('barberia_id', barberia.id)
    .in('estado', ['confirmada', 'completada', 'pendiente'])
    .gte('fecha_hora', semanaStart.toISOString())
    .lte('fecha_hora', semanaEnd.toISOString())
    .order('fecha_hora')

  // Agrupar agenda por día
  type AgendaItem = { id: string; fecha_hora: string; estado: string; cliente_nombre: string | null; precio: number; descuento: number; precio_final: number; servicios: unknown; barberos: unknown }
  const porDia = new Map<string, AgendaItem[]>()
  for (const r of (agendaSemana ?? []) as AgendaItem[]) {
    const key = format(new Date(r.fecha_hora), 'yyyy-MM-dd')
    if (!porDia.has(key)) porDia.set(key, [])
    porDia.get(key)!.push(r)
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">{barberia.nombre}</h1>
        <WspInviteButton slug={slug} barberiaNombre={barberia.nombre} />
      </div>

      <StatsCards stats={stats} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopServicios items={topServicios} />
        <TopClientes items={topClientes} />
      </div>

      <div className="mt-4">
        <Suspense fallback={null}>
          <PrediccionDemanda barberiaId={barberia.id} />
        </Suspense>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Agenda de la semana</h2>

        {porDia.size === 0 && (
          <p className="text-zinc-500 text-sm">No hay citas esta semana</p>
        )}

        <div className="space-y-5">
          {[...porDia.entries()].map(([dia, citas]) => {
            const fecha = new Date(dia + 'T12:00:00')
            const esHoy = isSameDay(fecha, today)
            return (
              <div key={dia}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-sm font-semibold capitalize ${esHoy ? 'text-yellow-400' : 'text-zinc-400'}`}>
                    {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
                    {esHoy && <span className="ml-2 text-xs bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded-full">Hoy</span>}
                  </span>
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-zinc-600 text-xs">{citas.length} cita{citas.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {citas.map(r => (
                    <div key={r.id}
                      className="flex items-center gap-3 bg-gradient-to-r from-zinc-800/60 to-zinc-900/60
                        border border-zinc-700/50 rounded-xl p-3 transition-all duration-200
                        shadow-[0_2px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]
                        hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0
                        ${r.estado === 'completada' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]'
                          : r.estado === 'pendiente' ? 'bg-zinc-500'
                          : 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]'}`} />
                      <span className="text-white font-mono text-sm w-12 flex-shrink-0">
                        {new Date(r.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-white flex-1 font-medium truncate">{r.cliente_nombre ?? 'Sin nombre'}</span>
                      <span className="text-zinc-400 text-sm hidden sm:block truncate max-w-[120px]">
                        {(r.servicios as unknown as { nombre: string })?.nombre}
                      </span>
                      <span className="text-zinc-500 text-sm hidden md:block truncate max-w-[100px]">
                        {(r.barberos as unknown as { nombre: string })?.nombre}
                      </span>
                      <div className="flex flex-col items-end flex-shrink-0">
                        {r.descuento > 0 ? (
                          <>
                            <span className="text-zinc-500 text-xs line-through">${r.precio.toLocaleString('es-CL')}</span>
                            <span className="text-yellow-400 text-sm font-bold">${r.precio_final.toLocaleString('es-CL')}</span>
                          </>
                        ) : (
                          <span className="text-white text-sm font-bold">${r.precio_final.toLocaleString('es-CL')}</span>
                        )}
                      </div>
                      {r.estado === 'confirmada' ? (
                        <form action={completarCita}>
                          <input type="hidden" name="reservaId" value={r.id} />
                          <input type="hidden" name="slug" value={slug} />
                          <button type="submit"
                            className="text-xs px-3 py-1.5 rounded-lg font-medium
                              bg-green-500/10 text-green-400 border border-green-500/30
                              hover:bg-green-500/20 transition-colors whitespace-nowrap flex-shrink-0">
                            ✓ Completar
                          </button>
                        </form>
                      ) : r.estado === 'completada' ? (
                        <span className="text-xs px-3 py-1.5 rounded-lg font-medium
                          bg-zinc-700/50 text-zinc-500 border border-zinc-700/50 flex-shrink-0">
                          Completada
                        </span>
                      ) : (
                        <span className="text-xs px-3 py-1.5 rounded-lg font-medium
                          bg-zinc-700/50 text-zinc-500 border border-zinc-700/50 flex-shrink-0">
                          Pendiente
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
