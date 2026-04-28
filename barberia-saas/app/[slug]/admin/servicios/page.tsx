import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'

async function upsertServicio(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string | null
  const barberia_id = formData.get('barberia_id') as string
  const slug = formData.get('slug') as string

  const nombre = formData.get('nombre') as string
  const duracion_min = Number(formData.get('duracion_min'))
  const precio = Number(formData.get('precio'))

  if (!nombre || !barberia_id || isNaN(duracion_min) || isNaN(precio) || precio <= 0 || duracion_min <= 0) return

  const payload = {
    barberia_id,
    nombre,
    descripcion: (formData.get('descripcion') as string) || null,
    duracion_min,
    precio,
    activo: true,
  }

  if (id) {
    await supabase.from('servicios').update(payload).eq('id', id)
  } else {
    await supabase.from('servicios').insert(payload)
  }
  revalidatePath(`/${slug}/admin/servicios`)
}

export default async function ServiciosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).single()
  if (!barberia) notFound()

  const { data: servicios } = await supabase
    .from('servicios').select('*').eq('barberia_id', barberia.id).order('orden')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Servicios</h1>
      <form action={upsertServicio} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 grid grid-cols-2 gap-3">
        <input type="hidden" name="barberia_id" value={barberia.id} />
        <input type="hidden" name="slug" value={slug} />
        <input name="nombre" placeholder="Nombre del servicio" required
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm col-span-2" />
        <input name="descripcion" placeholder="Descripción (opcional)"
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm col-span-2" />
        <input name="duracion_min" type="number" placeholder="Duración (min)" required min="1"
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
        <input name="precio" type="number" placeholder="Precio ($)" required min="1"
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
        <button type="submit"
          className="col-span-2 py-2 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-300 transition-colors text-sm">
          Agregar servicio
        </button>
      </form>
      <div className="space-y-2">
        {servicios?.map(s => (
          <div key={s.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <div>
              <p className="text-white font-medium">{s.nombre}</p>
              <p className="text-zinc-400 text-sm">{s.duracion_min} min</p>
            </div>
            <p className="text-yellow-400 font-bold">${s.precio.toLocaleString('es-CL')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
