# Horario y Días de la Barbería — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir al admin configurar el horario de apertura/cierre y días hábiles de la barbería, y que el flujo de reservas respete esa configuración.

**Architecture:** Se almacena `{ apertura, cierre, diasSemana }` en el campo JSON `configuracion` de `barberias` (sin migración). La página de reservas lee el horario del servidor y lo pasa como prop hasta `useRealtimeSlots`, que reemplaza los valores hardcodeados.

**Tech Stack:** Next.js 16 App Router, Server Actions, Supabase, TypeScript, Tailwind CSS

---

## Archivos

- **Create:** `barberia-saas/app/[slug]/admin/configuracion/page.tsx` — página admin con formulario de horario
- **Modify:** `barberia-saas/app/[slug]/admin/layout.tsx` — agregar enlace "Configuración" al nav
- **Modify:** `barberia-saas/app/[slug]/reservar/page.tsx` — leer `configuracion` y pasarla como prop
- **Modify:** `barberia-saas/components/booking/BookingWizard.tsx` — aceptar y pasar prop `horario`
- **Modify:** `barberia-saas/components/booking/TimeSlotPicker.tsx` — filtrar días según `diasSemana`
- **Modify:** `barberia-saas/hooks/useRealtimeSlots.ts` — usar `apertura`/`cierre` dinámicos

---

### Task 1: Página admin de configuración de horario

**Files:**
- Create: `barberia-saas/app/[slug]/admin/configuracion/page.tsx`

- [ ] **Step 1: Crear la página con Server Action**

```tsx
// app/[slug]/admin/configuracion/page.tsx
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface Horario {
  apertura: string
  cierre: string
  diasSemana: number[]
}

export default async function ConfiguracionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias')
    .select('id, nombre, configuracion')
    .eq('slug', slug)
    .maybeSingle()

  if (!barberia) notFound()

  const conf = (barberia.configuracion as Record<string, unknown>) ?? {}
  const horario: Horario = {
    apertura: (conf.apertura as string) ?? '09:00',
    cierre: (conf.cierre as string) ?? '18:00',
    diasSemana: (conf.diasSemana as number[]) ?? [1, 2, 3, 4, 5, 6],
  }

  async function guardarHorario(formData: FormData) {
    'use server'
    const apertura = formData.get('apertura') as string
    const cierre = formData.get('cierre') as string
    const diasSemana = [0, 1, 2, 3, 4, 5, 6].filter(d => formData.get(`dia_${d}`) === 'on')

    const admin = createAdminClient()
    const { data: current } = await admin
      .from('barberias')
      .select('configuracion')
      .eq('slug', slug)
      .maybeSingle()

    const confActual = (current?.configuracion as Record<string, unknown>) ?? {}
    await admin.from('barberias').update({
      configuracion: { ...confActual, apertura, cierre, diasSemana },
    }).eq('slug', slug)

    revalidatePath(`/${slug}/admin/configuracion`)
    redirect(`/${slug}/admin/configuracion`)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-white mb-6">Configuración de Horario</h1>
      <form action={guardarHorario} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Apertura</label>
            <input
              type="time"
              name="apertura"
              defaultValue={horario.apertura}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-400"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Cierre</label>
            <input
              type="time"
              name="cierre"
              defaultValue={horario.cierre}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        <div>
          <label className="text-zinc-400 text-sm block mb-3">Días hábiles</label>
          <div className="grid grid-cols-7 gap-1">
            {[0,1,2,3,4,5,6].map(d => (
              <label key={d} className="flex flex-col items-center gap-1 cursor-pointer">
                <span className="text-zinc-500 text-xs">{['Do','Lu','Ma','Mi','Ju','Vi','Sa'][d]}</span>
                <input
                  type="checkbox"
                  name={`dia_${d}`}
                  defaultChecked={horario.diasSemana.includes(d)}
                  className="w-5 h-5 accent-yellow-400 rounded"
                />
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition-colors"
        >
          Guardar horario
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verificar que la página carga en `/[slug]/admin/configuracion`**

Navegar manualmente a la URL. Debe mostrar el formulario con valores por defecto (09:00–18:00, Lun–Sáb marcados).

- [ ] **Step 3: Commit**

```bash
git add "barberia-saas/app/[slug]/admin/configuracion/page.tsx"
git commit -m "feat: página admin de configuración de horario"
```

---

### Task 2: Agregar enlace al nav del admin

**Files:**
- Modify: `barberia-saas/app/[slug]/admin/layout.tsx`

- [ ] **Step 1: Agregar item al array navItems**

En `layout.tsx`, línea 12, agregar al array `navItems`:

```typescript
{ href: `/${slug}/admin/configuracion`, label: 'Configuración', icon: '⚙️' },
```

El array completo queda:
```typescript
const navItems = [
  { href: `/${slug}/admin`, label: 'Panel Central', icon: '📊' },
  { href: `/${slug}/admin/clientes`, label: 'Clientes', icon: '👥' },
  { href: `/${slug}/admin/campanas`, label: 'Campañas', icon: '📣' },
  { href: `/${slug}/admin/resumen`, label: 'Resumen Ejecutivo', icon: '📈' },
  { href: `/${slug}/admin/alianzas`, label: 'Alianzas', icon: '🤝' },
  { href: `/${slug}/admin/barberos`, label: 'Barberos', icon: '✂️' },
  { href: `/${slug}/admin/servicios`, label: 'Servicios', icon: '💈' },
  { href: `/${slug}/admin/sugerencias`, label: 'Sugerencias', icon: '💬' },
  { href: `/${slug}/admin/configuracion`, label: 'Configuración', icon: '⚙️' },
]
```

- [ ] **Step 2: Commit**

```bash
git add "barberia-saas/app/[slug]/admin/layout.tsx"
git commit -m "feat: enlace Configuración en nav admin"
```

---

### Task 3: Pasar horario desde la página de reservas hasta BookingWizard

**Files:**
- Modify: `barberia-saas/app/[slug]/reservar/page.tsx`
- Modify: `barberia-saas/components/booking/BookingWizard.tsx`

- [ ] **Step 1: Actualizar `reservar/page.tsx` para leer y pasar `horario`**

```tsx
// app/[slug]/reservar/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BookingWizard } from '@/components/booking/BookingWizard'
import type { Json } from '@/types/database'

