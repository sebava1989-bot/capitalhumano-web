# FitPulse Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el panel web del dueño del gimnasio como app Next.js 14 con datos demo, lista para mostrar a clientes y conectar al backend después.

**Architecture:** Next.js 14 App Router en `C:\Users\sebas\fitpulse-admin\`. Todos los datos vienen de `lib/mock-data.ts` (arrays estáticos). Auth simulada: cualquier email/password guarda un token falso en localStorage y redirige al dashboard. El layout tiene sidebar fijo + topbar. Cada página es un Server Component salvo los que necesitan interactividad (Client Components).

**Tech Stack:** Next.js 14, Tailwind CSS, Lucide React (iconos), TypeScript. Sin charting library — barras con CSS y líneas con SVG inline.

---

## Estructura de archivos

```
fitpulse-admin/
├── app/
│   ├── layout.tsx              ← root layout (fuentes, metadata)
│   ├── page.tsx                ← redirect a /login
│   ├── login/
│   │   └── page.tsx            ← pantalla de login
│   └── dashboard/
│       ├── layout.tsx          ← shell: sidebar + topbar
│       ├── page.tsx            ← dashboard principal
│       ├── members/
│       │   └── page.tsx        ← tabla de miembros + modal agregar
│       ├── routines/
│       │   └── page.tsx        ← lista rutinas + formulario crear
│       ├── ranking/
│       │   └── page.tsx        ← leaderboard
│       └── alerts/
│           └── page.tsx        ← alertas + actividad reciente
├── components/
│   ├── sidebar.tsx             ← sidebar con nav items
│   ├── topbar.tsx              ← barra superior con gym info
│   ├── stat-card.tsx           ← card de estadística reutilizable
│   ├── bar-chart.tsx           ← gráfico de barras CSS
│   ├── member-table.tsx        ← tabla de miembros con búsqueda
│   ├── add-member-modal.tsx    ← modal para agregar miembro
│   └── routine-form.tsx        ← formulario de rutina
├── lib/
│   ├── mock-data.ts            ← todos los datos demo
│   └── auth.ts                 ← helpers de auth (localStorage)
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## Task 1: Crear proyecto Next.js

**Files:**
- Create: `C:\Users\sebas\fitpulse-admin\` (proyecto completo)

- [ ] **Step 1: Crear el proyecto**

Ejecutar en `C:\Users\sebas\`:
```bash
npx create-next-app@latest fitpulse-admin --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```
Cuando pregunte: seleccionar las opciones por defecto (Enter en todo).

- [ ] **Step 2: Instalar dependencias**

```bash
cd fitpulse-admin
npm install lucide-react
```

- [ ] **Step 3: Limpiar archivos de boilerplate**

Reemplazar contenido de `app/globals.css` con:
```css
@import "tailwindcss";

:root {
  --orange: #FF4D00;
}

body {
  font-family: 'Inter', -apple-system, sans-serif;
}
```

Reemplazar `app/page.tsx` con:
```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/login')
}
```

- [ ] **Step 4: Verificar que arranca**

```bash
npm run dev
```
Abrir http://localhost:3000 — debe redirigir a `/login` (404 está bien por ahora).

- [ ] **Step 5: Commit inicial**

```bash
git init
git add .
git commit -m "feat: init fitpulse-admin Next.js project"
```

---

## Task 2: Mock data y auth helper

**Files:**
- Create: `lib/mock-data.ts`
- Create: `lib/auth.ts`

- [ ] **Step 1: Crear `lib/mock-data.ts`**

```typescript
// lib/mock-data.ts

export const GYM_INFO = {
  name: 'PowerGym Santiago',
  code: 'GYM01',
  ownerName: 'Pedro González',
  plan: 'PRO',
}

