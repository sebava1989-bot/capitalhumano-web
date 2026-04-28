import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// Flow.cl webhook — verifica firma HMAC-SHA256
function verifyFlowSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-flow-signature') ?? ''
  const secret = process.env.FLOW_SECRET_KEY ?? ''

  if (secret && !verifyFlowSignature(body, signature, secret)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()
  const evento = payload.event as string
  const flowSubId = payload.subscriptionId as string

  if (!flowSubId) return NextResponse.json({ ok: true })

  if (evento === 'subscription.created' || evento === 'subscription.renewed') {
    const venceAt = payload.nextPaymentDate
      ? new Date(payload.nextPaymentDate as string).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await adminSupabase.from('suscripciones')
      .update({ estado: 'activa', vence_at: venceAt })
      .eq('flow_subscription_id', flowSubId)

  } else if (evento === 'subscription.cancelled' || evento === 'subscription.expired') {
    await adminSupabase.from('suscripciones')
      .update({ estado: evento === 'subscription.cancelled' ? 'cancelada' : 'vencida' })
      .eq('flow_subscription_id', flowSubId)
  }

  return NextResponse.json({ ok: true })
}