interface Barberia {
  id: string
  nombre: string
  logo_url: string | null
  colores: Json
}

interface BarberoData {
  id: string
  nombre: string
  foto_url: string | null
  descripcion: string | null
}

export interface Horario {
  apertura: string
  cierre: string
  diasSemana: number[]
}

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ref?: string }>
}

export default async function ReservarPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { ref } = await searchParams
  const supabase = await createClient()

  const { data } = await supabase
    .from('barberias')
    .select('id, nombre, logo_url, colores, configuracion')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  if (!data) notFound()

  const barberia = data as Barberia
  const conf = (data.configuracion as Record<string, unknown>) ?? {}
  const horario: Horario = {
    apertura: (conf.apertura as string) ?? '09:00',
    cierre: (conf.cierre as string) ?? '18:00',
    diasSemana: (conf.diasSemana as number[]) ?? [1, 2, 3, 4, 5, 6],
  }

  const { data: servicios } = await supabase
    .from('servicios')
    .select('id, nombre, descripcion, duracion_min, precio')
    .eq('barberia_id', barberia.id)
    .eq('activo', true)
    .order('orden')

  const { data: barberos } = await supabase
    .from('barberos')
    .select('id, nombre, foto_url, descripcion')
    .eq('barberia_id', barberia.id)
    .eq('activo', true)

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          {barberia.logo_url && (
            <img src={barberia.logo_url} alt={barberia.nombre} className="h-16 mx-auto mb-3" />
          )}
          <h1 className="text-2xl font-bold">{barberia.nombre}</h1>
          <p className="text-zinc-400 text-sm mt-1">Reserva tu hora</p>
        </div>
        <BookingWizard
          barberia={barberia}
          servicios={servicios ?? []}
          barberos={(barberos ?? []) as unknown as BarberoData[]}
          refCode={ref}
          horario={horario}
        />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Actualizar `BookingWizard.tsx` para aceptar y pasar `horario`**

