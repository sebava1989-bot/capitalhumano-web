'use client'
import { useState } from 'react'
import { useRealtimeSlots } from '@/hooks/useRealtimeSlots'
import { addDays, format, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  barberiaId: string
  barberoId: string
  duracionMin: number
  onSelect: (fecha: Date, hora: string) => void
  onBack: () => void
}

export function TimeSlotPicker({ barberiaId, barberoId, duracionMin, onSelect, onBack }: Props) {
  const today = startOfDay(new Date())
  const [fecha, setFecha] = useState<Date>(addDays(today, 1))
  const { availableSlots, loading } = useRealtimeSlots(barberiaId, barberoId, fecha, duracionMin)

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1))

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">¿Cuándo te acomoda?</h2>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {days.map(d => (
          <button
            key={d.toISOString()}
            onClick={() => setFecha(d)}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border transition-all
              ${d.toDateString() === fecha.toDateString()
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}
          >
            <span className="text-xs text-zinc-400">{format(d, 'EEE', { locale: es })}</span>
            <span className="text-lg font-bold text-white">{format(d, 'd')}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : availableSlots.length === 0 ? (
        <p className="text-zinc-400 text-center py-8">No hay horas disponibles este día</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {availableSlots.map(hora => (
            <button
              key={hora}
              onClick={() => onSelect(fecha, hora)}
              className="py-2 rounded-lg border border-zinc-800 bg-zinc-900
                hover:border-yellow-400 hover:bg-yellow-400/10 text-white text-sm transition-all"
            >
              {hora}
            </button>
          ))}
        </div>
      )}

      <button onClick={onBack} className="mt-6 text-zinc-400 text-sm hover:text-white transition-colors">← Volver</button>
    </div>
  )
}
