'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RealtimeAdminRefresh({ barberiaId }: { barberiaId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`admin-reservas-${barberiaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservas', filter: `barberia_id=eq.${barberiaId}` },
        () => { router.refresh() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [barberiaId, router])

  return null
}
