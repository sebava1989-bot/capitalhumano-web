import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { StatsCards } from '@/components/admin/StatsCards'
import { TopServicios } from '@/components/admin/TopServicios'
import { TopClientes } from '@/components/admin/TopClientes'
import { WspInviteButton } from '@/components/admin/WspInviteButton'
import { ReasignarBarberoButton } from '@/components/admin/ReasignarBarberoButton'
import { RealtimeAdminRefresh } from '@/components/admin/RealtimeAdminRefresh'
import { AdminActionButton } from '@/components/admin/AdminActionButton'
import { startOfDay, endOfDay, startOfMonth, startOfWeek, endOfWeek, format, isSameDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { es } from 'date-fns/locale'

const TZ = 'America/Santiago'

// Devuelve la fecha actual en zona horaria chilena
function todayChile() { return toZonedTime(new Date(), TZ) }

// Convierte inicio/fin de día en Santiago a UTC para queries Supabase
function startOfDayUTC(d: Date) { return fromZonedTime(startOfDay(toZonedTime(d, TZ)), TZ).toISOString() }
function endOfDayUTC(d: Date)   { return fromZonedTime(endOfDay(toZonedTime(d, TZ)), TZ).toISOString() }
import { Suspense } from 'react'
import { PrediccionDemanda } from './prediccion'

async function iniciarCita(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const reservaId = formData.get('reservaId') as string
  const slug = formData.get('slug') as string
  if (!reservaId || !slug) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('reservas').update({ estado: 'en_curso' }).eq('id', reservaId).eq('estado', 'confirmada')
  revalidatePath(`/${slug}/admin`)
}

async function noAsisteCita(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const reservaId = formData.get('reservaId') as string
  const slug = formData.get('slug') as string
  if (!reservaId || !slug) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', reservaId)
    .in('estado', ['confirmada', 'en_curso'])
  revalidatePath(`/${slug}/admin`)
}

async function reasignarBarbero(reservaId: string, nuevoBarberoId: string) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const admin = createAdminClient()
  const { data: reserva } = await supabase.from('reservas').select('barberia_id').eq('id', reservaId).maybeSingle()
  if (!reserva) return
  // Verificar que el nuevo barbero pertenece a esta barbería
  const { data: barbero } = await admin.from('barberos').select('id')
    .eq('id', nuevoBarberoId).eq('barberia_id', reserva.barberia_id).maybeSingle()
  if (!barbero) return
  await admin.from('reservas').update({ barbero_id: nuevoBarberoId }).eq('id', reservaId)
  revalidatePath('/', 'layout')
}

