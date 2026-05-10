import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { deflateSync } from 'zlib'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MAX_BASE64_CHARS = 7_400_000
const MAX_PROMPT_CHARS = 800

function buildPrompt(promptEstilo: string): string {
  return `Apply this hairstyle: ${promptEstilo}. The mask marks exactly the hair pixels to change. Result must look like a real photo taken after a professional haircut, matching original lighting and skin tone.`
}

function crc32(buf: Buffer): number {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c
  }
  let crc = 0xffffffff
  for (const b of buf) crc = t[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const tb = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crcVal = Buffer.alloc(4); crcVal.writeUInt32BE(crc32(Buffer.concat([tb, data])))
  return Buffer.concat([len, tb, data, crcVal])
}

interface FaceCoords {
  hairTop: number   // top of head/hair (fraction of image height)
  faceTop: number   // top of forehead — where hair ENDS and face BEGINS
  faceBottom: number // bottom of chin
}

// Phase 1: GPT-4o-mini detects face + hair boundaries precisely
async function detectFaceCoords(base64Data: string): Promise<FaceCoords> {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${base64Data}`, detail: 'low' }
        },
        {
          type: 'text',
          text: 'Analyze the face and hair in this photo. Return ONLY a JSON object with three decimal values (0.0 to 1.0) as fractions of the total image height: "hairTop" (very top of the hair/head), "faceTop" (top of forehead, where hair ends and skin begins), "faceBottom" (bottom of chin). Be precise. Example: {"hairTop":0.02,"faceTop":0.30,"faceBottom":0.72}. Only JSON.'
        }
      ]
    }],
    max_tokens: 80,
    temperature: 0,
  })

  const text = resp.choices[0].message.content ?? ''
  const match = text.match(/\{[^}]+\}/)
  if (!match) throw new Error('parse_failed')

  const raw = JSON.parse(match[0]) as Record<string, number>
  const hairTop = Math.max(0, Math.min(0.35, raw.hairTop ?? 0.02))
  const faceTop = Math.max(hairTop + 0.05, Math.min(0.60, raw.faceTop ?? 0.32))
  const faceBottom = Math.max(faceTop + 0.10, Math.min(0.95, raw.faceBottom ?? 0.72))
  return { hairTop, faceTop, faceBottom }
}

// Phase 2: Create precise mask using face coordinates
// transparent = hair zone (hairTop → faceTop) — model edits here
// opaque = everything else (background above head, face, body) — model preserves
function createPreciseMaskPng(width: number, height: number, coords: FaceCoords): Buffer {
  const { hairTop, faceTop } = coords
  const fade = 0.025

  const rows: number[] = []
  for (let y = 0; y < height; y++) {
    rows.push(0)
    const r = y / height

    let alpha: number
    if (r < hairTop - fade) {
      alpha = 255 // background above head: preserve
    } else if (r < hairTop) {
      alpha = Math.round(((hairTop - r) / fade) * 255) // fade to transparent
    } else if (r < faceTop) {
      alpha = 0 // HAIR ZONE: fully transparent — model edits only here
    } else if (r < faceTop + fade) {
      alpha = Math.round(((r - faceTop) / fade) * 255) // fade to opaque
    } else {
      alpha = 255 // face, neck, body, background below: fully preserved
    }

    for (let x = 0; x < width; x++) {
      rows.push(0, 0, 0, alpha)
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6 // 8-bit RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(Buffer.from(rows))),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function getJpegDimensions(buf: Buffer): { width: number; height: number } {
  let o = 2
  while (o + 4 < buf.length) {
    if (buf[o] !== 0xFF) break
    const marker = buf[o + 1]
    if (marker >= 0xC0 && marker <= 0xC3) {
      return { height: buf.readUInt16BE(o + 5), width: buf.readUInt16BE(o + 7) }
    }
    o += 2 + buf.readUInt16BE(o + 2)
  }
  return { width: 1024, height: 1024 }
}

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

  const body = await req.json()
  const { imageBase64, promptEstilo } = body as { imageBase64: string; promptEstilo: string }

  if (typeof imageBase64 !== 'string' || typeof promptEstilo !== 'string' || !imageBase64 || !promptEstilo)
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  if (imageBase64.length > MAX_BASE64_CHARS)
    return NextResponse.json({ error: 'image_too_large' }, { status: 413 })
  if (promptEstilo.length > MAX_PROMPT_CHARS)
    return NextResponse.json({ error: 'prompt_too_long' }, { status: 400 })

  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
  const imageBuffer = Buffer.from(base64Data, 'base64')
  const imageFile = new File([imageBuffer], 'photo.jpg', { type: 'image/jpeg' })

  // Phase 1: detect face + hair coordinates (fallback to safe defaults if it fails)
  const coords = await detectFaceCoords(base64Data).catch(() => ({
    hairTop: 0.02,
    faceTop: 0.32,
    faceBottom: 0.72,
  }))

  // Phase 2: build precise mask and apply style
  const { width, height } = getJpegDimensions(imageBuffer)
  const maskBuffer = createPreciseMaskPng(width, height, coords)
  const maskFile = new File([maskBuffer], 'mask.png', { type: 'image/png' })

  let response
  try {
    response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      mask: maskFile,
      prompt: buildPrompt(promptEstilo),
      size: '1024x1024',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'openai_error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const resultBase64 = response.data?.[0]?.b64_json
  if (!resultBase64) return NextResponse.json({ error: 'no_result' }, { status: 500 })
  return NextResponse.json({ imageBase64: resultBase64 })
}
