import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const supabase = createAdminClient()
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

  if (!imageBase64 || !promptEstilo) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64
  const imageBuffer = Buffer.from(base64Data, 'base64')
  const imageFile = new File([imageBuffer], 'photo.jpg', { type: 'image/jpeg' })

  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: imageFile,
    prompt: promptEstilo,
    size: '1024x1024',
  })

  const resultBase64 = response.data?.[0]?.b64_json
  if (!resultBase64) {
    return NextResponse.json({ error: 'no_result' }, { status: 500 })
  }
  return NextResponse.json({ imageBase64: resultBase64 })
}
