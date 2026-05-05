import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

interface Horario {
  apertura: string
  cierre: string
  diasSemana: number[]
}

export default async function ConfiguracionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias')
    .select('id, nombre, configuracion')
    .eq('slug', slug)
    .maybeSingle()

  if (!barberia) notFound()

  const conf = (barberia.configuracion as Record<string, unknown>) ?? {}
  const horario: Horario = {
    apertura: (conf.apertura as string) ?? '09:00',
    cierre: (conf.cierre as string) ?? '18:00',
    diasSemana: (conf.diasSemana as number[]) ?? [1, 2, 3, 4, 5, 6],
  }

  async function guardarHorario(formData: FormData) {
    'use server'
    const apertura = formData.get('apertura') as string
    const cierre = formData.get('cierre') as string
    const diasSemana = [0, 1, 2, 3, 4, 5, 6].filter(d => formData.get(`dia_${d}`) === 'on')

    const admin = createAdminClient()
    const { data: current } = await admin
      .from('barberias')
      .select('configuracion')
      .eq('slug', slug)
      .maybeSingle()

    const confActual = (current?.configuracion as Record<string, unknown>) ?? {}
    await admin.from('barberias').update({
      configuracion: { ...confActual, apertura, cierre, diasSemana },
    }).eq('slug', slug)

    revalidatePath(`/${slug}/admin/configuracion`)
    redirect(`/${slug}/admin/configuracion`)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-white mb-6">Configuración de Horario</h1>
      <form action={guardarHorario} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Apertura</label>
            <input
              type="time"
              name="apertura"
              defaultValue={horario.apertura}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-400"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Cierre</label>
            <input
              type="time"
              name="cierre"
              defaultValue={horario.cierre}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        <div>
          <label className="text-zinc-400 text-sm block mb-3">Días hábiles</label>
          <div className="grid grid-cols-7 gap-1">
            {[0,1,2,3,4,5,6].map(d => (
              <label key={d} className="flex flex-col items-center gap-1 cursor-pointer">
                <span className="text-zinc-500 text-xs">{['Do','Lu','Ma','Mi','Ju','Vi','Sa'][d]}</span>
                <input
                  type="checkbox"
                  name={`dia_${d}`}
                  defaultChecked={horario.diasSemana.includes(d)}
                  className="w-5 h-5 accent-yellow-400 rounded"
                />
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition-colors"
        >
          Guardar horario
        </button>
      </form>
    </div>
  )
}