async function terminarCita(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const reservaId = formData.get('reservaId') as string
  const slug = formData.get('slug') as string
  if (!reservaId || !slug) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: reserva } = await supabase
    .from('reservas')
    .select('id, cliente_id, barberia_id, estado')
    .eq('id', reservaId)
    .maybeSingle()

  if (!reserva || reserva.estado === 'completada') return

  // Obtener ref_code por separado (no está en el tipo generado)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservaRef } = await (supabase as any)
    .from('reservas').select('ref_code').eq('id', reservaId).maybeSingle()

  // Solo marcar como completada — recién aquí se suma al ingreso
  await supabase.from('reservas').update({ estado: 'completada' }).eq('id', reservaId)

  // Verificar si el cliente fue referido usando ref_code de la reserva
  if (reserva.cliente_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const referredByCode = (reservaRef as any)?.ref_code as string | null
    if (referredByCode) {
      const { count } = await supabase
        .from('reservas')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', reserva.cliente_id)
        .eq('barberia_id', reserva.barberia_id)
        .eq('estado', 'completada')

      if ((count ?? 0) === 1) {
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

  const { data: barberosData } = await supabase
    .from('barberos').select('id, nombre').eq('barberia_id', barberia.id).eq('activo', true).order('nombre')
  const barberosList = (barberosData ?? []) as { id: string; nombre: string }[]

  const today = todayChile()
  const todayStartISO = startOfDayUTC(today)
  const todayEndISO = endOfDayUTC(today)
  const mesStartISO = fromZonedTime(startOfMonth(today), TZ).toISOString()

  const [{ data: citasHoy }, { data: citasMes }, { data: canceladas }] = await Promise.all([
    supabase.from('reservas').select('id, precio_final')
      .eq('barberia_id', barberia.id).eq('estado', 'confirmada')
      .gte('fecha_hora', todayStartISO)
      .lte('fecha_hora', todayEndISO),
    supabase.from('reservas').select('precio_final, servicio_id, cliente_id, cliente_nombre, servicios(nombre)')
      .eq('barberia_id', barberia.id).eq('estado', 'completada')
      .gte('fecha_hora', mesStartISO),
    supabase.from('reservas').select('id')
      .eq('barberia_id', barberia.id).eq('estado', 'cancelada')
      .gte('fecha_hora', todayStartISO),
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

  const { data: citasHoyDetalle } = await supabase
    .from('reservas')
    .select('id, fecha_hora, estado, barbero_id, cliente_nombre, precio, descuento, precio_final, servicios(nombre), barberos(nombre)')
    .eq('barberia_id', barberia.id)
    .in('estado', ['confirmada', 'en_curso', 'completada', 'pendiente', 'cancelada'])
    .gte('fecha_hora', todayStartISO)
    .lte('fecha_hora', todayEndISO)
    .order('fecha_hora')

  const semanaStart = fromZonedTime(startOfWeek(today, { weekStartsOn: 1 }), TZ)
  const semanaEnd = fromZonedTime(endOfWeek(today, { weekStartsOn: 1 }), TZ)

  const { data: agendaSemana } = await supabase
    .from('reservas')
    .select('id, fecha_hora, estado, barbero_id, cliente_nombre, precio, descuento, precio_final, servicios(nombre), barberos(nombre)')
    .eq('barberia_id', barberia.id)
    .in('estado', ['confirmada', 'en_curso', 'completada', 'pendiente', 'cancelada'])
    .gte('fecha_hora', semanaStart.toISOString())
    .lte('fecha_hora', semanaEnd.toISOString())
    .order('fecha_hora')

  type AgendaItem = { id: string; fecha_hora: string; estado: string; barbero_id: string | null; cliente_nombre: string | null; precio: number; descuento: number; precio_final: number; servicios: unknown; barberos: unknown }
  const citasHoyList = (citasHoyDetalle ?? []) as AgendaItem[]

  // Agrupar agenda por día en hora chilena
  const porDia = new Map<string, AgendaItem[]>()
  for (const r of (agendaSemana ?? []) as AgendaItem[]) {
    const key = format(toZonedTime(new Date(r.fecha_hora), TZ), 'yyyy-MM-dd')
    if (!porDia.has(key)) porDia.set(key, [])
    porDia.get(key)!.push(r)
  }

  return (
    <div>
      <RealtimeAdminRefresh barberiaId={barberia.id} />
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">{barberia.nombre}</h1>
        <WspInviteButton slug={slug} barberiaNombre={barberia.nombre} />
      </div>

      <StatsCards stats={stats} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopServicios items={topServicios} />
        <TopClientes items={topClientes} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-3">Citas de hoy</h2>
        {citasHoyList.length === 0 ? (
          <p className="text-zinc-500 text-sm">No hay citas para hoy</p>
        ) : (
          <div className="space-y-2">
            {citasHoyList.map(r => (
              <div key={r.id}
                className={`flex items-center gap-3 rounded-xl p-3 shadow-[0_2px_12px_rgba(0,0,0,0.3)] border
                  ${r.estado === 'en_curso'
                    ? 'bg-gradient-to-r from-blue-950/60 to-zinc-900/80 border-blue-500/40'
                    : r.estado === 'cancelada'
                    ? 'bg-gradient-to-r from-red-950/30 to-zinc-900/60 border-red-900/40 opacity-60'
                    : 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 border-zinc-700/60'}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0
                  ${r.estado === 'completada' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]'
                    : r.estado === 'en_curso' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]'
                    : r.estado === 'cancelada' ? 'bg-red-500'
                    : r.estado === 'pendiente' ? 'bg-zinc-500'
                    : 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]'}`} />
                <span className="text-white font-mono text-sm w-12 flex-shrink-0">
                  {format(toZonedTime(new Date(r.fecha_hora), TZ), 'HH:mm')}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-white font-medium truncate block">{r.cliente_nombre ?? 'Sin nombre'}</span>
                  <span className="text-zinc-400 text-xs truncate block">
                    {(r.servicios as unknown as { nombre: string })?.nombre}
                    {' · '}{(r.barberos as unknown as { nombre: string })?.nombre}
                  </span>
                </div>
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
                {r.estado === 'confirmada' && (
                  <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    <form action={iniciarCita}>
                      <input type="hidden" name="reservaId" value={r.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <AdminActionButton pendingText="..." className="text-xs px-3 py-1.5 rounded-lg font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30 whitespace-nowrap">
                        ▶ Comenzar
                      </AdminActionButton>
                    </form>
                    <ReasignarBarberoButton
                      reservaId={r.id}
                      barberoActualId={r.barbero_id}
                      barberos={barberosList}
                      reasignarAction={reasignarBarbero}
                    />
                    <form action={noAsisteCita}>
                      <input type="hidden" name="reservaId" value={r.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <AdminActionButton pendingText="..." className="text-xs px-3 py-1.5 rounded-lg font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 whitespace-nowrap">
                        ✕ No asiste
                      </AdminActionButton>
                    </form>
                  </div>
                )}
                {r.estado === 'en_curso' && (
                  <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    <form action={terminarCita}>
                      <input type="hidden" name="reservaId" value={r.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <AdminActionButton pendingText="..." className="text-xs px-3 py-1.5 rounded-lg font-bold bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 whitespace-nowrap">
                        ✓ Terminar
                      </AdminActionButton>
                    </form>
                    <ReasignarBarberoButton
                      reservaId={r.id}
                      barberoActualId={r.barbero_id}
                      barberos={barberosList}
                      reasignarAction={reasignarBarbero}
                    />
                    <form action={noAsisteCita}>
                      <input type="hidden" name="reservaId" value={r.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <AdminActionButton pendingText="..." className="text-xs px-3 py-1.5 rounded-lg font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 whitespace-nowrap">
                        ✕ No asiste
                      </AdminActionButton>
                    </form>
                  </div>
                )}
                {r.estado === 'completada' && (
                  <span className="text-xs px-3 py-1.5 rounded-lg font-medium
                    bg-green-500/10 text-green-500 border border-green-500/20 flex-shrink-0">
                    ✓ Listo
                  </span>
                )}
                {r.estado === 'pendiente' && (
                  <span className="text-xs px-3 py-1.5 rounded-lg font-medium
                    bg-zinc-700/50 text-zinc-500 border border-zinc-700/50 flex-shrink-0">
                    Pendiente
                  </span>
                )}
                {r.estado === 'cancelada' && (
                  <span className="text-xs px-3 py-1.5 rounded-lg font-medium
                    bg-red-500/10 text-red-400 border border-red-500/20 flex-shrink-0">
                    Cancelada
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
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
          {[...porDia.entries()].filter(([dia]) => {
            const fecha = new Date(dia + 'T12:00:00')
            return !isSameDay(fecha, today)
          }).map(([dia, citas]) => {
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
                          : r.estado === 'en_curso' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]'
                          : r.estado === 'cancelada' ? 'bg-red-500'
                          : r.estado === 'pendiente' ? 'bg-zinc-500'
                          : 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]'}`} />
                      <span className="text-white font-mono text-sm w-12 flex-shrink-0">
                        {format(toZonedTime(new Date(r.fecha_hora), TZ), 'HH:mm')}
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
                      {r.estado === 'confirmada' && (
                        <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                          <form action={iniciarCita}>
                            <input type="hidden" name="reservaId" value={r.id} />
                            <input type="hidden" name="slug" value={slug} />
                            <AdminActionButton pendingText="..." className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 whitespace-nowrap">
                              ▶ Comenzar
                            </AdminActionButton>
                          </form>
                          <ReasignarBarberoButton
                            reservaId={r.id}
                            barberoActualId={r.barbero_id}
                            barberos={barberosList}
                            reasignarAction={reasignarBarbero}
                          />
                          <form action={noAsisteCita}>
                            <input type="hidden" name="reservaId" value={r.id} />
                            <input type="hidden" name="slug" value={slug} />
                            <AdminActionButton pendingText="..." className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 whitespace-nowrap">
                              ✕ No asiste
                            </AdminActionButton>
                          </form>
                        </div>
                      )}
                      {r.estado === 'en_curso' && (
                        <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                          <form action={terminarCita}>
                            <input type="hidden" name="reservaId" value={r.id} />
                            <input type="hidden" name="slug" value={slug} />
                            <AdminActionButton pendingText="..." className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 whitespace-nowrap">
                              ✓ Terminar
                            </AdminActionButton>
                          </form>
                          <ReasignarBarberoButton
                            reservaId={r.id}
                            barberoActualId={r.barbero_id}
                            barberos={barberosList}
                            reasignarAction={reasignarBarbero}
                          />
                          <form action={noAsisteCita}>
                            <input type="hidden" name="reservaId" value={r.id} />
                            <input type="hidden" name="slug" value={slug} />
                            <AdminActionButton pendingText="..." className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 whitespace-nowrap">
                              ✕ No asiste
                            </AdminActionButton>
                          </form>
                        </div>
                      )}
                      {r.estado === 'completada' && (
                        <span className="text-xs px-3 py-1.5 rounded-lg font-medium
                          bg-green-500/10 text-green-500 border border-green-500/20 flex-shrink-0">
                          ✓ Listo
                        </span>
                      )}
                      {r.estado === 'pendiente' && (
                        <span className="text-xs px-3 py-1.5 rounded-lg font-medium
                          bg-zinc-700/50 text-zinc-500 border border-zinc-700/50 flex-shrink-0">
                          Pendiente
                        </span>
                      )}
                      {r.estado === 'cancelada' && (
                        <span className="text-xs px-3 py-1.5 rounded-lg font-medium
                          bg-red-500/10 text-red-400 border border-red-500/20 flex-shrink-0">
                          Cancelada
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
