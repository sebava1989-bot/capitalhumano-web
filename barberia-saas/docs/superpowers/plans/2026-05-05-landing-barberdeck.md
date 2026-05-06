# barberDesk Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la página raíz placeholder con una landing page de ventas completa para barberDesk, más una página de guión imprimible.

**Architecture:** La landing page vive en `app/page.tsx` y usa componentes en `components/landing/`. La sección de contacto redirige a WhatsApp con mensaje pre-llenado (sin backend). El guión de presentación vive en `app/guion/page.tsx` como página imprimible.

**Tech Stack:** Next.js 16 App Router, TailwindCSS 4, React 19, lucide-react, Vitest + @testing-library/react

---

## File Map

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `app/page.tsx` | Modificar | Ensamblado de la landing page |
| `app/guion/page.tsx` | Crear | Página imprimible del guión de ventas |
| `components/landing/Hero.tsx` | Crear | Sección hero con titular y CTA |
| `components/landing/BeforeAfter.tsx` | Crear | Tarjetas antes/después |
| `components/landing/Features.tsx` | Crear | Features de la app con íconos |
| `components/landing/Pricing.tsx` | Crear | Sección precio + CTA final |
| `components/landing/DemoButton.tsx` | Crear | Botón WhatsApp con mensaje pre-llenado |
| `tests/landing/Hero.test.tsx` | Crear | Tests render Hero |
| `tests/landing/BeforeAfter.test.tsx` | Crear | Tests render BeforeAfter |
| `tests/landing/Features.test.tsx` | Crear | Tests render Features |
| `tests/landing/Pricing.test.tsx` | Crear | Tests render Pricing |

---

## Task 1: DemoButton — botón de contacto WhatsApp

**Files:**
- Create: `components/landing/DemoButton.tsx`
- Create: `tests/landing/DemoButton.test.tsx`

- [ ] **Step 1: Crear el directorio de tests**

```bash
mkdir -p barberia-saas/tests/landing
```

- [ ] **Step 2: Escribir el test**

```tsx
// tests/landing/DemoButton.test.tsx
import { render, screen } from '@testing-library/react'
import { DemoButton } from '@/components/landing/DemoButton'

describe('DemoButton', () => {
  it('renders with correct WhatsApp href', () => {
    render(<DemoButton phone="56912345678" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me/56912345678')
    )
  })

  it('renders label text', () => {
    render(<DemoButton phone="56912345678" />)
    expect(screen.getByText(/demo/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Ejecutar para confirmar que falla**

```bash
cd barberia-saas && npx vitest run tests/landing/DemoButton.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/landing/DemoButton'`

- [ ] **Step 4: Crear el componente**

```tsx
// components/landing/DemoButton.tsx
interface DemoButtonProps {
  phone: string
  className?: string
}

export function DemoButton({ phone, className = '' }: DemoButtonProps) {
  const message = encodeURIComponent(
    'Hola, quiero agendar una demo gratuita de barberDesk para mi barbería.'
  )
  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block rounded-full bg-green-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-green-600 ${className}`}
    >
      Agendar demo gratuita
    </a>
  )
}
```

- [ ] **Step 5: Ejecutar tests para confirmar que pasan**

```bash
cd barberia-saas && npx vitest run tests/landing/DemoButton.test.tsx
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd barberia-saas && git add components/landing/DemoButton.tsx tests/landing/DemoButton.test.tsx
git commit -m "feat: DemoButton WhatsApp con mensaje pre-llenado"
```

---

## Task 2: Hero section

**Files:**
- Create: `components/landing/Hero.tsx`
- Create: `tests/landing/Hero.test.tsx`

- [ ] **Step 1: Escribir el test**

```tsx
// tests/landing/Hero.test.tsx
import { render, screen } from '@testing-library/react'
import { Hero } from '@/components/landing/Hero'

describe('Hero', () => {
  it('renders the main headline', () => {
    render(<Hero phone="56912345678" />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders the demo CTA link', () => {
    render(<Hero phone="56912345678" />)
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me/56912345678')
    )
  })
})
```

- [ ] **Step 2: Ejecutar para confirmar que falla**

```bash
cd barberia-saas && npx vitest run tests/landing/Hero.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Crear el componente**

