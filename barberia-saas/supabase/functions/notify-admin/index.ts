import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')!

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record

    if (!record) {
      return new Response('no record', { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Get barberia FCM token
    const { data: barberia } = await supabase
      .from('barberias')
      .select('fcm_token_admin, nombre')
      .eq('id', record.barberia_id)
      .maybeSingle()

    const token = barberia?.fcm_token_admin
    if (!token) {
      return new Response('no fcm token', { status: 200 })
    }

    // Get barbero and servicio names for the notification body
    const [{ data: barbero }, { data: servicio }] = await Promise.all([
      supabase.from('barberos').select('nombre').eq('id', record.barbero_id).maybeSingle(),
      supabase.from('servicios').select('nombre').eq('id', record.servicio_id).maybeSingle(),
    ])

    const fecha = new Date(record.fecha_hora)
    const hora = fecha.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago',
    })

    const body = `${hora} · ${servicio?.nombre ?? 'Servicio'} con ${barbero?.nombre ?? 'Barbero'}`

    // Send FCM notification via HTTP v1 legacy API
    const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: 'Nueva reserva',
          body,
          sound: 'default',
        },
        android: {
          priority: 'high',
          notification: {
            channel_id: 'barberia_reservas',
          },
        },
        data: {
          reserva_id: record.id,
          barberia_id: record.barberia_id,
        },
      }),
    })

    const fcmBody = await fcmRes.json()
    return new Response(JSON.stringify(fcmBody), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(String(err), { status: 500 })
  }
})
