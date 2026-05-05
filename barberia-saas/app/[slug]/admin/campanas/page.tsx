import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CampanasTable } from '@/components/admin/CampanasTable'
import { ReferidoConfig } from '@/components/admin/ReferidoConfig'

export default async function CampanasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barberia } = await (supabase as any)
    .from('barberias')
    .select('id, referido_descuento_pct, referido_descuento_nuevo_cliente_pct, referido_acumulable, referido_max_pct_por_servicio')
    .eq('slug', slug).maybeSingle()
  if (!barberia) notFound()

  const { data: campanas } = await supabase
    .from('campanas')
    .select('id, titulo, asunto, segmento, estado, enviados, enviada_at, created_at')
    .eq('barberia_id', barberia.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Campañas</h1>
        <Link
          href={`/${slug}/admin/campanas/nueva`}
          className="px-4 py-2 bg-yellow-400 text-black font-bold text-sm rounded-xl hover:bg-yellow-300 transition-colors"
        >
          + Nueva campaña
        </Link>
      </div>
      <ReferidoConfig
        barberiaId={barberia.id}
        slug={slug}
        pctReferidor={barberia.referido_descuento_pct ?? 10}
        pctNuevoCliente={barberia.referido_descuento_nuevo_cliente_pct ?? 0}
        acumulable={barberia.referido_acumulable ?? false}
        maxPct={barberia.referido_max_pct_por_servicio ?? 50}
      />

      <div className="mt-8">
        <CampanasTable campanas={campanas ?? []} slug={slug} />
      </div>
    </div>
  )
}
