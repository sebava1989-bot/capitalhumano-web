import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { startOfDay, endOfDay } from 'date-fns'

async function updateEstado(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string
  const estado = formData.get('estado') as string
  const slug = formData.get('slug') as string
  if (!id || !['completada', 'no_show'].includes(estado)) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: barbero } = await supabase
    .from('barberos').select('id').eq('user_id', user.id).maybeSingle()
  if (!barbero) return

  await supabase.from('reservas')
    .update({ estado: estado as 'completada' | 'no_show' })
    .eq('id', id)
    .eq('barbero_id', barbero.id)
  revalidatePath(`/${slug}/barbero`)
}

export default async function BarberoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${slug}/reservar?login=true`)

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).maybeSingle()
  if (!barberia) notFound()

  const { data: barbero } = await supabase
    .from('barberos').select('id, nombre').eq('user_id', user.id).eq('barberia_id', barberia.id).maybeSingle()

  if (!barbero) return <p className="text-zinc-400 p-8">No estás registrado como barbero en esta barbería.</p>

  const today = new Date()
  const { data: citas } = await supabase
    .from('reservas')
    .select('id, fecha_hora, estado, cliente_nombre, precio_final, servicios(nombre)')
    .eq('barbero_id', barbero.id)
    .eq('barberia_id', barberia.id)
    .gte('fecha_hora', startOfDay(today).toISOString())
    .lte('fecha_hora', endOfDay(today).toISOString())
    .order('fecha_hora')

  const ingresos = citas?.filter(c => c.estado === 'completada').reduce((s, c) => s + (c.precio_final ?? 0), 0) ?? 0

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">{barbero.nombre}</h1>
          <p className="text-zinc-400 text-sm">Agenda de hoy</p>
        </div>
        <div className="text-right bg-zinc-900 rounded-xl px-4 py-2">
          <p className="text-green-400 font-bold text-lg">${ingresos.toLocaleString('es-CL')}</p>
          <p className="text-zinc-500 text-xs">hoy</p>
        </div>
      </div>

      <div className="space-y-3">
        {citas?.map(c => (
          <div key={c.id}
            className={`border rounded-xl p-4 ${
              c.estado === 'completada' ? 'border-green-800 bg-green-900/20' :
              c.estado === 'no_show' ? 'border-zinc-800 bg-zinc-900/50 opacity-60' :
              'border-yellow-400/30 bg-zinc-900'
            }`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-white font-semibold">
                  {new Date(c.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  {' — '}{c.cliente_nombre ?? 'Sin nombre'}
                </p>
                <p className="text-zinc-400 text-sm">{(c.servicios as unknown as { nombre: string })?.nombre}</p>
              </div>
              <p className="text-white font-bold">${(c.precio_final ?? 0).toLocaleString('es-CL')}</p>
            </div>

            {c.estado === 'confirmada' && (
              <div className="flex gap-2">
                <form action={updateEstado}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="estado" value="completada" />
                  <input type="hidden" name="slug" value={slug} />
                  <button type="submit"
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-500">
                    ✓ Completado
                  </button>
                </form>
                <form action={updateEstado}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="estado" value="no_show" />
                  <input type="hidden" name="slug" value={slug} />
                  <button type="submit"
                    className="px-3 py-1 bg-zinc-700 text-zinc-300 text-xs rounded-lg hover:bg-zinc-600">
                    No asistió
                  </button>
                </form>
              </div>
            )}
            {c.estado === 'completada' && <span className="text-green-400 text-xs">✓ Completado</span>}
            {c.estado === 'no_show' && <span className="text-zinc-500 text-xs">No asistió</span>}
          </div>
        ))}
        {!citas?.length && <p className="text-zinc-500 text-center py-8">No hay citas para hoy</p>}
      </div>
    </div>
  )
}
