import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { slug } = await params
  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).eq('activo', true).maybeSingle()
  if (!barberia) return NextResponse.json({ error: 'barberia_not_found' }, { status: 404 })

  const { data: estilos } = await supabase
    .from('estilos_corte')
    .select('nombre, descripcion')
    .or(`es_predefinido.eq.true,barberia_id.eq.${barberia.id}`)
    .eq('activo', true)
    .order('orden')

  const body = await req.json()
  const { imageBase64 } = body as { imageBase64: string }
  if (!imageBase64) return NextResponse.json({ error: 'missing_image' }, { status: 400 })

  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64

  const listaEstilos = (estilos ?? [])
    .map((e) => `- ${e.nombre}${e.descripcion ? ': ' + e.descripcion : ''}`)
    .join('\n')

  const promptText = `Eres un barbero profesional experto en análisis de tipos de rostro.

Analiza la foto de esta persona y determina su tipo de rostro. Tipos posibles: oval, redondo, cuadrado, corazón, diamante, alargado.

Estilos disponibles:
${listaEstilos}

Recomienda 2 o 3 estilos de esa lista que mejor se adapten al rostro detectado.

Responde SOLO con este JSON (sin markdown, sin texto extra):
{"tipoRostro":"oval|redondo|cuadrado|corazón|diamante|alargado","descripcionRostro":"descripción breve en español","estilosRecomendados":["nombre exacto 1","nombre exacto 2"],"razon":"por qué estos estilos van bien, máximo 2 oraciones"}`

  let text = ''
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64Data },
          },
          { type: 'text', text: promptText },
        ],
      }],
    })
    text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'claude_error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  try {
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    const clean = jsonStart >= 0 && jsonEnd > jsonStart
      ? text.slice(jsonStart, jsonEnd + 1)
      : text.trim()
    const result = JSON.parse(clean)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'parse_error', raw: text }, { status: 500 })
  }
}
