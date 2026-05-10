import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MAX_BASE64_CHARS = 7_400_000 // ~5.5 MB base64 ≈ 4 MB decoded
const MAX_PROMPT_CHARS = 800

function buildPrompt(promptEstilo: string): string {
  return (
    'This is a real photograph. Edit ONLY the hair. ' +
    'New hairstyle: ' + promptEstilo + '. ' +
    'Preserve with 100% fidelity: face shape, skin texture, skin pores, skin color, ' +
    'beard, mustache, eyebrows, eyes, nose, lips, wrinkles, ears, neck, shoulders, ' +
    'clothing, background, room lighting, photo grain, and image quality. ' +
    'Do NOT smooth skin. Do NOT change face proportions. Do NOT alter lighting. ' +
    'Do NOT make it look like a render or illustration. ' +
    'The edit must be indistinguishable from a real barbershop result photo. ' +
    'Change only the hair strands above the forehead and on the sides of the head.'
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { slug } = await params

  const { data: barberia } = await supabase
    .from('barberias')
    .select('id')
    .eq('slug', slug)
    .eq('activo', true)
    .maybeSingle()

  if (!barberia) {
    return NextResponse.json({ error: 'barberia_not_found' }, { status: 404 })
  }

  const body = await req.json()
  const { imageBase64, promptEstilo } = body as {
    imageBase64: string
    promptEstilo: string
  }

  if (typeof imageBase64 !== 'string' || typeof promptEstilo !== 'string' || !imageBase64 || !promptEstilo) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }

  if (imageBase64.length > MAX_BASE64_CHARS) {
    return NextResponse.json({ error: 'image_too_large' }, { status: 413 })
  }

  if (promptEstilo.length > MAX_PROMPT_CHARS) {
    return NextResponse.json({ error: 'prompt_too_long' }, { status: 400 })
  }

  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64
  const imageBuffer = Buffer.from(base64Data, 'base64')
  const imageFile = new File([imageBuffer], 'photo.jpg', { type: 'image/jpeg' })

  let response
  try {
    response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: buildPrompt(promptEstilo),
      size: '1024x1024',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'openai_error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const resultBase64 = response.data?.[0]?.b64_json
  if (!resultBase64) {
    return NextResponse.json({ error: 'no_result' }, { status: 500 })
  }
  return NextResponse.json({ imageBase64: resultBase64 })
}
