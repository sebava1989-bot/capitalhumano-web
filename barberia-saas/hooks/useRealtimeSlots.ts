'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateSlots, getAvailableSlots } from '@/lib/slots'
import type { Slot } from '@/lib/slots'

function filterPastSlots(slots: string[], fechaStr: string): string[] {
  const todayStr = new Date().toISOString().split('T')[0]
  if (fechaStr !== todayStr) return slots
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  return slots.filter(slot => {
    const [h, m] = slot.split(':').map(Number)
    return h * 60 + m > currentMinutes
  })
}

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
        .eq('barberia_id', barberiaId)
        .eq('fecha', fechaStr)
        .maybeSingle()

      const bookedSlots: Slot[] = Array.isArray(data?.slots) ? (data.slots as unknown as Slot[]) : []
      const allSlots = generateSlots('09:00', '18:00', duracionMin)
      setAvailableSlots(filterPastSlots(getAvailableSlots(allSlots, bookedSlots), fechaStr))
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
          if (payload.new.barberia_id !== barberiaId) return
          const bookedSlots: Slot[] = Array.isArray(payload.new.slots) ? payload.new.slots : []
          const allSlots = generateSlots('09:00', '18:00', duracionMin)
          setAvailableSlots(filterPastSlots(getAvailableSlots(allSlots, bookedSlots), fechaStr))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [barberoId, fecha, duracionMin, supabase])

  return { availableSlots, loading }
}
