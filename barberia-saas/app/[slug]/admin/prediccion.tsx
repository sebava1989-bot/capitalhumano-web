import { createClient } from '@/lib/supabase/server'
import { askClaude } from '@/lib/ai'
import { startOfDay } from 'date-fns'

interface Props { barberiaId: string }

interface PrediccionResult {
  resumen: string
  dias_pico: string[]
  alerta?: string
  accion?: string
}

async function generarPrediccion(barberiaId: string): Promise<PrediccionResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null

  const supabase = await createClient()
  const hace8semanas = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString()

  const { data: reservas } = await supabase
    .from('reservas')
    .select('fecha_hora, estado')
    .eq('barberia_id', barberiaId)
    .in('estado', ['completada', 'confirmada'])
    .gte('fecha_hora', hace8semanas)
    .order('fecha_hora')

  if (!reservas?.length) return null

  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const conteosDia: Record<string, number[]> = {}
  diasSemana.forEach(d => { conteosDia[d] = [] })

  // Agrupa reservas por semana-día
  const semanaMap = new Map<string, Record<string, number>>()
  for (const r of reservas) {
    const fecha = new Date(r.fecha_hora as string)
    const semana = `${fecha.getFullYear()}-W${Math.ceil((fecha.getDate() - fecha.getDay() + 7) / 7)}`
    const dia = diasSemana[fecha.getDay()]
    if (!semanaMap.has(semana)) semanaMap.set(semana, {})
    const s = semanaMap.get(semana)!
    s[dia] = (s[dia] ?? 0) + 1
  }

  for (const semana of semanaMap.values()) {
    diasSemana.forEach(d => conteosDia[d].push(semana[d] ?? 0))
  }

  const promediosDia = diasSemana.map(d => {
    const nums = conteosDia[d].filter(n => n > 0)
    return { dia: d, promedio: nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0 }
  }).filter(d => d.promedio > 0)

  const semanaActual = startOfDay(new Date()).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  const dataStr = promediosDia.map(d => `${d.dia}: ~${d.promedio} citas/semana`).join(', ')

  const prompt = `Eres analista de una barbería. Analiza los patrones de reservas y predice la demanda próxima.

Promedios por día de la semana (últimas 8 semanas):
${dataStr}

Total reservas analizadas: ${reservas.length}
Fecha actual: ${semanaActual}

Responde SOLO con JSON válido (sin markdown):
{"resumen":"análisis breve en 1-2 oraciones","dias_pico":["día1","día2"],"alerta":"alerta importante si existe o null","accion":"acción concreta recomendada o null"}`

  try {
    const raw = await askClaude(prompt)
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned) as PrediccionResult
  } catch {
    return null
  }
}

export async function PrediccionDemanda({ barberiaId }: Props) {
  const pred = await generarPrediccion(barberiaId)
  if (!pred) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🧠</span>
        <p className="text-zinc-400 text-xs uppercase tracking-wide">Predicción de demanda</p>
      </div>
      <p className="text-white text-sm mb-3">{pred.resumen}</p>
      {pred.dias_pico.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          <span className="text-zinc-500 text-xs">Días pico:</span>
          {pred.dias_pico.map(d => (
            <span key={d} className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 text-xs rounded-full border border-yellow-400/30 capitalize">
              {d}
            </span>
          ))}
        </div>
      )}
      {pred.alerta && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 mb-2">
          <p className="text-orange-400 text-xs">⚠️ {pred.alerta}</p>
        </div>
      )}
      {pred.accion && (
        <p className="text-zinc-400 text-xs">💡 {pred.accion}</p>
      )}
    </div>
  )
}
