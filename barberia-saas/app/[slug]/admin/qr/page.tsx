import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { QrInvite } from '@/components/admin/QrInvite'
import { headers } from 'next/headers'

export default async function QrPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: barberia } = await supabase
    .from('barberias')
    .select('id, nombre')
    .eq('slug', slug)
    .maybeSingle()

  if (!barberia) notFound()

  const headersList = await headers()
  const host = headersList.get('host') ?? 'barberia-saas-gamma.vercel.app'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const url = `${protocol}://${host}/${slug}`

  return (
    <main className="min-h-screen bg-zinc-900 p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-white text-2xl font-bold mb-2">Código QR de tu barbería</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Comparte el QR para que tus clientes reserven y se registren fácilmente.
        </p>
        <QrInvite slug={slug} barberiaNombre={barberia.nombre} url={url} />
      </div>
    </main>
  )
}