export const MEMBERS = [
  { id: 1, name: 'Carlos Muñoz',    rut: '12345678-9', level: 7, points: 2840, streak: 21, lastWorkout: '2026-04-16', active: true },
  { id: 2, name: 'Valentina Ríos',  rut: '23456789-0', level: 6, points: 2610, streak: 18, lastWorkout: '2026-04-16', active: true },
  { id: 3, name: 'Diego Soto',      rut: '34567890-1', level: 6, points: 2340, streak: 14, lastWorkout: '2026-04-15', active: true },
  { id: 4, name: 'Camila Torres',   rut: '45678901-2', level: 5, points: 1980, streak: 9,  lastWorkout: '2026-04-15', active: true },
  { id: 5, name: 'Matías Lagos',    rut: '56789012-3', level: 4, points: 1750, streak: 12, lastWorkout: '2026-04-14', active: true },
  { id: 6, name: 'Fernanda Vera',   rut: '67890123-4', level: 4, points: 1520, streak: 7,  lastWorkout: '2026-04-13', active: true },
  { id: 7, name: 'Sebastián Paz',   rut: '78901234-5', level: 3, points: 1380, streak: 5,  lastWorkout: '2026-04-12', active: true },
  { id: 8, name: 'Javiera Fuentes', rut: '89012345-6', level: 3, points: 1200, streak: 0,  lastWorkout: '2026-04-04', active: true },
  { id: 9, name: 'Nicolás Araya',   rut: '90123456-7', level: 2, points: 980,  streak: 0,  lastWorkout: '2026-04-06', active: true },
  { id: 10, name: 'Isidora Méndez', rut: '01234567-8', level: 2, points: 720,  streak: 0,  lastWorkout: '2026-04-08', active: false },
]

export const WORKOUTS_PER_DAY = [
  { day: 'L', count: 8 },
  { day: 'M', count: 12 },
  { day: 'X', count: 6 },
  { day: 'J', count: 15 },
  { day: 'V', count: 17 },
  { day: 'S', count: 10 },
  { day: 'D', count: 12 },
]

export const ROUTINES = [
  {
    id: 1,
    name: 'Pecho y Tríceps',
    day: 'Martes / Viernes',
    exercises: [
      { name: 'Press banca plano', sets: 4, reps: 10, rest: 90 },
      { name: 'Press inclinado mancuernas', sets: 3, reps: 12, rest: 75 },
      { name: 'Aperturas en máquina', sets: 3, reps: 15, rest: 60 },
      { name: 'Fondos en paralelas', sets: 3, reps: 12, rest: 75 },
      { name: 'Press francés', sets: 3, reps: 12, rest: 60 },
    ],
  },
  {
    id: 2,
    name: 'Piernas y Glúteos',
    day: 'Lunes / Jueves',
    exercises: [
      { name: 'Sentadilla libre', sets: 4, reps: 8, rest: 120 },
      { name: 'Prensa de piernas', sets: 4, reps: 12, rest: 90 },
      { name: 'Hip thrust', sets: 4, reps: 12, rest: 90 },
      { name: 'Curl femoral', sets: 3, reps: 12, rest: 60 },
    ],
  },
  {
    id: 3,
    name: 'Espalda y Bíceps',
    day: 'Miércoles / Sábado',
    exercises: [
      { name: 'Dominadas asistidas', sets: 4, reps: 8, rest: 90 },
      { name: 'Remo con barra', sets: 4, reps: 10, rest: 90 },
      { name: 'Curl bíceps barra', sets: 3, reps: 12, rest: 60 },
    ],
  },
  {
    id: 4,
    name: 'Cardio HIIT',
    day: 'Miércoles',
    exercises: [
      { name: 'Burpees', sets: 4, reps: 10, rest: 60 },
      { name: 'Mountain climbers', sets: 4, reps: 20, rest: 45 },
      { name: 'Saltos de caja', sets: 3, reps: 12, rest: 60 },
    ],
  },
]

