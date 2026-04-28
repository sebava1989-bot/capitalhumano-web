export interface Slot {
  hora: string
  disponible: boolean
  reserva_id: string | null
}

export function generateSlots(inicio: string, fin: string, duracionMin: number): string[] {
  const slots: string[] = []
  const [hi, mi] = inicio.split(':').map(Number)
  const [hf, mf] = fin.split(':').map(Number)
  const totalMinIni = hi * 60 + mi
  const totalMinFin = hf * 60 + mf

  for (let t = totalMinIni; t + duracionMin <= totalMinFin; t += duracionMin) {
    const h = Math.floor(t / 60).toString().padStart(2, '0')
    const m = (t % 60).toString().padStart(2, '0')
    slots.push(`${h}:${m}`)
  }
  return slots
}

export function getAvailableSlots(allSlots: string[], booked: Slot[]): string[] {
  const bookedHoras = new Set(booked.filter(s => !s.disponible).map(s => s.hora))
  return allSlots.filter(hora => !bookedHoras.has(hora))
}

export function markSlotBooked(slots: Slot[], hora: string, reservaId: string): Slot[] {
  return slots.map(s =>
    s.hora === hora ? { ...s, disponible: false, reserva_id: reservaId } : s
  )
}
