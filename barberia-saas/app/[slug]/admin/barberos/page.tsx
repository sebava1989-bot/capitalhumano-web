import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'

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

export default async function BarberosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).maybeSingle()
  if (!barberia) notFound()

  type BarberoRow = { id: string; nombre: string; activo: boolean; foto_url: string | null; descripcion: string | null }
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
  const barberos: BarberoRow[] = (barberosRaw ?? []).map((b: { id: string; nombre: string; activo: boolean; foto_url: string | null }) => ({
    ...b,
    descripcion: descripMap[b.id] ?? null,
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Barberos</h1>

      <form action={crearBarbero} encType="multipart/form-data"
        className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 space-y-3">
        <input type="hidden" name="slug" value={slug} />
        <p className="text-sm font-medium text-zinc-300 mb-1">Nuevo barbero</p>
        <div className="flex gap-3">
          <input name="nombre" placeholder="Nombre del barbero" required
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm
              focus:outline-none focus:border-yellow-400 transition-colors" />
          <button type="submit"
            className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 text-sm transition-colors">
            Agregar
          </button>
        </div>
        <textarea name="descripcion" placeholder="Descripción (opcional)" rows={2}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm
            focus:outline-none focus:border-yellow-400 transition-colors resize-none" />
        <div>
          <label className="text-zinc-400 text-xs mb-1 block">Foto (opcional)</label>
          <input type="file" name="foto" accept="image/*"
            className="text-sm text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
              file:bg-yellow-400 file:text-black file:font-medium file:text-sm cursor-pointer" />
        </div>
      </form>

      <div className="space-y-3">
        {barberos?.map(b => (
          <div key={b.id}
            className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="w-12 h-12 rounded-full bg-zinc-700 shrink-0 overflow-hidden">
              {b.foto_url
                ? <img src={b.foto_url} alt={b.nombre} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                    {b.nombre?.[0] ?? '?'}
                  </div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">{b.nombre}</p>
              {b.descripcion && <p className="text-zinc-400 text-sm mt-0.5 line-clamp-1">{b.descripcion}</p>}
            </div>
            <form action={toggleActivo}>
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="activo" value={String(b.activo)} />
              <input type="hidden" name="slug" value={slug} />
              <button type="submit"
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors
                  ${b.activo
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}>
                {b.activo ? 'Activo' : 'Inactivo'}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
