'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearAlianza(formData: FormData) {
  const supabase = await createClient()
  const slug = formData.get('slug') as string
  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).maybeSingle()
  if (!barberia) return { error: 'Barbería no encontrada' }

  const { error } = await supabase.from('alianzas').insert({
    barberia_id: barberia.id,
    nombre: formData.get('nombre') as string,
    descripcion: formData.get('descripcion') as string || null,
    tipo: formData.get('tipo') as string,
    beneficio: formData.get('beneficio') as string || null,
    logo_url: formData.get('logo_url') as string || null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/${slug}/admin/alianzas`)
  return { ok: true }
}

export async function toggleAlianza(id: string, activo: boolean, slug: string) {
  const supabase = await createClient()
  await supabase.from('alianzas').update({ activo }).eq('id', id)
  revalidatePath(`/${slug}/admin/alianzas`)
}

export async function eliminarAlianza(id: string, slug: string) {
  const supabase = await createClient()
  await supabase.from('alianzas').delete().eq('id', id)
  revalidatePath(`/${slug}/admin/alianzas`)
}