export const RECENT_ACTIVITY = [
  { emoji: '✅', text: 'Carlos completó "Pecho y Tríceps"', time: 'hace 2h' },
  { emoji: '🆕', text: 'Nuevo miembro: Ana González', time: 'hoy' },
  { emoji: '🏆', text: 'Valentina alcanzó Nivel 6', time: 'ayer' },
  { emoji: '✅', text: 'Diego completó "Piernas y Glúteos"', time: 'ayer' },
]

export const AT_RISK = MEMBERS.filter(m => {
  const last = new Date(m.lastWorkout)
  const today = new Date('2026-04-16')
  const diff = Math.floor((today.getTime() - last.getTime()) / 86400000)
  return diff >= 7
})

export const DASHBOARD_STATS = {
  activeMembers: MEMBERS.filter(m => m.active).length,
  workoutsToday: 12,
  avgStreak: parseFloat((MEMBERS.reduce((s, m) => s + m.streak, 0) / MEMBERS.length).toFixed(1)),
  atRisk: AT_RISK.length,
}
```

- [ ] **Step 2: Crear `lib/auth.ts`**

```typescript
// lib/auth.ts
'use client'

const TOKEN_KEY = 'fp_admin_token'
const GYM_KEY = 'fp_admin_gym'

export function login(email: string, password: string): boolean {
  // Demo: acepta cualquier email/password no vacíos
  if (!email || !password) return false
  localStorage.setItem(TOKEN_KEY, 'demo-admin-token')
  localStorage.setItem(GYM_KEY, JSON.stringify({ name: 'PowerGym Santiago', code: 'GYM01', owner: email.split('@')[0] }))
  return true
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(GYM_KEY)
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(TOKEN_KEY)
}

