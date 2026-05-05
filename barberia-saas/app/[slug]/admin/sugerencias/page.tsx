import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

type TipoFiltro = 'todas' | 'elogio' | 'sugerencia' | 'reclamo'
type Sugerencia = { id: string; tipo: string; mensaje: string; nombre: string | null; leida: boolean; created_at: string }

const TIPO_CONFIG = {
  elogio: { label: 'Elogio', emoji: '⭐', badge: 'bg-green-50 text-green-700 border border-green-200' },
  sugerencia: { label: 'Sugerencia', emoji: '💡', badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  reclamo: { label: 'Reclamo', emoji: '⚠️', badge: 'bg-red-50 text-red-700 border border-red-200' },
}

async function marcarLeida(id: string, barberiaId: string) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase
    .from('users').select('rol, barberia_id').eq('id', user.id).maybeSingle()
  if (!profile || !['admin', 'superadmin'].includes(profile.rol) || profile.barberia_id !== barberiaId) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (createAdminClient() as any)
    .from('sugerencias')
    .update({ leida: true })
    .eq('id', id)
    .eq('barberia_id', barberiaId)
  revalidatePath('', 'page')
}

function formatRelativo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `hace ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  return `hace ${d}d`
}

export default async function SugerenciasPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tipo?: string }>
}) {
  const { slug } = await params
  const { tipo: tipoParam } = await searchParams

  const supabase = await createClient()

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).maybeSingle()
  if (!barberia) notFound()

  const { data: profile } = await supabase
    .from('users').select('rol, barberia_id').eq('id', user.id).maybeSingle()
  if (!profile || !['admin', 'superadmin'].includes(profile.rol) || profile.barberia_id !== barberia.id) {
    notFound()
  }

  const tipoFiltro: TipoFiltro =
    ['elogio', 'sugerencia', 'reclamo'].includes(tipoParam ?? '') ? (tipoParam as TipoFiltro) : 'todas'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  let query = db
    .from('sugerencias')
    .select('id, tipo, mensaje, nombre, leida, created_at')
    .eq('barberia_id', barberia.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (tipoFiltro !== 'todas') {
    query = query.eq('tipo', tipoFiltro)
  }

  const { data: sugerenciasRaw } = await query
  const sugerencias = (sugerenciasRaw ?? []) as Sugerencia[]

  const tabs: { value: TipoFiltro; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'elogio', label: '⭐ Elogios' },
    { value: 'sugerencia', label: '💡 Sugerencias' },
    { value: 'reclamo', label: '⚠️ Reclamos' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sugerencias y Reclamos</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => (
          <a
            key={tab.value}
            href={tab.value === 'todas' ? `/${slug}/admin/sugerencias` : `/${slug}/admin/sugerencias?tipo=${tab.value}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border
              ${tipoFiltro === tab.value
                ? 'bg-yellow-400 text-black border-yellow-400'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900'}`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {sugerencias.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">💬</div>
          <p>No hay mensajes aún</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sugerencias.map(s => {
            const config = TIPO_CONFIG[s.tipo as keyof typeof TIPO_CONFIG] ?? TIPO_CONFIG.sugerencia
            const marcarAction = marcarLeida.bind(null, s.id, barberia.id)
            return (
              <div
                key={s.id}
                className={`bg-white border rounded-2xl p-4 shadow-sm transition-all
                  ${s.leida ? 'border-gray-200 opacity-60' : 'border-gray-300 shadow-[0_2px_12px_rgba(0,0,0,0.06)]'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.badge}`}>
                      {config.emoji} {config.label}
                    </span>
                    {!s.leida && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                        Nueva
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatRelativo(s.created_at)}</span>
                    {s.nombre ? (
                      <span className="text-xs text-gray-500 font-medium">👤 {s.nombre}</span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Anónimo</span>
                    )}
                  </div>
                  {!s.leida && (
                    <form action={marcarAction}>
                      <button
                        type="submit"
                        className="text-xs text-gray-400 hover:text-gray-700 underline shrink-0"
                      >
                        Marcar leída
                      </button>
                    </form>
                  )}
                </div>
                <p className="mt-3 text-sm text-gray-700 leading-relaxed">{s.mensaje}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
