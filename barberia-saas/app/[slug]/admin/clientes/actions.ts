'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function asignarAlianza(clienteId: string, alianzaId: string, slug: string) {
  const supabase = await createClient()
  await supabase.from('alianza_clientes').upsert({ alianza_id: alianzaId, cliente_id: clienteId })
  revalidatePath(`/${slug}/admin/clientes`)
}

export async function quitarAlianza(clienteId: string, alianzaId: string, slug: string) {
  const supabase = await createClient()
  await supabase.from('alianza_clientes').delete()
    .eq('alianza_id', alianzaId).eq('cliente_id', clienteId)
  revalidatePath(`/${slug}/admin/clientes`)
}
