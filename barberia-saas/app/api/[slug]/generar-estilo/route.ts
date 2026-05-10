import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { deflateSync } from 'zlib'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MAX_BASE64_CHARS = 7_400_000
const MAX_PROMPT_CHARS = 800

function buildPrompt(promptEstilo: string): string {
  return `Apply this hairstyle to the person: ${promptEstilo}. The mask marks the exact area to change. Make the result look like a real photo taken after a haircut, matching the original lighting and skin tone.`
}

// PNG CRC-32 checksum
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
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcVal = Buffer.alloc(4)
  crcVal.writeUInt32BE(crc32(Buffer.concat([tb, data])))
  return Buffer.concat([len, tb, data, crcVal])
}

// Hair mask: top 45% transparent (model edits = hair zone)
//            45-60% gradient transition
//            below 60% fully opaque (model preserves = face/body)
function createHairMaskPng(width: number, height: number): Buffer {
  const rows: number[] = []
  for (let y = 0; y < height; y++) {
    rows.push(0) // PNG filter byte per row
    const r = y / height
    const alpha = r < 0.45
      ? 0
      : r < 0.60
        ? Math.round(((r - 0.45) / 0.15) * 255)
        : 255
    for (let x = 0; x < width; x++) {
      rows.push(0, 0, 0, alpha) // RGBA
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type: RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
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

  const { width, height } = getJpegDimensions(imageBuffer)
  const maskBuffer = createHairMaskPng(width, height)
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