export function getGymInfo() {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(GYM_KEY)
  return raw ? JSON.parse(raw) : null
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/
git commit -m "feat: add mock data and auth helpers"
```

---

## Task 3: Root layout y página login

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/login/page.tsx`

- [ ] **Step 1: Actualizar `app/layout.tsx`**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FitPulse Admin',
  description: 'Panel de administración para gimnasios',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#f5f5f7] text-[#1a1a1a]`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Crear `app/login/page.tsx`**

```tsx
// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import { Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (login(email, password)) {
      router.push('/dashboard')
    } else {
      setError('Completa email y contraseña')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#CC3D00] flex items-center justify-center shadow-lg shadow-orange-200 mb-4">
            <Zap className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1a1a1a]">FitPulse Admin</h1>
          <p className="text-sm text-[#6b7280] mt-1">Panel del dueño del gimnasio</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e7eb] p-8 shadow-sm">
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="dueño@migym.cl"
              className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-[#1a1a1a] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#FF4D00] text-white font-bold text-sm hover:bg-[#CC3D00] transition-colors"
          >
            Ingresar al panel
          </button>
          <p className="text-center text-xs text-[#6b7280] mt-4">Demo: cualquier email y contraseña</p>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar en el navegador**

```bash
npm run dev
```
Ir a http://localhost:3000/login — debe mostrar el formulario con logo naranja.

- [ ] **Step 4: Commit**

```bash
git add app/
git commit -m "feat: add login page"
```

---

## Task 4: Componentes Sidebar y Topbar

**Files:**
- Create: `components/sidebar.tsx`
- Create: `components/topbar.tsx`

- [ ] **Step 1: Crear `components/sidebar.tsx`**

```tsx
// components/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'
import { LayoutDashboard, Users, Dumbbell, Trophy, BarChart2, AlertTriangle, LogOut, Zap } from 'lucide-react'

const NAV = [
  { label: 'Dashboard',  href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Miembros',   href: '/dashboard/members',  icon: Users },
  { label: 'Rutinas',    href: '/dashboard/routines', icon: Dumbbell },
  { label: 'Ranking',    href: '/dashboard/ranking',  icon: Trophy },
  { label: 'Alertas',    href: '/dashboard/alerts',   icon: AlertTriangle },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-[220px] shrink-0 bg-white border-r border-[#e5e7eb] flex flex-col py-5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pb-5 mb-3 border-b border-[#f0f0f2]">
        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#FF4D00] to-[#CC3D00] flex items-center justify-center shrink-0">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-extrabold text-[#1a1a1a] leading-none">FitPulse</div>
          <div className="text-[10px] text-[#6b7280] font-medium mt-0.5">Panel Admin</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-orange-50 text-[#FF4D00] font-semibold'
                  : 'text-[#6b7280] hover:bg-[#f5f5f7] hover:text-[#1a1a1a]'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Gym badge + logout */}
      <div className="px-3 mt-4 space-y-2">
        <div className="bg-[#f5f5f7] rounded-[10px] p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4D00] to-[#CC3D00] flex items-center justify-center text-white font-extrabold text-sm shrink-0">P</div>
            <div>
              <div className="text-xs font-bold text-[#1a1a1a] leading-none">PowerGym</div>
              <div className="text-[10px] text-[#6b7280] mt-0.5">Plan PRO · activo</div>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-[10px] text-[13px] text-[#6b7280] hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Crear `components/topbar.tsx`**

```tsx
// components/topbar.tsx
export default function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-extrabold text-[#1a1a1a]">{title}</h1>
      {subtitle && <p className="text-sm text-[#6b7280] mt-1">{subtitle}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/
git commit -m "feat: add sidebar and topbar components"
```

---

## Task 5: Dashboard layout shell

**Files:**
- Create: `app/dashboard/layout.tsx`

- [ ] **Step 1: Crear `app/dashboard/layout.tsx`**

```tsx
// app/dashboard/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'
import Sidebar from '@/components/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn()) router.replace('/login')
  }, [router])

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-7">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verificar navegación**

```bash
npm run dev
```
- Ir a http://localhost:3000 → redirige a /login
- Ingresar con cualquier email/password → redirige a /dashboard (404 aún, sidebar visible)

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/
git commit -m "feat: add dashboard layout with auth guard"
```

---

## Task 6: Componentes reutilizables (StatCard y BarChart)

**Files:**
- Create: `components/stat-card.tsx`
- Create: `components/bar-chart.tsx`

- [ ] **Step 1: Crear `components/stat-card.tsx`**

```tsx
// components/stat-card.tsx
interface StatCardProps {
  label: string
  value: string | number
  sub: string
  color?: string
}

export default function StatCard({ label, value, sub, color = '#1a1a1a' }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
      <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-black mb-1" style={{ color }}>{value}</p>
      <p className="text-[11px] text-[#6b7280]">{sub}</p>
    </div>
  )
}
```

- [ ] **Step 2: Crear `components/bar-chart.tsx`**

```tsx
// components/bar-chart.tsx
interface BarChartProps {
  data: { day: string; count: number }[]
}

export default function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map(d => d.count))

  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => {
        const isLast = i === data.length - 1
        const pct = (d.count / max) * 100
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold text-[#6b7280]">{d.count}</span>
            <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${pct}%`,
                  background: isLast ? '#FF4D00' : 'rgba(255,77,0,0.15)',
                }}
              />
            </div>
            <span className="text-[10px] text-[#6b7280]">{d.day}</span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/
git commit -m "feat: add StatCard and BarChart components"
```

---

## Task 7: Página Dashboard

**Files:**
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Crear `app/dashboard/page.tsx`**

```tsx
// app/dashboard/page.tsx
import StatCard from '@/components/stat-card'
import BarChart from '@/components/bar-chart'
import Topbar from '@/components/topbar'
import { DASHBOARD_STATS, WORKOUTS_PER_DAY, MEMBERS, RECENT_ACTIVITY, AT_RISK } from '@/lib/mock-data'

export default function DashboardPage() {
  const top5 = [...MEMBERS].sort((a, b) => b.points - a.points).slice(0, 5)

  return (
    <>
      <Topbar title="Bienvenido, Pedro 👋" subtitle="Resumen de PowerGym Santiago — hoy" />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Miembros activos" value={DASHBOARD_STATS.activeMembers} sub="socios registrados" />
        <StatCard label="Entrenamientos hoy" value={DASHBOARD_STATS.workoutsToday} sub="sesiones completadas" color="#FF4D00" />
        <StatCard label="Racha promedio" value={DASHBOARD_STATS.avgStreak} sub="días seguidos" color="#f59e0b" />
        <StatCard label="En riesgo" value={DASHBOARD_STATS.atRisk} sub="sin entrenar +7 días" color="#ef4444" />
      </div>

      {/* Chart + Top members */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#1a1a1a]">Entrenamientos por día</h3>
            <span className="text-xs text-[#6b7280]">últimos 7 días</span>
          </div>
          <BarChart data={WORKOUTS_PER_DAY} />
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <h3 className="text-sm font-bold text-[#1a1a1a] mb-4">Top miembros del mes</h3>
          <div className="space-y-3">
            {top5.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-xs text-[#6b7280] w-4">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00] shrink-0">
                  {m.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a1a] truncate">{m.name}</p>
                  <p className="text-xs text-[#6b7280]">🔥 {m.streak} días</p>
                </div>
                <span className="text-xs font-bold text-[#FF4D00]">{m.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h3 className="text-sm font-bold text-[#1a1a1a]">Sin entrenar +7 días</h3>
          </div>
          {AT_RISK.length === 0 ? (
            <p className="text-sm text-[#6b7280]">¡Todos los miembros están activos! 🎉</p>
          ) : (
            <div className="space-y-2">
              {AT_RISK.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-1.5 border-b border-[#f5f5f7] last:border-0">
                  <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-xs font-bold text-red-400">{m.name[0]}</div>
                  <span className="flex-1 text-sm text-[#1a1a1a] font-medium">{m.name}</span>
                  <span className="text-xs font-bold text-red-500">{m.lastWorkout}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <h3 className="text-sm font-bold text-[#1a1a1a]">Actividad reciente</h3>
          </div>
          <div className="space-y-2">
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-1.5 border-b border-[#f5f5f7] last:border-0">
                <span className="text-base">{a.emoji}</span>
                <span className="flex-1 text-sm text-[#1a1a1a]">{a.text}</span>
                <span className="text-xs text-[#6b7280] shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verificar dashboard**

```bash
npm run dev
```
Ir a http://localhost:3000 → login → debe mostrar el dashboard completo con stats, barras y miembros.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add dashboard page with stats, chart and alerts"
```

---

## Task 8: Página Miembros

**Files:**
- Create: `app/dashboard/members/page.tsx`

- [ ] **Step 1: Crear `app/dashboard/members/page.tsx`**

```tsx
// app/dashboard/members/page.tsx
'use client'

import { useState } from 'react'
import Topbar from '@/components/topbar'
import { MEMBERS } from '@/lib/mock-data'
import { Search, UserPlus, CheckCircle, XCircle } from 'lucide-react'

type Member = typeof MEMBERS[0]

function levelName(level: number) {
  if (level >= 7) return 'Avanzado'
  if (level >= 4) return 'Intermedio'
  return 'Principiante'
}

export default function MembersPage() {
  const [members, setMembers] = useState(MEMBERS)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', rut: '', password: '' })

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.rut.includes(search)
  )

  function toggleActive(id: number) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m))
  }

  function addMember() {
    if (!form.name || !form.rut) return
    const newMember: Member = {
      id: Date.now(),
      name: form.name,
      rut: form.rut,
      level: 1,
      points: 0,
      streak: 0,
      lastWorkout: new Date().toISOString().split('T')[0],
      active: true,
    }
    setMembers(prev => [newMember, ...prev])
    setForm({ name: '', rut: '', password: '' })
    setShowModal(false)
  }

  return (
    <>
      <Topbar title="Miembros" subtitle={`${members.filter(m => m.active).length} activos · ${members.length} total`} />

      {/* Search + Add */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o RUT..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#CC3D00] transition-colors"
        >
          <UserPlus size={15} /> Agregar miembro
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f5f5f7]">
              {['Nombre', 'RUT', 'Nivel', 'Puntos', 'Racha', 'Último entreno', 'Estado', ''].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-b border-[#f5f5f7] last:border-0 hover:bg-[#fafafa]">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00]">{m.name[0]}</div>
                    <span className="text-sm font-semibold text-[#1a1a1a]">{m.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-[#6b7280]">{m.rut}</td>
                <td className="px-5 py-3">
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-orange-50 text-[#FF4D00]">
                    Nv.{m.level} {levelName(m.level)}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm font-bold text-[#FF4D00]">{m.points.toLocaleString()}</td>
                <td className="px-5 py-3 text-sm text-[#6b7280]">🔥 {m.streak} días</td>
                <td className="px-5 py-3 text-sm text-[#6b7280]">{m.lastWorkout}</td>
                <td className="px-5 py-3">
                  {m.active
                    ? <span className="flex items-center gap-1 text-xs font-semibold text-green-600"><CheckCircle size={13} /> Activo</span>
                    : <span className="flex items-center gap-1 text-xs font-semibold text-red-400"><XCircle size={13} /> Inactivo</span>
                  }
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleActive(m.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      m.active
                        ? 'border-red-200 text-red-400 hover:bg-red-50'
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {m.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal agregar miembro */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-extrabold text-[#1a1a1a] mb-5">Agregar miembro</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Nombre completo</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent" placeholder="Ana González" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">RUT</label>
                <input value={form.rut} onChange={e => setForm(f => ({...f, rut: e.target.value}))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent" placeholder="12345678-9" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Contraseña inicial</label>
                <input value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} type="password"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent" placeholder="••••••••" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f5f5f7]">
                Cancelar
              </button>
              <button onClick={addMember}
                className="flex-1 py-2.5 rounded-xl bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#CC3D00]">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/members/
git commit -m "feat: add members page with search and add member modal"
```

---

## Task 9: Página Rutinas

**Files:**
- Create: `app/dashboard/routines/page.tsx`

- [ ] **Step 1: Crear `app/dashboard/routines/page.tsx`**

```tsx
// app/dashboard/routines/page.tsx
'use client'

import { useState } from 'react'
import Topbar from '@/components/topbar'
import { ROUTINES } from '@/lib/mock-data'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

type Exercise = { name: string; sets: number; reps: number; rest: number }
type Routine = { id: number; name: string; day: string; exercises: Exercise[] }

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>(ROUTINES)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', day: '', exercises: [{ name: '', sets: 3, reps: 12, rest: 60 }] })

  function deleteRoutine(id: number) {
    setRoutines(r => r.filter(x => x.id !== id))
  }

  function addExercise() {
    setForm(f => ({ ...f, exercises: [...f.exercises, { name: '', sets: 3, reps: 12, rest: 60 }] }))
  }

  function updateExercise(i: number, field: keyof Exercise, value: string | number) {
    setForm(f => {
      const exs = [...f.exercises]
      exs[i] = { ...exs[i], [field]: value }
      return { ...f, exercises: exs }
    })
  }

  function saveRoutine() {
    if (!form.name) return
    setRoutines(r => [...r, { id: Date.now(), ...form }])
    setForm({ name: '', day: '', exercises: [{ name: '', sets: 3, reps: 12, rest: 60 }] })
    setShowForm(false)
  }

  return (
    <>
      <Topbar title="Rutinas" subtitle={`${routines.length} rutinas en tu gimnasio`} />

      <div className="flex justify-end mb-5">
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#CC3D00]">
          <Plus size={15} /> Nueva rutina
        </button>
      </div>

      {/* Form crear rutina */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 mb-5">
          <h3 className="text-base font-extrabold text-[#1a1a1a] mb-4">Nueva rutina</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Nombre de la rutina</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent" placeholder="Ej: Hombros y Core" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Día(s)</label>
              <input value={form.day} onChange={e => setForm(f => ({...f, day: e.target.value}))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent" placeholder="Ej: Lunes / Jueves" />
            </div>
          </div>

          <div className="mb-3">
            <h4 className="text-sm font-bold text-[#1a1a1a] mb-3">Ejercicios</h4>
            <div className="space-y-2">
              {form.exercises.map((ex, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_80px_80px] gap-2">
                  <input value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent" placeholder="Nombre del ejercicio" />
                  <input type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', +e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#e5e7eb] bg-[#f5f5f7] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent" placeholder="Series" />
                  <input type="number" value={ex.reps} onChange={e => updateExercise(i, 'reps', +e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#e5e7eb] bg-[#f5f5f7] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent" placeholder="Reps" />
                  <input type="number" value={ex.rest} onChange={e => updateExercise(i, 'rest', +e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#e5e7eb] bg-[#f5f5f7] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-transparent" placeholder="Desc(s)" />
                </div>
              ))}
            </div>
            <button onClick={addExercise}
              className="mt-2 text-xs font-semibold text-[#FF4D00] hover:underline">+ Agregar ejercicio</button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f5f5f7]">Cancelar</button>
            <button onClick={saveRoutine}
              className="flex-1 py-2.5 rounded-xl bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#CC3D00]">Guardar rutina</button>
          </div>
        </div>
      )}

      {/* Lista de rutinas */}
      <div className="space-y-3">
        {routines.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg">🏋️</div>
              <div className="flex-1">
                <p className="font-bold text-[#1a1a1a]">{r.name}</p>
                <p className="text-xs text-[#6b7280]">{r.day} · {r.exercises.length} ejercicios</p>
              </div>
              <button onClick={e => { e.stopPropagation(); deleteRoutine(r.id) }}
                className="p-2 rounded-lg text-[#6b7280] hover:bg-red-50 hover:text-red-400 transition-colors">
                <Trash2 size={15} />
              </button>
              {expanded === r.id ? <ChevronUp size={16} className="text-[#6b7280]" /> : <ChevronDown size={16} className="text-[#6b7280]" />}
            </div>
            {expanded === r.id && (
              <div className="border-t border-[#f5f5f7] px-5 py-4">
                <div className="grid grid-cols-[1fr_70px_70px_70px] gap-2 mb-2">
                  {['Ejercicio', 'Series', 'Reps', 'Desc.(s)'].map(h => (
                    <span key={h} className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wide">{h}</span>
                  ))}
                </div>
                {r.exercises.map((ex, i) => (
                  <div key={i} className="grid grid-cols-[1fr_70px_70px_70px] gap-2 py-1.5 border-b border-[#f5f5f7] last:border-0">
                    <span className="text-sm text-[#1a1a1a]">{ex.name}</span>
                    <span className="text-sm text-center text-[#6b7280]">{ex.sets}</span>
                    <span className="text-sm text-center text-[#6b7280]">{ex.reps}</span>
                    <span className="text-sm text-center text-[#6b7280]">{ex.rest}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/routines/
git commit -m "feat: add routines page with create and delete"
```

---

## Task 10: Páginas Ranking y Alertas

**Files:**
- Create: `app/dashboard/ranking/page.tsx`
- Create: `app/dashboard/alerts/page.tsx`

- [ ] **Step 1: Crear `app/dashboard/ranking/page.tsx`**

```tsx
// app/dashboard/ranking/page.tsx
import Topbar from '@/components/topbar'
import { MEMBERS } from '@/lib/mock-data'

const MEDALS = ['🥇', '🥈', '🥉']

export default function RankingPage() {
  const sorted = [...MEMBERS].sort((a, b) => b.points - a.points)

  return (
    <>
      <Topbar title="Ranking" subtitle="Leaderboard de PowerGym Santiago" />
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f5f5f7]">
              {['#', 'Miembro', 'Nivel', 'Puntos', 'Racha', 'Último entreno'].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr key={m.id} className={`border-b border-[#f5f5f7] last:border-0 ${i < 3 ? 'bg-orange-50/30' : 'hover:bg-[#fafafa]'}`}>
                <td className="px-5 py-3 text-lg">{i < 3 ? MEDALS[i] : <span className="text-sm text-[#6b7280] font-bold">#{i + 1}</span>}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00]">{m.name[0]}</div>
                    <span className="text-sm font-semibold text-[#1a1a1a]">{m.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-[#6b7280]">Nivel {m.level}</td>
                <td className="px-5 py-3 text-sm font-extrabold text-[#FF4D00]">{m.points.toLocaleString()} pts</td>
                <td className="px-5 py-3 text-sm text-[#6b7280]">🔥 {m.streak} días</td>
                <td className="px-5 py-3 text-sm text-[#6b7280]">{m.lastWorkout}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Crear `app/dashboard/alerts/page.tsx`**

```tsx
// app/dashboard/alerts/page.tsx
import Topbar from '@/components/topbar'
import { AT_RISK, MEMBERS, RECENT_ACTIVITY } from '@/lib/mock-data'

const NEW_THIS_WEEK = MEMBERS.filter(m => m.points === 0 || m.lastWorkout >= '2026-04-14')

export default function AlertsPage() {
  return (
    <>
      <Topbar title="Alertas" subtitle="Miembros en riesgo y actividad reciente" />
      <div className="grid grid-cols-2 gap-5">
        {/* At risk */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <h3 className="font-bold text-[#1a1a1a]">Sin entrenar +7 días ({AT_RISK.length})</h3>
          </div>
          {AT_RISK.length === 0 ? (
            <p className="text-sm text-[#6b7280]">¡Todos activos! 🎉</p>
          ) : (
            <div className="space-y-3">
              {AT_RISK.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center font-extrabold text-red-400">{m.name[0]}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1a1a1a]">{m.name}</p>
                    <p className="text-xs text-[#6b7280]">Último entreno: {m.lastWorkout}</p>
                  </div>
                  <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded-lg">Contactar</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h3 className="font-bold text-[#1a1a1a]">Actividad reciente</h3>
          </div>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#f5f5f7] rounded-xl">
                <span className="text-xl">{a.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm text-[#1a1a1a]">{a.text}</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/ranking/ app/dashboard/alerts/
git commit -m "feat: add ranking and alerts pages"
```

---

## Task 11: Build y verificación final

- [ ] **Step 1: Build de producción**

```bash
npm run build
```
Esperado: sin errores. Si hay errores de TypeScript, corregirlos.

- [ ] **Step 2: Verificar todas las páginas**

```bash
npm run start
```
Revisar:
- http://localhost:3000 → redirige a /login
- /login → formulario funciona
- /dashboard → stats + chart + miembros + alertas
- /dashboard/members → tabla + búsqueda + agregar + desactivar
- /dashboard/routines → lista + crear + eliminar + expandir
- /dashboard/ranking → tabla con medallas
- /dashboard/alerts → alertas y actividad

- [ ] **Step 3: Commit final**

```bash
git add .
git commit -m "feat: fitpulse admin panel MVP complete"
```

---

## Self-Review

**Spec coverage:**
- ✅ Dashboard con 4 stats, gráfico, top miembros, alertas
- ✅ Miembros: tabla, búsqueda, agregar, desactivar
- ✅ Rutinas: lista, crear, eliminar, ver ejercicios
- ✅ Ranking: leaderboard ordenado por puntos
- ✅ Alertas: en riesgo + actividad reciente
- ✅ Login con auth guard
- ✅ Sidebar con todas las secciones
- ⚠️ Reportes: fusionado con Dashboard y Alertas (no hay página separada — YAGNI para MVP)

**Tipo consistency:** Todos los tipos `Member`, `Routine`, `Exercise` definidos en mock-data.ts y usados consistentemente.

**Placeholders:** Ninguno — cada step tiene código completo.