```tsx
// components/landing/Hero.tsx
import { DemoButton } from './DemoButton'

interface HeroProps {
  phone: string
}

export function Hero({ phone }: HeroProps) {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center bg-zinc-900 px-6 py-24 text-center text-white">
      <span className="mb-4 rounded-full bg-zinc-700 px-4 py-1 text-sm font-medium text-zinc-300">
        barberDesk
      </span>
      <h1 className="mb-6 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
        Don Rodrigo perdía 2 horas al día en WhatsApp.{' '}
        <span className="text-amber-400">Ahora su barbería se llena sola.</span>
      </h1>
      <p className="mb-10 max-w-xl text-xl text-zinc-300">
        Sistema de reservas, clientes y marketing para tu barbería —{' '}
        <span className="font-bold text-white">$15.000/mes.</span>
      </p>
      <DemoButton phone={phone} />
    </section>
  )
}
```

- [ ] **Step 4: Ejecutar tests**

```bash
cd barberia-saas && npx vitest run tests/landing/Hero.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd barberia-saas && git add components/landing/Hero.tsx tests/landing/Hero.test.tsx
git commit -m "feat: Hero section barberDesk landing"
```

---

## Task 3: BeforeAfter — tarjetas antes/después

**Files:**
- Create: `components/landing/BeforeAfter.tsx`
- Create: `tests/landing/BeforeAfter.test.tsx`

- [ ] **Step 1: Escribir el test**

```tsx
// tests/landing/BeforeAfter.test.tsx
import { render, screen } from '@testing-library/react'
import { BeforeAfter } from '@/components/landing/BeforeAfter'

describe('BeforeAfter', () => {
  it('renders before and after headings', () => {
    render(<BeforeAfter />)
    expect(screen.getByText(/sin barberdeck/i)).toBeInTheDocument()
    expect(screen.getByText(/con barberdeck/i)).toBeInTheDocument()
  })

  it('renders 3 pain point cards', () => {
    render(<BeforeAfter />)
    expect(screen.getAllByRole('listitem')).toHaveLength(6) // 3 antes + 3 después
  })
})
```

- [ ] **Step 2: Ejecutar para confirmar que falla**

```bash
cd barberia-saas && npx vitest run tests/landing/BeforeAfter.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Crear el componente**

```tsx
// components/landing/BeforeAfter.tsx
const before = [
  { icon: '📱', text: 'Reservas por WhatsApp que se pierden o se olvidan' },
  { icon: '📊', text: 'Sin idea de qué servicio vende más ni quién es tu mejor cliente' },
  { icon: '😶', text: 'Clientes que no vuelven porque nadie los llama' },
]

const after = [
  { icon: '✅', text: 'Reservas online 24/7 desde el celular del cliente' },
  { icon: '✅', text: 'Panel con estadísticas reales de tu negocio' },
  { icon: '✅', text: 'Sistema de referidos y descuentos automáticos que fideliza' },
]

