import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function ClientesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).single()
  if (!barberia) notFound()

  const { data: clientes } = await supabase
    .from('users')
    .select('id, nombre, telefono, created_at')
    .eq('barberia_id', barberia.id)
    .eq('rol', 'cliente')
    .eq('activo', true)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800">
            <tr>
              <th className="text-left p-3 text-zinc-400 font-medium">Nombre</th>
              <th className="text-left p-3 text-zinc-400 font-medium">Teléfono</th>
              <th className="text-left p-3 text-zinc-400 font-medium">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {clientes?.map(c => (
              <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="p-3 text-white">{c.nombre}</td>
                <td className="p-3 text-zinc-400">{c.telefono ?? '—'}</td>
                <td className="p-3 text-zinc-400">
                  {new Date(c.created_at).toLocaleDateString('es-CL')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!clientes?.length && (
          <p className="text-zinc-500 text-center py-8">Aún no hay clientes registrados</p>
        )}
      </div>
    </div>
  )
}
