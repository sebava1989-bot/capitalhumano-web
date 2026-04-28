import { describe, it, expect } from 'vitest'
import { generateSlots, getAvailableSlots, markSlotBooked } from '@/lib/slots'

describe('generateSlots', () => {
  it('genera slots de 30 min entre 09:00 y 18:00', () => {
    const slots = generateSlots('09:00', '18:00', 30)
    expect(slots[0]).toBe('09:00')
    expect(slots[1]).toBe('09:30')
    expect(slots[slots.length - 1]).toBe('17:30')
    expect(slots).toHaveLength(18)
  })

  it('genera slots de 60 min', () => {
    const slots = generateSlots('09:00', '13:00', 60)
    expect(slots).toEqual(['09:00', '10:00', '11:00', '12:00'])
  })

  it('no incluye slots que se pasan del horario de cierre', () => {
    const slots = generateSlots('09:00', '10:00', 45)
    expect(slots).toEqual(['09:00'])
  })
})

describe('getAvailableSlots', () => {
  const allSlots = ['09:00', '09:30', '10:00', '10:30']
  const bookedSlots = [
    { hora: '09:30', disponible: false, reserva_id: 'abc' },
    { hora: '10:30', disponible: false, reserva_id: 'def' },
  ]

  it('retorna solo slots disponibles', () => {
    const available = getAvailableSlots(allSlots, bookedSlots)
    expect(available).toEqual(['09:00', '10:00'])
  })

  it('retorna todos si no hay reservas', () => {
    const available = getAvailableSlots(allSlots, [])
    expect(available).toEqual(allSlots)
  })
})

describe('markSlotBooked', () => {
  it('marca un slot como no disponible en el array', () => {
    const slots = [
      { hora: '09:00', disponible: true, reserva_id: null },
      { hora: '09:30', disponible: true, reserva_id: null },
    ]
    const result = markSlotBooked(slots, '09:00', 'reserva-123')
    expect(result[0]).toEqual({ hora: '09:00', disponible: false, reserva_id: 'reserva-123' })
    expect(result[1].disponible).toBe(true)
  })
})
