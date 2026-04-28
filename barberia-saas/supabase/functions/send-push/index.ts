import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface PushPayload {
  userId?: string
  barberiaId?: string
  segmento?: 'todos' | 'nuevo' | 'frecuente' | 'inactivo'
  title: string
  body: string
}

async function sendFcmPush(token: string, title: string, body: string) {
  const fcmKey = Deno.env.get('FCM_SERVER_KEY')
  if (!fcmKey) return false
  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${fcmKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      notification: { title, body },
    }),
  })
  return res.ok
}

Deno.serve(async (req) => {
  const payload: PushPayload = await req.json()

  let tokens: string[] = []

  if (payload.userId) {
    const { data } = await supabase
      .from('users').select('fcm_token')
      .eq('id', payload.userId).maybeSingle()
    if (data?.fcm_token) tokens = [data.fcm_token as string]

  } else if (payload.barberiaId) {
    const { data: users } = await supabase
      .from('users').select('fcm_token')
      .eq('barberia_id', payload.barberiaId)
      .eq('rol', 'cliente')
      .not('fcm_token', 'is', null)
    tokens = (users ?? []).map(u => u.fcm_token as string).filter(Boolean)
  }

  let sent = 0
  for (const token of tokens) {
    const ok = await sendFcmPush(token, payload.title, payload.body)
    if (ok) sent++
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