```tsx
// components/booking/BookingWizard.tsx
'use client'
import { useState } from 'react'
import { ServiceSelector } from './ServiceSelector'
import { BarberSelector } from './BarberSelector'
import { TimeSlotPicker } from './TimeSlotPicker'
import { BookingConfirm } from './BookingConfirm'
import type { Json } from '@/types/database'
import type { Horario } from '@/app/[slug]/reservar/page'

interface Servicio { id: string; nombre: string; descripcion: string | null; duracion_min: number; precio: number }
interface Barbero { id: string; nombre: string; foto_url: string | null; descripcion?: string | null }
interface Barberia { id: string; nombre: string; colores: Json }

interface Props {
  barberia: Barberia
  servicios: Servicio[]
  barberos: Barbero[]
  refCode?: string
  horario: Horario
}

export function BookingWizard({ barberia, servicios, barberos, refCode, horario }: Props) {
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
          horario={horario}
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
```

- [ ] **Step 3: Commit**

```bash
git add "barberia-saas/app/[slug]/reservar/page.tsx" "barberia-saas/components/booking/BookingWizard.tsx"
git commit -m "feat: pasar horario de barbería desde servidor hasta BookingWizard"
```

---

### Task 4: TimeSlotPicker filtra días según diasSemana y pasa horario al hook

**Files:**
- Modify: `barberia-saas/components/booking/TimeSlotPicker.tsx`

- [ ] **Step 1: Actualizar TimeSlotPicker**

```tsx
// components/booking/TimeSlotPicker.tsx
'use client'
import { useState } from 'react'
import { useRealtimeSlots } from '@/hooks/useRealtimeSlots'
import { addDays, format, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Horario } from '@/app/[slug]/reservar/page'

interface Props {
  barberiaId: string
  barberoId: string
  duracionMin: number
  horario: Horario
  onSelect: (fecha: Date, hora: string) => void
  onBack: () => void
}

export function TimeSlotPicker({ barberiaId, barberoId, duracionMin, horario, onSelect, onBack }: Props) {
  const today = startOfDay(new Date())

  // Generar próximos 14 días y filtrar solo los días hábiles configurados
  const allDays = Array.from({ length: 14 }, (_, i) => addDays(today, i))
  const days = allDays.filter(d => horario.diasSemana.includes(d.getDay()))

  const [fecha, setFecha] = useState<Date>(days[0] ?? today)
  const { availableSlots, loading } = useRealtimeSlots(barberiaId, barberoId, fecha, duracionMin, horario)

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
```

- [ ] **Step 2: Commit**

```bash
git add "barberia-saas/components/booking/TimeSlotPicker.tsx"
git commit -m "feat: TimeSlotPicker filtra días según diasSemana del horario"
```

---

### Task 5: useRealtimeSlots usa horario dinámico

**Files:**
- Modify: `barberia-saas/hooks/useRealtimeSlots.ts`

- [ ] **Step 1: Actualizar el hook**

```typescript
// hooks/useRealtimeSlots.ts
'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateSlots, getAvailableSlots } from '@/lib/slots'
import type { Slot } from '@/lib/slots'
import type { Horario } from '@/app/[slug]/reservar/page'

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
  duracionMin: number,
  horario: Horario
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
      const allSlots = generateSlots(horario.apertura, horario.cierre, duracionMin)
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
          const allSlots = generateSlots(horario.apertura, horario.cierre, duracionMin)
          setAvailableSlots(filterPastSlots(getAvailableSlots(allSlots, bookedSlots), fechaStr))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [barberoId, fecha, duracionMin, supabase, horario.apertura, horario.cierre])

  return { availableSlots, loading }
}
```

- [ ] **Step 2: Commit**

```bash
git add "barberia-saas/hooks/useRealtimeSlots.ts"
git commit -m "feat: useRealtimeSlots usa horario dinámico de la barbería"
```

---

### Task 6: Deploy final

- [ ] **Step 1: Push y deploy**

```bash
git push origin main
cd barberia-saas && npx vercel --prod --yes
```

- [ ] **Step 2: Verificar en producción**
  - Ir a `/[slug]/admin/configuracion` → formulario visible con valores actuales
  - Cambiar horario a 10:00–17:00 y quitar domingo → guardar
  - Ir a `/[slug]/reservar` → el calendario no muestra domingo, los slots van de 10:00 a 17:00
