'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateSlots, getAvailableSlots } from '@/lib/slots'
import type { Slot } from '@/lib/slots'

export function useRealtimeSlots(
  barberiaId: string,
  barberoId: string,
  fecha: Date | null,
  duracionMin: number
) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!fecha) return
    const fechaStr = fecha.toISOString().split('T')[0]
    setLoading(true)

    async function load() {
      const { data } = await supabase
        .from('disponibilidad')
        .select('slots')
        .eq('barbero_id', barberoId)
        .eq('fecha', fechaStr)
        .single()

      const bookedSlots: Slot[] = Array.isArray(data?.slots) ? (data.slots as unknown as Slot[]) : []
      const allSlots = generateSlots('09:00', '18:00', duracionMin)
      setAvailableSlots(getAvailableSlots(allSlots, bookedSlots))
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel(`slots-${barberoId}-${fechaStr}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'disponibilidad',
          filter: `barbero_id=eq.${barberoId}`,
        },
        payload => {
          const bookedSlots: Slot[] = Array.isArray(payload.new.slots) ? (payload.new.slots as unknown as Slot[]) : []
          const allSlots = generateSlots('09:00', '18:00', duracionMin)
          setAvailableSlots(getAvailableSlots(allSlots, bookedSlots))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [barberoId, fecha, duracionMin, supabase])

  return { availableSlots, loading }
}
