import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { BookingWizard } from '@/components/booking/BookingWizard'
import type { Json } from '@/types/database'

interface Barberia {
  id: string
  nombre: string
  logo_url: string | null
  colores: Json
}

interface BarberoData {
  id: string
  nombre: string
  foto_url: string | null
  descripcion: string | null
}

export interface Horario {
  apertura: string
  cierre: string
  diasSemana: number[]
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
    .select('id, nombre, logo_url, colores, configuracion')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  if (!data) notFound()

  const barberia = data as Barberia
  const conf = (data.configuracion as Record<string, unknown>) ?? {}
  const horario: Horario = {
    apertura: (conf.apertura as string) ?? '09:00',
    cierre: (conf.cierre as string) ?? '18:00',
    diasSemana: (conf.diasSemana as number[]) ?? [1, 2, 3, 4, 5, 6],
  }

  const { data: servicios } = await supabase
    .from('servicios')
    .select('id, nombre, descripcion, duracion_min, precio')
    .eq('barberia_id', barberia.id)
    .eq('activo', true)
    .order('orden')

  const { data: barberos } = await supabase
    .from('barberos')
    .select('id, nombre, foto_url, descripcion')
    .eq('barberia_id', barberia.id)
    .eq('activo', true)

  // Premios activos del usuario para mostrar banner de descuento
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()
  let premiosBanner: { descuento_pct: number; referidoNombre: string; servicioNombre: string | null }[] = []
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: premiosRaw } = await (admin as any)
      .from('referido_premios')
      .select('id, descuento_pct, referido_id')
      .eq('referidor_id', user.id)
      .eq('barberia_id', barberia.id)
      .eq('canjeado', false)
      .eq('confirmado', true)
    if (premiosRaw && premiosRaw.length > 0) {
      premiosBanner = await Promise.all(premiosRaw.map(async (p: { id: string; descuento_pct: number; referido_id: string }) => {
        const [{ data: referido }, { data: ultimaReserva }] = await Promise.all([
          admin.from('users').select('nombre').eq('id', p.referido_id).maybeSingle(),
          admin.from('reservas')
            .select('servicios(nombre)')
            .eq('cliente_id', p.referido_id)
            .eq('barberia_id', barberia.id)
            .eq('estado', 'completada')
            .order('fecha_hora', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])
        return {
          descuento_pct: p.descuento_pct,
          referidoNombre: referido?.nombre ?? 'Un amigo',
          servicioNombre: (ultimaReserva?.servicios as unknown as { nombre: string } | null)?.nombre ?? null,
        }
      }))
    }
  }

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

        {premiosBanner.length > 0 && (
          <div className="mb-6 rounded-xl bg-green-950/60 border border-green-500/40 p-4">
            <p className="text-green-400 font-bold text-sm mb-2">🎁 Tienes {premiosBanner.length > 1 ? `${premiosBanner.length} descuentos` : 'un descuento'} disponible{premiosBanner.length > 1 ? 's' : ''}</p>
            {premiosBanner.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-400 font-bold text-lg">{p.descuento_pct}%</span>
                <p className="text-zinc-300 text-sm leading-tight">
                  Premio por referir a <span className="font-semibold text-white">{p.referidoNombre}</span>
                  {p.servicioNombre && <span className="text-zinc-400"> · {p.servicioNombre}</span>}
                  <span className="block text-zinc-500 text-xs mt-0.5">Se aplicará automáticamente en esta reserva</span>
                </p>
              </div>
            ))}
          </div>
        )}

        <BookingWizard
          barberia={barberia}
          servicios={servicios ?? []}
          barberos={(barberos ?? []) as unknown as BarberoData[]}
          refCode={ref}
          horario={horario}
        />
      </div>
    </main>
  )
}
