'use client'
import { useEffect, useState } from 'react'
import { requestPushToken } from '@/lib/firebase'
import { createClient } from '@/lib/supabase/client'

export function PushPermission() {
  const [shown, setShown] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return
    if (Notification.permission === 'granted') return
    if (Notification.permission === 'denied') return
    if (localStorage.getItem('push_dismissed')) return
    setShown(true)
  }, [])

  async function handleAccept() {
    setShown(false)
    const token = await requestPushToken()
    if (!token) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('users').update({ fcm_token: token }).eq('id', user.id)
  }

  function handleDismiss() {
    localStorage.setItem('push_dismissed', '1')
    setDismissed(true)
    setShown(false)
  }

  if (!shown || dismissed) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50
      bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-xl">
      <p className="text-white text-sm font-semibold mb-1">Activar notificaciones</p>
      <p className="text-zinc-400 text-xs mb-3">
        Recibe recordatorios de tus citas directamente en tu dispositivo.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          className="flex-1 py-2 bg-yellow-400 text-black text-xs font-bold rounded-xl hover:bg-yellow-300 transition-colors"
        >
          Activar
        </button>
        <button
          onClick={handleDismiss}
          className="flex-1 py-2 bg-zinc-800 text-zinc-400 text-xs rounded-xl hover:text-white transition-colors"
        >
          Ahora no
        </button>
      </div>
    </div>
  )
}
