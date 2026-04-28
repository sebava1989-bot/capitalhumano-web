import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CampanasTable } from '@/components/admin/CampanasTable'
import { ReferidoConfig } from '@/components/admin/ReferidoConfig'

export default async function CampanasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id, referido_descuento_pct').eq('slug', slug).maybeSingle()
  if (!barberia) notFound()

  const { data: campanas } = await supabase
    .from('campanas')
    .select('id, titulo, asunto, segmento, estado, enviados, enviada_at, created_at')
    .eq('barberia_id', barberia.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Campañas</h1>
        <Link
          href={`/${slug}/admin/campanas/nueva`}
          className="px-4 py-2 bg-yellow-400 text-black font-bold text-sm rounded-xl hover:bg-yellow-300 transition-colors"
        >
          + Nueva campaña
        </Link>
      </div>
      <ReferidoConfig
        barberiaId={barberia.id}
        pctActual={barberia.referido_descuento_pct ?? 10}
        slug={slug}
      />

      <div className="mt-8">
        <CampanasTable campanas={campanas ?? []} slug={slug} />
      </div>
    </div>
  )
}
