import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BookingWizard } from '@/components/booking/BookingWizard'
import type { Json } from '@/types/database'

interface Barberia {
  id: string
  nombre: string
  logo_url: string | null
  colores: Json
}

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ref?: string }>
}

export default async function ReservarPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { ref } = await searchParams
  const supabase = await createClient()

  const { data } = await supabase
    .from('barberias')
    .select('id, nombre, logo_url, colores')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  if (!data) notFound()

  const barberia = data as Barberia

  const { data: servicios } = await supabase
    .from('servicios')
    .select('id, nombre, descripcion, duracion_min, precio')
    .eq('barberia_id', barberia.id)
    .eq('activo', true)
    .order('orden')

  const { data: barberos } = await supabase
    .from('barberos')
    .select('id, nombre, foto_url')
    .eq('barberia_id', barberia.id)
    .eq('activo', true)

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          {barberia.logo_url && (
            <img src={barberia.logo_url} alt={barberia.nombre} className="h-16 mx-auto mb-3" />
          )}
          <h1 className="text-2xl font-bold">{barberia.nombre}</h1>
          <p className="text-zinc-400 text-sm mt-1">Reserva tu hora</p>
        </div>
        <BookingWizard
          barberia={barberia}
          servicios={servicios ?? []}
          barberos={barberos ?? []}
          refCode={ref}
        />
      </div>
    </main>
  )
}
