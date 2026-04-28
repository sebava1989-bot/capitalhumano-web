import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'

async function crearBarbero(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const barberia_id = formData.get('barberia_id') as string
  const slug = formData.get('slug') as string
  const nombre = formData.get('nombre') as string
  if (!nombre || !barberia_id) return
  await supabase.from('barberos').insert({ barberia_id, nombre, activo: true })
  revalidatePath(`/${slug}/admin/barberos`)
}

export default async function BarberosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).single()
  if (!barberia) notFound()

  const { data: barberos } = await supabase
    .from('barberos').select('*').eq('barberia_id', barberia.id).eq('activo', true)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Barberos</h1>
      <form action={crearBarbero} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex gap-3">
        <input type="hidden" name="barberia_id" value={barberia.id} />
        <input type="hidden" name="slug" value={slug} />
        <input name="nombre" placeholder="Nombre del barbero" required
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
        <button type="submit"
          className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-300 text-sm">
          Agregar
        </button>
      </form>
      <div className="space-y-2">
        {barberos?.map(b => (
          <div key={b.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
              {b.nombre[0]}
            </div>
            <p className="text-white font-medium">{b.nombre}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
