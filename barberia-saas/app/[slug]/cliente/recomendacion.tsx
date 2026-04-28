import { createClient } from '@/lib/supabase/server'
import { askClaude } from '@/lib/ai'

interface Props { clienteId: string; barberiaNombre: string }

interface RecomendacionResult {
  texto: string
  urgencia: 'alta' | 'media' | 'baja'
  servicio_sugerido?: string
}

async function generarRecomendacion(clienteId: string, barberiaNombre: string): Promise<RecomendacionResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null

  const supabase = await createClient()
  const { data: visitas } = await supabase
    .from('reservas')
    .select('fecha_hora, precio_final, calificacion, servicios(nombre)')
    .eq('cliente_id', clienteId)
    .eq('estado', 'completada')
    .order('fecha_hora', { ascending: false })
    .limit(8)

  if (!visitas?.length) return null

  const diasDesdeUltima = Math.floor(
    (Date.now() - new Date(visitas[0].fecha_hora as string).getTime()) / (1000 * 60 * 60 * 24)
  )
  const intervalos: number[] = []
  for (let i = 0; i < visitas.length - 1; i++) {
    const diff = new Date(visitas[i].fecha_hora as string).getTime() - new Date(visitas[i + 1].fecha_hora as string).getTime()
    intervalos.push(Math.round(diff / (1000 * 60 * 60 * 24)))
  }
  const frecuenciaPromedio = intervalos.length
    ? Math.round(intervalos.reduce((a, b) => a + b, 0) / intervalos.length)
    : 30

  const historialStr = visitas.map(v =>
    `- ${new Date(v.fecha_hora as string).toLocaleDateString('es-CL')}: ${(v.servicios as { nombre: string } | null)?.nombre ?? 'Servicio'} ($${v.precio_final?.toLocaleString('es-CL') ?? 0})${v.calificacion ? ` [${v.calificacion}★]` : ''}`
  ).join('\n')

  const prompt = `Eres el asistente de ${barberiaNombre}, una barbería. Analiza el historial de un cliente y genera una recomendación personalizada en español.

Historial (${visitas.length} visitas):
${historialStr}

Frecuencia promedio entre visitas: ${frecuenciaPromedio} días
Días desde última visita: ${diasDesdeUltima} días

Responde SOLO con JSON válido (sin markdown), así:
{"texto":"recomendación en 1-2 oraciones directas y cálidas","urgencia":"alta|media|baja","servicio_sugerido":"nombre del servicio recomendado o null"}`

  try {
    const raw = await askClaude(prompt)
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned) as RecomendacionResult
  } catch {
    return null
  }
}

export async function RecomendacionIA({ clienteId, barberiaNombre }: Props) {
  const rec = await generarRecomendacion(clienteId, barberiaNombre)
  if (!rec) return null

  const urgenciaColor = {
    alta: 'border-yellow-400/50 bg-yellow-400/5',
    media: 'border-zinc-600 bg-zinc-900',
    baja: 'border-zinc-700 bg-zinc-900',
  }[rec.urgencia]

  return (
    <div className={`border rounded-xl p-4 mb-4 ${urgenciaColor}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🤖</span>
        <div>
          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Para ti</p>
          <p className="text-white text-sm">{rec.texto}</p>
          {rec.servicio_sugerido && (
            <p className="text-yellow-400 text-xs mt-1 font-medium">{rec.servicio_sugerido}</p>
          )}
        </div>
      </div>
    </div>
  )
}
