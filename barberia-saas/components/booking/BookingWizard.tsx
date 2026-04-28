'use client'
import { useState } from 'react'
import { ServiceSelector } from './ServiceSelector'
import { BarberSelector } from './BarberSelector'
import { TimeSlotPicker } from './TimeSlotPicker'
import { BookingConfirm } from './BookingConfirm'
import type { Json } from '@/types/database'

interface Servicio { id: string; nombre: string; descripcion: string | null; duracion_min: number; precio: number }
interface Barbero { id: string; nombre: string; foto_url: string | null }
interface Barberia { id: string; nombre: string; colores: Json }

interface Props {
  barberia: Barberia
  servicios: Servicio[]
  barberos: Barbero[]
  refCode?: string
}

export function BookingWizard({ barberia, servicios, barberos, refCode }: Props) {
  const [step, setStep] = useState(1)
  const [servicio, setServicio] = useState<Servicio | null>(null)
  const [barbero, setBarbero] = useState<Barbero | null>(null)
  const [fecha, setFecha] = useState<Date | null>(null)
  const [hora, setHora] = useState<string | null>(null)

  const steps = [
    { label: 'Servicio', active: step >= 1 },
    { label: 'Barbero', active: step >= 2 },
    { label: 'Hora', active: step >= 3 },
    { label: 'Confirmar', active: step >= 4 },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center flex-1">
            <div className={`flex flex-col items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${s.active ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                {i + 1}
              </div>
              <span className={`text-xs mt-1 ${s.active ? 'text-white' : 'text-zinc-500'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 mb-4 ${step > i + 1 ? 'bg-yellow-400' : 'bg-zinc-800'}`} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <ServiceSelector
          servicios={servicios}
          selected={servicio}
          onSelect={s => { setServicio(s); setStep(2) }}
        />
      )}
      {step === 2 && (
        <BarberSelector
          barberos={barberos}
          selected={barbero}
          onSelect={b => { setBarbero(b); setStep(3) }}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && servicio && barbero && (
        <TimeSlotPicker
          barberiaId={barberia.id}
          barberoId={barbero.id}
          duracionMin={servicio.duracion_min}
          onSelect={(f, h) => { setFecha(f); setHora(h); setStep(4) }}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && servicio && barbero && fecha && hora && (
        <BookingConfirm
          barberia={barberia}
          servicio={servicio}
          barbero={barbero}
          fecha={fecha}
          hora={hora}
          refCode={refCode}
          onBack={() => setStep(3)}
        />
      )}
    </div>
  )
}
