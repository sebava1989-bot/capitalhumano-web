import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, isSameDay, differenceInDays } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { es } from 'date-fns/locale'
import { MetaSemanal } from '@/components/admin/MetaSemanal'
import { MetaBarberoCell } from '@/components/admin/MetaBarberoCell'
import { Suspense } from 'react'
import { PrediccionDemanda } from '../prediccion'

const TZ = 'America/Santiago'

async function guardarMeta(barberiaId: string, meta: number) {
  'use server'
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('barberias').update({ meta_semanal: meta }).eq('id', barberiaId)
  revalidatePath('/', 'layout')
}

async function guardarMetaBarbero(barberoId: string, meta: number) {
  'use server'
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('barberos').update({ meta_semanal: meta }).eq('id', barberoId)
  revalidatePath('/', 'layout')
}

export default async function ResumenEjecutivoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barberia } = await (supabase as any)
    .from('barberias').select('id, nombre, meta_semanal').eq('slug', slug).maybeSingle()
  if (!barberia) notFound()

  const metaSemanal: number = (barberia as Record<string, number>).meta_semanal ?? 0

  const now = toZonedTime(new Date(), TZ)
  const semanaStart = fromZonedTime(startOfWeek(now, { weekStartsOn: 1 }), TZ)
  const semanaEnd   = fromZonedTime(endOfWeek(now,   { weekStartsOn: 1 }), TZ)
  const mesStart    = fromZonedTime(startOfMonth(now), TZ)
  const mesEnd      = fromZonedTime(endOfMonth(now),   TZ)

  const diasSemana = eachDayOfInterval({
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end:   endOfWeek(now,   { weekStartsOn: 1 }),
  })

  const [{ data: reservasSemana }, { data: reservasMes }, { data: barberos }] = await Promise.all([
    supabase.from('reservas')
      .select('precio_final, fecha_hora, barbero_id, barberos(nombre)')
      .eq('barberia_id', barberia.id)
      .eq('estado', 'completada')
      .gte('fecha_hora', semanaStart.toISOString())
      .lte('fecha_hora', semanaEnd.toISOString()),
    supabase.from('reservas')
      .select('precio_final, fecha_hora, barbero_id, barberos(nombre)')
      .eq('barberia_id', barberia.id)
      .eq('estado', 'completada')
      .gte('fecha_hora', mesStart.toISOString())
      .lte('fecha_hora', mesEnd.toISOString()),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('barberos')
      .select('id, nombre, meta_semanal')
      .eq('barberia_id', barberia.id)
      .eq('activo', true)
      .order('nombre'),
  ])

  type Reserva = { precio_final: number; fecha_hora: string; barbero_id: string | null; barberos: unknown }

  // Agrupar ingresos semanales por barbero y por día
  const semanaMap = new Map<string, { nombre: string; porDia: number[]; total: number; meta: number }>()
  for (const b of barberos ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    semanaMap.set(b.id, { nombre: b.nombre, porDia: Array(7).fill(0), total: 0, meta: (b as any).meta_semanal ?? 0 })
  }
  for (const r of (reservasSemana ?? []) as Reserva[]) {
    if (!r.barbero_id) continue
    const entry = semanaMap.get(r.barbero_id)
    if (!entry) continue
    const diaChile = toZonedTime(new Date(r.fecha_hora), TZ)
    const idx = diasSemana.findIndex(d => isSameDay(d, diaChile))
    if (idx !== -1) entry.porDia[idx] += r.precio_final ?? 0
    entry.total += r.precio_final ?? 0
  }

  // Agrupar ingresos mensuales por barbero
  const mesMap = new Map<string, { nombre: string; total: number; citas: number }>()
  for (const b of barberos ?? []) {
    mesMap.set(b.id, { nombre: b.nombre, total: 0, citas: 0 })
  }
  for (const r of (reservasMes ?? []) as Reserva[]) {
    if (!r.barbero_id) continue
    const entry = mesMap.get(r.barbero_id)
    if (!entry) continue
    entry.total += r.precio_final ?? 0
    entry.citas++
  }

  const mesNombre = format(now, 'MMMM yyyy', { locale: es })
  const totalSemana = [...semanaMap.values()].reduce((s, b) => s + b.total, 0)
  const totalMes    = [...mesMap.values()].reduce((s, b) => s + b.total, 0)

  // Proyección al final de la semana
  const inicioSemana = startOfWeek(now, { weekStartsOn: 1 })
  const diasTranscurridos = Math.max(1, differenceInDays(now, inicioSemana) + 1) // mín 1 para no dividir por 0
  const promedioDiario = totalSemana / diasTranscurridos
  const proyeccion = Math.round(promedioDiario * 7)

  // % cumplimiento
  const pctCumplimiento = metaSemanal > 0 ? Math.min(100, Math.round((totalSemana / metaSemanal) * 100)) : null
  const pctProyeccion   = metaSemanal > 0 ? Math.round((proyeccion / metaSemanal) * 100) : null

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-8">Resumen Ejecutivo</h1>

      {/* Cuadros de meta */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <MetaSemanal
          metaActual={metaSemanal}
          barberiaId={barberia.id}
          guardarMeta={guardarMeta}
        />

        {/* % Cumplimiento */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-3">Cumplimiento semanal</p>
          {pctCumplimiento !== null ? (
            <>
              <p className={`text-3xl font-bold mb-3 ${pctCumplimiento >= 100 ? 'text-green-400' : pctCumplimiento >= 70 ? 'text-yellow-400' : 'text-white'}`}>
                {pctCumplimiento}%
              </p>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${pctCumplimiento >= 100 ? 'bg-green-400' : pctCumplimiento >= 70 ? 'bg-yellow-400' : 'bg-blue-400'}`}
                  style={{ width: `${Math.min(100, pctCumplimiento)}%` }}
                />
              </div>
              <p className="text-zinc-500 text-xs mt-2">
                ${totalSemana.toLocaleString('es-CL')} de ${metaSemanal.toLocaleString('es-CL')}
              </p>
            </>
          ) : (
            <p className="text-zinc-600 text-sm mt-2">Define una meta para ver el cumplimiento</p>
          )}
        </div>

        {/* Proyección */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-3">Proyección al cierre</p>
          <p className="text-3xl font-bold text-white mb-1">${proyeccion.toLocaleString('es-CL')}</p>
          <p className="text-zinc-500 text-xs mb-3">
            Basado en ${Math.round(promedioDiario).toLocaleString('es-CL')}/día · {diasTranscurridos} día{diasTranscurridos !== 1 ? 's' : ''} transcurrido{diasTranscurridos !== 1 ? 's' : ''}
          </p>
          {pctProyeccion !== null && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-lg
              ${pctProyeccion >= 100 ? 'bg-green-500/20 text-green-400' : pctProyeccion >= 80 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
              {pctProyeccion >= 100 ? '✓' : pctProyeccion >= 80 ? '~' : '↓'} {pctProyeccion}% de la meta
            </span>
          )}
        </div>
      </div>

      {/* Tabla semanal por barbero */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-300 uppercase tracking-wide">Por barbero — semana actual</h2>
          <span className="text-yellow-400 font-bold text-lg">${totalSemana.toLocaleString('es-CL')}</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-800/60">
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Barbero</th>
                {diasSemana.map(d => (
                  <th key={d.toISOString()} className={`px-3 py-3 text-center font-medium ${isSameDay(d, now) ? 'text-yellow-400' : 'text-zinc-400'}`}>
                    <span className="block capitalize">{format(d, 'EEE', { locale: es })}</span>
                    <span className="block text-xs font-normal">{format(d, 'd')}</span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-zinc-300 font-semibold">Total</th>
                <th className="px-3 py-3 text-center text-zinc-300 font-semibold">META</th>
                <th className="px-3 py-3 text-center text-zinc-300 font-semibold">Cumplimiento</th>
                <th className="px-3 py-3 text-center text-zinc-300 font-semibold">Proyección</th>
              </tr>
            </thead>
            <tbody>
              {[...semanaMap.entries()].map(([id, b]) => {
                const pctB = b.meta > 0 ? Math.min(100, Math.round((b.total / b.meta) * 100)) : null
                const proyB = Math.round((b.total / diasTranscurridos) * 7)
                const pctPB = b.meta > 0 ? Math.round((proyB / b.meta) * 100) : null
                return (
                  <tr key={id} className="border-t border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{b.nombre}</td>
                    {b.porDia.map((monto, i) => (
                      <td key={i} className={`px-3 py-3 text-center ${monto > 0 ? 'text-white' : 'text-zinc-700'}`}>
                        {monto > 0 ? `$${Math.round(monto / 1000)}k` : '—'}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-bold text-yellow-400">
                      ${b.total.toLocaleString('es-CL')}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <MetaBarberoCell barberoId={id} metaActual={b.meta} guardarMeta={guardarMetaBarbero} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      {pctB !== null ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-bold ${pctB >= 100 ? 'text-green-400' : pctB >= 70 ? 'text-yellow-400' : 'text-zinc-300'}`}>
                            {pctB}%
                          </span>
                          <div className="w-14 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${pctB >= 100 ? 'bg-green-400' : pctB >= 70 ? 'bg-yellow-400' : 'bg-blue-400'}`}
                              style={{ width: `${pctB}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-zinc-300 text-sm font-medium">${Math.round(proyB / 1000)}k</span>
                      {pctPB !== null && (
                        <span className={`block text-xs mt-0.5 ${pctPB >= 100 ? 'text-green-400' : pctPB >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {pctPB}%
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
              <tr className="border-t border-zinc-700 bg-zinc-800/40">
                <td className="px-4 py-3 text-zinc-400 font-semibold text-xs uppercase">Total</td>
                {diasSemana.map((_, i) => {
                  const sum = [...semanaMap.values()].reduce((s, b) => s + b.porDia[i], 0)
                  return (
                    <td key={i} className={`px-3 py-3 text-center text-xs font-semibold ${sum > 0 ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {sum > 0 ? `$${Math.round(sum / 1000)}k` : '—'}
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-right font-bold text-white">${totalSemana.toLocaleString('es-CL')}</td>
                <td colSpan={3} /></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Mes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-300 uppercase tracking-wide capitalize">
            Ingresos por barbero — {mesNombre}
          </h2>
          <span className="text-yellow-400 font-bold text-lg">${totalMes.toLocaleString('es-CL')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...mesMap.entries()].map(([id, b]) => (
            <div key={id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-base">
                  {b.nombre[0]}
                </div>
                <p className="text-white font-semibold leading-tight">{b.nombre}</p>
              </div>
              <p className="text-3xl font-bold text-yellow-400 mb-1">${b.total.toLocaleString('es-CL')}</p>
              <p className="text-zinc-500 text-sm">{b.citas} cita{b.citas !== 1 ? 's' : ''} completada{b.citas !== 1 ? 's' : ''}</p>
              {b.citas > 0 && (
                <p className="text-zinc-600 text-xs mt-1">
                  Promedio: ${Math.round(b.total / b.citas).toLocaleString('es-CL')} por cita
                </p>
              )}
            </div>
          ))}
          {mesMap.size === 0 && (
            <p className="text-zinc-500 text-sm col-span-3">No hay barberos activos</p>
          )}
        </div>
      </section>

      <section>
        <Suspense fallback={null}>
          <PrediccionDemanda barberiaId={barberia.id} />
        </Suspense>
      </section>
    </div>
  )
}