export function BeforeAfter() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
        <div>
          <h2 className="mb-6 text-2xl font-bold text-zinc-800">Sin barberDesk</h2>
          <ul className="space-y-4">
            {before.map((item) => (
              <li key={item.text} className="flex items-start gap-3 text-zinc-600">
                <span className="text-2xl">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-6 text-2xl font-bold text-zinc-800">Con barberDesk</h2>
          <ul className="space-y-4">
            {after.map((item) => (
              <li key={item.text} className="flex items-start gap-3 text-zinc-700">
                <span className="text-2xl">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Ejecutar tests**

```bash
cd barberia-saas && npx vitest run tests/landing/BeforeAfter.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd barberia-saas && git add components/landing/BeforeAfter.tsx tests/landing/BeforeAfter.test.tsx
git commit -m "feat: BeforeAfter section landing barberDesk"
```

---

## Task 4: Features section

**Files:**
- Create: `components/landing/Features.tsx`
- Create: `tests/landing/Features.test.tsx`

- [ ] **Step 1: Escribir el test**

```tsx
// tests/landing/Features.test.tsx
import { render, screen } from '@testing-library/react'
import { Features } from '@/components/landing/Features'

describe('Features', () => {
  it('renders section heading', () => {
    render(<Features />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('renders 4 feature cards', () => {
    render(<Features />)
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })
})
```

- [ ] **Step 2: Ejecutar para confirmar que falla**

```bash
cd barberia-saas && npx vitest run tests/landing/Features.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Crear el componente**

```tsx
// components/landing/Features.tsx
const features = [
  {
    icon: '📅',
    title: 'Reserva en 3 pasos',
    desc: 'El cliente elige barbero, servicio y hora desde su celular. Sin llamadas, sin WhatsApp.',
  },
  {
    icon: '📲',
    title: 'App admin en tu bolsillo',
    desc: 'Ve la agenda del día, gestiona clientes y servicios desde la app móvil.',
  },
  {
    icon: '🔔',
    title: 'Recordatorios automáticos',
    desc: 'Emails automáticos 24h antes de cada reserva. Cero no-shows.',
  },
  {
    icon: '🎯',
    title: 'Campañas con IA',
    desc: 'Manda descuentos personalizados a tus clientes con un clic. La IA escribe los mensajes.',
  },
]

export function Features() {
  return (
    <section className="bg-zinc-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-zinc-900">
          Así funciona barberDesk
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <span className="mb-3 block text-4xl">{f.icon}</span>
              <h3 className="mb-2 font-bold text-zinc-900">{f.title}</h3>
              <p className="text-sm text-zinc-500">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Ejecutar tests**

```bash
cd barberia-saas && npx vitest run tests/landing/Features.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd barberia-saas && git add components/landing/Features.tsx tests/landing/Features.test.tsx
git commit -m "feat: Features section landing barberDesk"
```

---

## Task 5: Pricing + CTA final

**Files:**
- Create: `components/landing/Pricing.tsx`
- Create: `tests/landing/Pricing.test.tsx`

- [ ] **Step 1: Escribir el test**

```tsx
// tests/landing/Pricing.test.tsx
import { render, screen } from '@testing-library/react'
import { Pricing } from '@/components/landing/Pricing'

describe('Pricing', () => {
  it('renders the price', () => {
    render(<Pricing phone="56912345678" />)
    expect(screen.getByText(/15\.000/)).toBeInTheDocument()
  })

  it('renders the no-contract disclaimer', () => {
    render(<Pricing phone="56912345678" />)
    expect(screen.getByText(/sin contrato/i)).toBeInTheDocument()
  })

  it('renders CTA link to WhatsApp', () => {
    render(<Pricing phone="56912345678" />)
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me/56912345678')
    )
  })
})
```

- [ ] **Step 2: Ejecutar para confirmar que falla**

```bash
cd barberia-saas && npx vitest run tests/landing/Pricing.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Crear el componente**

```tsx
// components/landing/Pricing.tsx
import { DemoButton } from './DemoButton'

interface PricingProps {
  phone: string
}

export function Pricing({ phone }: PricingProps) {
  return (
    <section className="bg-zinc-900 px-6 py-24 text-center text-white">
      <h2 className="mb-4 text-3xl font-extrabold sm:text-4xl">
        Todo esto por{' '}
        <span className="text-amber-400">$15.000 al mes.</span>
      </h2>
      <p className="mb-10 text-lg text-zinc-400">
        Sin contrato. Sin letra chica. Si no te sirve, lo cancelas.
      </p>
      <p className="mb-8 text-2xl font-bold">
        ¿Le das una oportunidad a tu barbería?
      </p>
      <DemoButton phone={phone} />
    </section>
  )
}
```

- [ ] **Step 4: Ejecutar tests**

```bash
cd barberia-saas && npx vitest run tests/landing/Pricing.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd barberia-saas && git add components/landing/Pricing.tsx tests/landing/Pricing.test.tsx
git commit -m "feat: Pricing section landing barberDesk"
```

---

## Task 6: Ensamblar la landing en app/page.tsx

**Files:**
- Modify: `app/page.tsx`

> No hay tests para el ensamblado — los componentes individuales ya tienen cobertura.

- [ ] **Step 1: Reemplazar el contenido de app/page.tsx**

```tsx
// app/page.tsx
import { Hero } from '@/components/landing/Hero'
import { BeforeAfter } from '@/components/landing/BeforeAfter'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'

const DEMO_PHONE = '56912345678' // TODO: reemplazar con número real de contacto

export default function RootPage() {
  return (
    <main>
      <Hero phone={DEMO_PHONE} />
      <BeforeAfter />
      <Features />
      <Pricing phone={DEMO_PHONE} />
    </main>
  )
}
```

- [ ] **Step 2: Ejecutar todos los tests**

```bash
cd barberia-saas && npx vitest run tests/landing/
```

Expected: todos PASS

- [ ] **Step 3: Levantar dev server y verificar visualmente**

```bash
cd barberia-saas && npm run dev
```

Abrir http://localhost:3000 y verificar:
- Hero con titular y botón verde WhatsApp
- Sección antes/después con 3 tarjetas cada lado
- 4 cards de features
- Sección precio con CTA final

- [ ] **Step 4: Commit**

```bash
cd barberia-saas && git add app/page.tsx
git commit -m "feat: landing page barberDesk en ruta raíz"
```

---

## Task 7: Página de guión imprimible (app/guion/page.tsx)

**Files:**
- Create: `app/guion/page.tsx`

> Esta página es solo contenido estático para imprimir/compartir. No requiere tests.

- [ ] **Step 1: Crear la página**

```tsx
// app/guion/page.tsx
export const metadata = {
  title: 'Guión de ventas — barberDesk',
}

const sections = [
  {
    time: '0:00 – 0:30',
    title: 'Apertura',
    text: `Cuéntame una cosa — ¿cuántos mensajes de WhatsApp recibiste esta semana solo para coordinar horas? ¿10? ¿20? ¿Más?

Eso es tiempo que no estás cortando pelo. Tiempo que no estás ganando plata.`,
  },
  {
    time: '0:30 – 1:30',
    title: 'La Historia',
    text: `Don Rodrigo tiene una barbería en Maipú. Buena clientela, buenos barberos. Pero vivía pegado al celular respondiendo mensajes, y aun así la agenda tenía huecos.

No sabía cuál de sus servicios dejaba más plata. No sabía quiénes eran sus clientes más fieles. Y cuando un cliente dejaba de venir... simplemente desaparecía.

Hoy Don Rodrigo abre el panel en el celular, ve la agenda del día, sabe qué servicios están volando y manda descuentos a sus clientes con un clic. Todo desde la app.`,
  },
  {
    time: '1:30 – 2:30',
    title: 'La Solución',
    text: `Esto es barberDesk. Un sistema completo para tu barbería:
— Tus clientes reservan online, solos, a cualquier hora.
— Tú ves todo en un panel: agenda, estadísticas, clientes.
— El sistema manda recordatorios automáticos para que nadie se olvide.
— Y cuando quieres llenar la semana, mandas una campaña de descuentos en dos clics.`,
  },
  {
    time: '2:30 – 2:50',
    title: 'El Precio',
    text: `¿Cuánto cuesta todo esto? Quince mil pesos al mes. Sin contrato, sin letra chica. Si no te sirve, lo cancelas. Pero te apuesto que no vas a querer.`,
  },
  {
    time: '2:50 – 3:00',
    title: 'Cierre',
    text: `¿Le damos una oportunidad a tu barbería? Te armo una demo gratis esta semana y lo ves funcionando con tu nombre.`,
  },
]

export default function GuionPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 print:py-4">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-zinc-900">barberDesk</h1>
        <p className="mt-1 text-zinc-500">Guión de presentación de ventas (~3 min)</p>
      </div>
      <div className="space-y-8">
        {sections.map((s) => (
          <div key={s.title} className="border-l-4 border-amber-400 pl-5">
            <div className="mb-1 flex items-baseline gap-3">
              <span className="text-lg font-bold text-zinc-900">{s.title}</span>
              <span className="text-sm text-zinc-400">{s.time}</span>
            </div>
            <p className="whitespace-pre-line text-zinc-700">{s.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 rounded-xl bg-zinc-100 p-6 text-center print:hidden">
        <p className="text-zinc-500 text-sm">Para imprimir: Ctrl+P / Cmd+P</p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verificar en el navegador**

```bash
cd barberia-saas && npm run dev
```

Abrir http://localhost:3000/guion y verificar que el guión se ve correcto y es imprimible.

- [ ] **Step 3: Commit**

```bash
cd barberia-saas && git add app/guion/page.tsx
git commit -m "feat: página de guión de ventas imprimible barberDesk"
```

---

## Task 8: Build final y verificación

- [ ] **Step 1: Ejecutar todos los tests**

```bash
cd barberia-saas && npx vitest run
```

Expected: todos PASS

- [ ] **Step 2: Build de producción**

```bash
cd barberia-saas && npm run build
```

Expected: sin errores de TypeScript ni build

- [ ] **Step 3: Reemplazar número de demo**

En `app/page.tsx`, reemplazar `56912345678` con el número real de WhatsApp de contacto para demos.

- [ ] **Step 4: Commit final**

```bash
cd barberia-saas && git add app/page.tsx
git commit -m "chore: número WhatsApp real para demos barberDesk"
```
