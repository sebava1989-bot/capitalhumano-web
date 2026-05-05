import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'

async function crearBarbero(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const slug = formData.get('slug') as string
  const nombre = formData.get('nombre') as string
  const descripcion = (formData.get('descripcion') as string) || null
  const file = formData.get('foto') as File | null

  if (!nombre || !slug) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).maybeSingle()
  if (!barberia) return

  let fotoUrl: string | null = null
  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer()
    const adminSupa = createAdminClient()
    const path = `${barberia.id}/${Date.now()}.jpg`
    await adminSupa.storage.from('barberos').upload(path, Buffer.from(bytes), {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    })
    fotoUrl = adminSupa.storage.from('barberos').getPublicUrl(path).data.publicUrl
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('barberos').insert({
    barberia_id: barberia.id,
    nombre,
    activo: true,
    descripcion,
    foto_url: fotoUrl,
  })
  revalidatePath(`/${slug}/admin/barberos`)
}

async function toggleActivo(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string
  const activo = formData.get('activo') === 'true'
  const slug = formData.get('slug') as string
  await supabase.from('barberos').update({ activo: !activo }).eq('id', id)
  revalidatePath(`/${slug}/admin/barberos`)
}

async function irAReasignar(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const slug = formData.get('slug') as string
  if (!id || !slug) return
  redirect(`/${slug}/admin/barberos/reasignar/${id}`)
}

type BarberoStats = {
  id: string
  nombre: string
  activo: boolean
  foto_url: string | null
  descripcion: string | null
  completadas: number
  canceladas: number
}

export default async function BarberosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).maybeSingle()
  if (!barberia) notFound()

  const { data: barberosRaw } = await supabase
    .from('barberos')
    .select('id, nombre, activo, foto_url')
    .eq('barberia_id', barberia.id)
    .order('nombre')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: descripcionesRaw } = await (supabase as any)
    .from('barberos').select('id, descripcion').eq('barberia_id', barberia.id)
  const descripMap: Record<string, string | null> = {}
  for (const d of (descripcionesRaw ?? [])) descripMap[d.id] = d.descripcion

  // Stats: reservas completadas y canceladas por barbero
  const barberoIds = (barberosRaw ?? []).map((b: { id: string }) => b.id)
  let statsMap: Record<string, { completadas: number; canceladas: number }> = {}

  if (barberoIds.length > 0) {
    const { data: reservasStats } = await supabase
      .from('reservas')
      .select('barbero_id, estado')
      .in('barbero_id', barberoIds)
      .in('estado', ['completada', 'cancelada'])

    for (const r of (reservasStats ?? [])) {
      if (!statsMap[r.barbero_id]) statsMap[r.barbero_id] = { completadas: 0, canceladas: 0 }
      if (r.estado === 'completada') statsMap[r.barbero_id].completadas++
      if (r.estado === 'cancelada') statsMap[r.barbero_id].canceladas++
    }
  }

  const barberos: BarberoStats[] = (barberosRaw ?? []).map((b: { id: string; nombre: string; activo: boolean; foto_url: string | null }) => ({
    ...b,
    descripcion: descripMap[b.id] ?? null,
    completadas: statsMap[b.id]?.completadas ?? 0,
    canceladas: statsMap[b.id]?.canceladas ?? 0,
  }))

  const maxTotal = Math.max(...barberos.map(b => b.completadas + b.canceladas), 1)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Barberos</h1>

      <form action={crearBarbero} encType="multipart/form-data"
        className="bg-gradient-to-b from-zinc-800/80 to-zinc-900 border border-zinc-700/60
          rounded-2xl p-5 mb-6 space-y-3
          shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]">
        <input type="hidden" name="slug" value={slug} />
        <p className="text-sm font-semibold text-zinc-300 mb-1">Nuevo barbero</p>
        <div className="flex gap-3">
          <input name="nombre" placeholder="Nombre del barbero" required
            className="flex-1 bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm
              placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-all" />
          <button type="submit"
            className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 text-sm transition-colors
              shadow-[0_0_12px_rgba(250,204,21,0.3)] hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]">
            Agregar
          </button>
        </div>
        <textarea name="descripcion" placeholder="Descripción (opcional)" rows={2}
          className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm
            placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-all resize-none" />
        <div>
          <label className="text-zinc-500 text-xs mb-1 block">Foto (opcional)</label>
          <input type="file" name="foto" accept="image/*"
            className="text-sm text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
              file:bg-yellow-400 file:text-black file:font-medium file:text-sm cursor-pointer" />
        </div>
      </form>

      <div className="space-y-4">
        {barberos?.map(b => {
          const total = b.completadas + b.canceladas
          const pctCompletadas = total > 0 ? Math.round((b.completadas / total) * 100) : 0
          const barCompletadas = maxTotal > 0 ? Math.round((b.completadas / maxTotal) * 100) : 0
          const barCanceladas = maxTotal > 0 ? Math.round((b.canceladas / maxTotal) * 100) : 0

          return (
            <div key={b.id}
              className="bg-gradient-to-b from-zinc-800/80 to-zinc-900 border border-zinc-700/60
                rounded-2xl p-4 transition-all duration-200
                shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]
                hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-zinc-700 shrink-0 overflow-hidden
                  shadow-[0_2px_8px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
                  {b.foto_url
                    ? <img src={b.foto_url} alt={b.nombre} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                        {b.nombre?.[0] ?? '?'}
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">{b.nombre}</p>
                  {b.descripcion && <p className="text-zinc-400 text-sm mt-0.5 line-clamp-1">{b.descripcion}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <form action={toggleActivo}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="activo" value={String(b.activo)} />
                    <input type="hidden" name="slug" value={slug} />
                    <button type="submit"
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors
                        ${b.activo
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                          : 'bg-zinc-700/50 text-zinc-500 border border-zinc-700 hover:bg-zinc-700'}`}>
                      {b.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </form>
                  <form action={irAReasignar}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="slug" value={slug} />
                    <button type="submit"
                      className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-500/10 text-red-400
                        border border-red-500/30 hover:bg-red-500/20 transition-colors">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-zinc-800/60 rounded-xl p-3 text-center border border-zinc-700/50
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <p className="text-2xl font-bold text-white">{b.completadas}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Completadas</p>
                </div>
                <div className="bg-zinc-800/60 rounded-xl p-3 text-center border border-zinc-700/50
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <p className="text-2xl font-bold text-white">{b.canceladas}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Canceladas</p>
                </div>
                <div className="bg-zinc-800/60 rounded-xl p-3 text-center border border-zinc-700/50
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <p className="text-2xl font-bold text-yellow-400">{pctCompletadas}%</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Efectividad</p>
                </div>
              </div>

              {total > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 w-20 shrink-0">Completadas</span>
                    <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full
                          shadow-[0_0_6px_rgba(74,222,128,0.4)] transition-all duration-700"
                        style={{ width: `${barCompletadas}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-zinc-400 w-6 text-right">{b.completadas}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 w-20 shrink-0">Canceladas</span>
                    <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full
                          shadow-[0_0_6px_rgba(239,68,68,0.4)] transition-all duration-700"
                        style={{ width: `${barCanceladas}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-zinc-400 w-6 text-right">{b.canceladas}</span>
                  </div>
                </div>
              )}
              {total === 0 && (
                <p className="text-xs text-zinc-600 text-center py-1">Sin citas registradas aún</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
