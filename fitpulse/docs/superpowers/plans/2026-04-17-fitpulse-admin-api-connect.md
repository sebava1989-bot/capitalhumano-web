# FitPulse Admin Panel — Conectar a API Real

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar todos los datos hardcodeados del panel admin Next.js por llamadas reales a la API REST desplegada en Railway.

**Architecture:** Convertir páginas Server Component a Client Components con `useEffect` + `fetch`. La auth usa JWT guardado en localStorage. Un cliente API centralizado (`lib/api.ts`) maneja el token y la URL base. `lib/auth.ts` llama al endpoint real de login.

**Tech Stack:** Next.js 14 App Router, TypeScript, localStorage para JWT, fetch nativo

**API Base URL:** `https://fitpulse-production-d06c.up.railway.app/api`

**Credenciales demo:** admin@powergym.cl / admin123

---

## Estructura de archivos

```
fitpulse-admin/
├── lib/
│   ├── api.ts          ← NUEVO: cliente API con token + URL base
│   └── auth.ts         ← MODIFICAR: login real contra /api/admin/login
├── app/
│   ├── login/page.tsx  ← MODIFICAR: login async con errores reales
│   └── dashboard/
│       ├── page.tsx            ← MODIFICAR: fetch /api/dashboard
│       ├── members/page.tsx    ← MODIFICAR: fetch /api/members + CRUD
│       ├── payments/page.tsx   ← MODIFICAR: fetch /api/subscriptions + PATCH
│       ├── ranking/page.tsx    ← MODIFICAR: fetch /api/ranking
│       ├── alerts/page.tsx     ← MODIFICAR: fetch /api/dashboard (at_risk + recent)
│       └── routines/page.tsx   ← MODIFICAR: fetch /api/routines + CRUD
```

---

## Task 1: Cliente API y autenticación real

**Files:**
- Create: `C:\Users\sebas\fitpulse-admin\lib\api.ts`
- Modify: `C:\Users\sebas\fitpulse-admin\lib\auth.ts`
- Modify: `C:\Users\sebas\fitpulse-admin\app\login\page.tsx`

- [ ] **Step 1: Crear `lib/api.ts`**

```ts
// lib/api.ts
'use client'

export const API_URL = 'https://fitpulse-production-d06c.up.railway.app/api'

export function getToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('fp_admin_token') || ''
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `POST ${path} failed: ${res.status}`)
  }
  return res.json()
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`)
  return res.json()
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`)
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`)
  return res.json()
}
```

- [ ] **Step 2: Reemplazar `lib/auth.ts` completo**

```ts
// lib/auth.ts
'use client'

const TOKEN_KEY = 'fp_admin_token'
const GYM_KEY = 'fp_admin_gym'
const API_URL = 'https://fitpulse-production-d06c.up.railway.app/api'

export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || 'Error al iniciar sesión' }
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(GYM_KEY, JSON.stringify(data.gym))
    return { ok: true }
  } catch {
    return { ok: false, error: 'No se pudo conectar al servidor' }
  }
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

- [ ] **Step 3: Actualizar `app/login/page.tsx`**

El login ahora es async. Reemplazar el contenido completo:

```tsx
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
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await login(email, password)
    setLoading(false)
    if (result.ok) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#CC3D00] flex items-center justify-center shadow-lg shadow-orange-200 mb-4">
            <Zap className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1a1a1a]">FitPulse Admin</h1>
          <p className="text-sm text-[#6b7280] mt-1">Panel del dueño del gimnasio</p>
        </div>

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
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#FF4D00] text-white font-bold text-sm hover:bg-[#CC3D00] transition-colors disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar al panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd C:\Users\sebas\fitpulse-admin
git add lib/api.ts lib/auth.ts app/login/page.tsx
git commit -m "feat: add API client and real auth login"
```

---

## Task 2: Dashboard con datos reales

**Files:**
- Modify: `C:\Users\sebas\fitpulse-admin\app\dashboard\page.tsx`

El endpoint `GET /api/dashboard` devuelve:
```ts
{
  active_members: number
  workouts_today: number
  avg_streak: number
  at_risk_count: number
  overdue_payments: number
  due_soon_payments: number
  workouts_per_day: { date: string, count: string }[]
  top_members: { full_name: string, points: number, streak: number, level: number }[]
  at_risk_members: { id: number, full_name: string, last_workout: string }[]
  recent_activity: { full_name: string, date: string, routine_name: string }[]
}
```

- [ ] **Step 1: Reemplazar `app/dashboard/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import StatCard from '@/components/stat-card'
import BarChart from '@/components/bar-chart'
import Topbar from '@/components/topbar'
import { apiGet } from '@/lib/api'
import { getGymInfo } from '@/lib/auth'

interface DashboardData {
  active_members: number
  workouts_today: number
  avg_streak: number
  at_risk_count: number
  overdue_payments: number
  due_soon_payments: number
  workouts_per_day: { date: string; count: string }[]
  top_members: { full_name: string; points: number; streak: number; level: number }[]
  at_risk_members: { id: number; full_name: string; last_workout: string }[]
  recent_activity: { full_name: string; date: string; routine_name: string }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const gym = getGymInfo()

  useEffect(() => {
    apiGet<DashboardData>('/dashboard').then(setData).catch(console.error)
  }, [])

  if (!data) return <div className="p-8 text-[#6b7280] text-sm">Cargando...</div>

  const chartData = data.workouts_per_day.map(d => ({
    day: new Date(d.date).toLocaleDateString('es-CL', { weekday: 'short' }),
    count: parseInt(d.count),
  }))

  return (
    <>
      <Topbar title={`Bienvenido 👋`} subtitle={`Resumen de ${gym?.name || 'tu gimnasio'} — hoy`} />

      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="Miembros activos" value={data.active_members} sub="socios registrados" />
        <StatCard label="Entrenamientos hoy" value={data.workouts_today} sub="sesiones completadas" color="#FF4D00" />
        <StatCard label="Racha promedio" value={data.avg_streak} sub="días seguidos" color="#f59e0b" />
        <StatCard label="En riesgo" value={data.at_risk_count} sub="sin entrenar +7 días" color="#ef4444" />
        <StatCard label="Cobros pendientes" value={data.overdue_payments + data.due_soon_payments} sub="vencidos o próximos" color="#8b5cf6" />
      </div>

      {(data.overdue_payments > 0 || data.due_soon_payments > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <span className="text-xl mt-0.5">💳</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 mb-1">Recordatorio de cobros</p>
            <p className="text-sm text-amber-700">
              {data.overdue_payments > 0 && (
                <span className="text-red-600 font-semibold">{data.overdue_payments} miembro{data.overdue_payments > 1 ? 's' : ''} con pago vencido. </span>
              )}
              {data.due_soon_payments > 0 && (
                <span>{data.due_soon_payments} miembro{data.due_soon_payments > 1 ? 's' : ''} con pago próximo a vencer. </span>
              )}
              <a href="/dashboard/payments" className="underline font-semibold text-amber-800 hover:text-amber-900">Ver cobros →</a>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[1.6fr_1fr] gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#1a1a1a]">Entrenamientos por día</h3>
            <span className="text-xs text-[#6b7280]">últimos 7 días</span>
          </div>
          <BarChart data={chartData} />
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <h3 className="text-sm font-bold text-[#1a1a1a] mb-4">Top miembros del mes</h3>
          <div className="space-y-3">
            {data.top_members.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-[#6b7280] w-4">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00] shrink-0">
                  {m.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a1a] truncate">{m.full_name}</p>
                  <p className="text-xs text-[#6b7280]">🔥 {m.streak} días</p>
                </div>
                <span className="text-xs font-bold text-[#FF4D00]">{m.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h3 className="text-sm font-bold text-[#1a1a1a]">Sin entrenar +7 días ({data.at_risk_members.length})</h3>
          </div>
          {data.at_risk_members.length === 0 ? (
            <p className="text-sm text-[#6b7280]">¡Todos activos! 🎉</p>
          ) : (
            <div className="space-y-2">
              {data.at_risk_members.map(m => (
                <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-[#f5f5f7] last:border-0">
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-[10px] font-bold text-red-400">{m.full_name[0]}</div>
                  <span className="flex-1 text-xs font-medium text-[#1a1a1a] truncate">{m.full_name}</span>
                  <span className="text-[10px] font-bold text-red-500">{m.last_workout}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <h3 className="text-sm font-bold text-[#1a1a1a]">Cobros vencidos ({data.overdue_payments})</h3>
          </div>
          {data.overdue_payments === 0 ? (
            <p className="text-sm text-[#6b7280]">¡Todo al día! 🎉</p>
          ) : (
            <p className="text-sm text-red-500 font-semibold">{data.overdue_payments} pago{data.overdue_payments > 1 ? 's' : ''} vencido{data.overdue_payments > 1 ? 's' : ''}</p>
          )}
          <a href="/dashboard/payments" className="text-xs text-[#FF4D00] font-semibold mt-3 block hover:underline">Ver cobros →</a>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <h3 className="text-sm font-bold text-[#1a1a1a]">Actividad reciente</h3>
          </div>
          <div className="space-y-2">
            {data.recent_activity.map((a, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[#f5f5f7] last:border-0">
                <span className="text-sm">✅</span>
                <span className="flex-1 text-xs text-[#1a1a1a]">{a.full_name} completó {a.routine_name}</span>
                <span className="text-[10px] text-[#6b7280] shrink-0">{a.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd C:\Users\sebas\fitpulse-admin
git add app/dashboard/page.tsx
git commit -m "feat: connect dashboard to real API"
```

---

## Task 3: Página de Miembros con API real

**Files:**
- Modify: `C:\Users\sebas\fitpulse-admin\app\dashboard\members\page.tsx`

El endpoint `GET /api/members` devuelve:
```ts
{
  id: number, full_name: string, rut: string, level: number, points: number,
  streak: number, last_workout: string, active: boolean, phone: string,
  subscription_price: number, due_day: number, last_payment_date: string,
  subscription_status: 'paid'|'overdue'|'due_soon'|'pending'
}[]
```

- [ ] **Step 1: Reemplazar `app/dashboard/members/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { apiGet, apiPost, apiPatch } from '@/lib/api'
import { Search, UserPlus, CheckCircle, XCircle, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface Member {
  id: number
  full_name: string
  rut: string
  level: number
  points: number
  streak: number
  last_workout: string
  active: boolean
  phone: string
  subscription_status: 'paid' | 'overdue' | 'due_soon' | 'pending'
}

const STATUS_COLORS = {
  paid:     { label: 'Al día',     cls: 'bg-green-50 text-green-600' },
  due_soon: { label: 'Próx. pago', cls: 'bg-amber-50 text-amber-600' },
  overdue:  { label: 'Mora',       cls: 'bg-red-50 text-red-500' },
  pending:  { label: 'Pendiente',  cls: 'bg-gray-50 text-[#6b7280]' },
}

function levelName(level: number) {
  if (level >= 7) return 'Avanzado'
  if (level >= 4) return 'Intermedio'
  return 'Principiante'
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ full_name: '', rut: '', phone: '', password: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<Member[]>('/members').then(data => { setMembers(data); setLoading(false) }).catch(console.error)
  }, [])

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.rut.includes(search)
  )

  async function toggleActive(id: number, currentActive: boolean) {
    await apiPatch(`/members/${id}`, { active: !currentActive })
    setMembers(prev => prev.map(m => m.id === id ? { ...m, active: !currentActive } : m))
  }

  async function addMember() {
    if (!form.full_name || !form.rut || !form.password) return
    const created = await apiPost<Member>('/members', {
      full_name: form.full_name,
      rut: form.rut,
      phone: form.phone,
      password: form.password,
    })
    setMembers(prev => [{ ...created, level: 1, points: 0, streak: 0, last_workout: '', subscription_status: 'pending' }, ...prev])
    setForm({ full_name: '', rut: '', phone: '', password: '' })
    setShowModal(false)
  }

  if (loading) return <div className="p-8 text-[#6b7280] text-sm">Cargando miembros...</div>

  return (
    <>
      <Topbar title="Miembros" subtitle={`${members.filter(m => m.active).length} activos · ${members.length} total`} />

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

      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f5f5f7]">
              {['Nombre', 'RUT', 'Nivel', 'Puntos', 'Racha', 'Último entreno', 'Pago', 'Estado', ''].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const payCfg = STATUS_COLORS[m.subscription_status]
              return (
                <tr key={m.id} className="border-b border-[#f5f5f7] last:border-0 hover:bg-[#fafafa]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00]">{m.full_name[0]}</div>
                      <span className="text-sm font-semibold text-[#1a1a1a]">{m.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">{m.rut}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-orange-50 text-[#FF4D00]">
                      Nv.{m.level} {levelName(m.level)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-[#FF4D00]">{m.points.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">🔥 {m.streak}d</td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">{m.last_workout || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${payCfg.cls}`}>{payCfg.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    {m.active
                      ? <span className="flex items-center gap-1 text-xs font-semibold text-green-600"><CheckCircle size={13} /> Activo</span>
                      : <span className="flex items-center gap-1 text-xs font-semibold text-red-400"><XCircle size={13} /> Inactivo</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(m.id, m.active)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                          m.active ? 'border-red-200 text-red-400 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {m.active ? 'Desactivar' : 'Activar'}
                      </button>
                      <Link href="/dashboard/payments" className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]">
                        <CreditCard size={11} />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-extrabold text-[#1a1a1a] mb-5">Agregar miembro</h2>
            <div className="space-y-4">
              {[
                { label: 'Nombre completo', key: 'full_name', placeholder: 'Ana González' },
                { label: 'RUT', key: 'rut', placeholder: '12345678-9' },
                { label: 'Teléfono', key: 'phone', placeholder: '+56912345678' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]"
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Contraseña inicial</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" placeholder="••••••••" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f5f5f7]">Cancelar</button>
              <button onClick={addMember} className="flex-1 py-2.5 rounded-xl bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#CC3D00]">Agregar</button>
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
cd C:\Users\sebas\fitpulse-admin
git add app/dashboard/members/page.tsx
git commit -m "feat: connect members page to real API"
```

---

## Task 4: Página de Cobros con API real

**Files:**
- Modify: `C:\Users\sebas\fitpulse-admin\app\dashboard\payments\page.tsx`

El endpoint `GET /api/subscriptions` devuelve:
```ts
{
  id: number, member_id: number, full_name: string, rut: string, phone: string,
  price: number, due_day: number, last_payment_date: string,
  status: 'paid'|'overdue'|'due_soon'|'pending', days_overdue: number
}[]
```

`PATCH /api/subscriptions/:memberId` con body `{ last_payment_date: "YYYY-MM-DD" }` devuelve `{ ok: true, new_status: 'paid' }`.

- [ ] **Step 1: Leer el archivo actual de payments para preservar la UI**

Antes de reemplazar, leer `C:\Users\sebas\fitpulse-admin\app\dashboard\payments\page.tsx` completo.

- [ ] **Step 2: Reemplazar `app/dashboard/payments/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { apiGet, apiPatch } from '@/lib/api'
import { MessageCircle, CheckCircle } from 'lucide-react'

interface Subscription {
  id: number
  member_id: number
  full_name: string
  rut: string
  phone: string
  price: number
  due_day: number
  last_payment_date: string
  status: 'paid' | 'overdue' | 'due_soon' | 'pending'
  days_overdue: number
}

const STATUS_CFG = {
  paid:     { label: 'Al día',     cls: 'bg-green-50 text-green-600',  dot: 'bg-green-400' },
  due_soon: { label: 'Próx. pago', cls: 'bg-amber-50 text-amber-600',  dot: 'bg-amber-400' },
  overdue:  { label: 'Vencido',    cls: 'bg-red-50 text-red-500',      dot: 'bg-red-500'   },
  pending:  { label: 'Pendiente',  cls: 'bg-gray-50 text-[#6b7280]',   dot: 'bg-gray-300'  },
}

type FilterTab = 'all' | 'overdue' | 'due_soon' | 'paid' | 'pending'

export default function PaymentsPage() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [filter, setFilter] = useState<FilterTab>('all')
  const [confirming, setConfirming] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<Subscription[]>('/subscriptions')
      .then(data => { setSubs(data); setLoading(false) })
      .catch(console.error)
  }, [])

  async function markPaid(memberId: number) {
    const today = new Date().toISOString().split('T')[0]
    await apiPatch(`/subscriptions/${memberId}`, { last_payment_date: today })
    setSubs(prev => prev.map(s =>
      s.member_id === memberId ? { ...s, status: 'paid', last_payment_date: today, days_overdue: 0 } : s
    ))
    setConfirming(null)
  }

  function waMsg(s: Subscription) {
    const msg = s.status === 'overdue'
      ? `Hola ${s.full_name}, tu mensualidad de $${s.price.toLocaleString()} lleva ${s.days_overdue} días vencida. Por favor regulariza tu situación. ¡Gracias! 💪`
      : `Hola ${s.full_name}, tu mensualidad de $${s.price.toLocaleString()} vence el día ${s.due_day} de este mes. ¡No te olvides! 💪`
    return `https://wa.me/${s.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }

  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter)

  const overdue  = subs.filter(s => s.status === 'overdue').length
  const dueSoon  = subs.filter(s => s.status === 'due_soon').length
  const paid     = subs.filter(s => s.status === 'paid').length
  const pending  = subs.filter(s => s.status === 'pending').length
  const cobradoMes = subs.filter(s => s.status === 'paid').reduce((acc, s) => acc + s.price, 0)
  const porCobrar  = subs.filter(s => s.status !== 'paid').reduce((acc, s) => acc + s.price, 0)

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',      label: `Todos (${subs.length})` },
    { key: 'overdue',  label: `Vencidos (${overdue})` },
    { key: 'due_soon', label: `Próximos (${dueSoon})` },
    { key: 'paid',     label: `Al día (${paid})` },
    { key: 'pending',  label: `Pendientes (${pending})` },
  ]

  if (loading) return <div className="p-8 text-[#6b7280] text-sm">Cargando cobros...</div>

  return (
    <>
      <Topbar title="Cobros" subtitle="Estado de pagos mensuales" />

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Cobrado este mes', value: `$${cobradoMes.toLocaleString()}`, color: '#22c55e' },
          { label: 'Por cobrar',        value: `$${porCobrar.toLocaleString()}`,  color: '#f59e0b' },
          { label: 'Vencidos',          value: overdue,                           color: '#ef4444' },
          { label: 'Próximos',          value: dueSoon,                           color: '#8b5cf6' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-[#e5e7eb] p-4">
            <p className="text-xs text-[#6b7280] font-medium mb-1">{c.label}</p>
            <p className="text-2xl font-extrabold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === t.key ? 'bg-[#FF4D00] text-white' : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f5f5f7]">
              {['Miembro', 'RUT', 'Mensualidad', 'Día vencimiento', 'Último pago', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const cfg = STATUS_CFG[s.status]
              return (
                <tr key={s.id} className="border-b border-[#f5f5f7] last:border-0 hover:bg-[#fafafa]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="text-sm font-semibold text-[#1a1a1a]">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">{s.rut}</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#1a1a1a]">${s.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">Día {s.due_day}</td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">{s.last_payment_date || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${cfg.cls}`}>
                      {cfg.label}{s.status === 'overdue' && s.days_overdue > 0 ? ` (${s.days_overdue}d)` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {confirming === s.member_id ? (
                        <>
                          <button onClick={() => markPaid(s.member_id)} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600">
                            <CheckCircle size={11} /> Confirmar
                          </button>
                          <button onClick={() => setConfirming(null)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]">
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          {s.status !== 'paid' && (
                            <button onClick={() => setConfirming(s.member_id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FF4D00] text-white hover:bg-[#CC3D00]">
                              Cobrar
                            </button>
                          )}
                          {s.phone && (
                            <a href={waMsg(s)} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50">
                              <MessageCircle size={11} /> WA
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd C:\Users\sebas\fitpulse-admin
git add app/dashboard/payments/page.tsx
git commit -m "feat: connect payments page to real API"
```

---

## Task 5: Ranking y Alertas con API real

**Files:**
- Modify: `C:\Users\sebas\fitpulse-admin\app\dashboard\ranking\page.tsx`
- Modify: `C:\Users\sebas\fitpulse-admin\app\dashboard\alerts\page.tsx`

`GET /api/ranking` devuelve: `{ rank: number, full_name: string, points: number, streak: number, level: number }[]`

- [ ] **Step 1: Leer ambos archivos actuales**

Leer `app/dashboard/ranking/page.tsx` y `app/dashboard/alerts/page.tsx` para conocer la UI existente.

- [ ] **Step 2: Reemplazar `app/dashboard/ranking/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { apiGet } from '@/lib/api'

interface RankMember {
  rank: number
  full_name: string
  points: number
  streak: number
  level: number
}

const MEDALS = ['🥇', '🥈', '🥉']

function levelName(level: number) {
  if (level >= 7) return 'Avanzado'
  if (level >= 4) return 'Intermedio'
  return 'Principiante'
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<RankMember[]>('/ranking').then(data => { setRanking(data); setLoading(false) }).catch(console.error)
  }, [])

  if (loading) return <div className="p-8 text-[#6b7280] text-sm">Cargando ranking...</div>

  const top3 = ranking.slice(0, 3)
  const rest  = ranking.slice(3)

  return (
    <>
      <Topbar title="Ranking" subtitle="Top miembros del gimnasio por puntos" />

      {/* Podio top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {top3.map((m, i) => (
            <div key={m.rank} className={`bg-white rounded-2xl border p-5 text-center ${i === 0 ? 'border-yellow-300 shadow-lg shadow-yellow-100' : 'border-[#e5e7eb]'}`}>
              <div className="text-3xl mb-2">{MEDALS[i]}</div>
              <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-xl font-extrabold text-[#FF4D00] mx-auto mb-3">
                {m.full_name[0]}
              </div>
              <p className="font-extrabold text-[#1a1a1a] text-sm">{m.full_name}</p>
              <p className="text-xs text-[#6b7280] mt-0.5">{levelName(m.level)}</p>
              <p className="text-2xl font-extrabold text-[#FF4D00] mt-2">{m.points.toLocaleString()}</p>
              <p className="text-xs text-[#6b7280]">puntos</p>
              <p className="text-xs text-[#6b7280] mt-2">🔥 {m.streak} días de racha</p>
            </div>
          ))}
        </div>
      )}

      {/* Resto del ranking */}
      {rest.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f5f5f7]">
                {['#', 'Nombre', 'Nivel', 'Racha', 'Puntos'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rest.map(m => (
                <tr key={m.rank} className="border-b border-[#f5f5f7] last:border-0 hover:bg-[#fafafa]">
                  <td className="px-4 py-3 text-sm font-bold text-[#6b7280]">#{m.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00]">{m.full_name[0]}</div>
                      <span className="text-sm font-semibold text-[#1a1a1a]">{m.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-orange-50 text-[#FF4D00]">Nv.{m.level} {levelName(m.level)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">🔥 {m.streak}d</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#FF4D00]">{m.points.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Reemplazar `app/dashboard/alerts/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { apiGet } from '@/lib/api'

interface DashboardData {
  at_risk_members: { id: number; full_name: string; last_workout: string }[]
  recent_activity: { full_name: string; date: string; routine_name: string }[]
}

export default function AlertsPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    apiGet<DashboardData>('/dashboard').then(setData).catch(console.error)
  }, [])

  const atRisk = data?.at_risk_members ?? []
  const recent = data?.recent_activity ?? []

  return (
    <>
      <Topbar title="Alertas" subtitle="Miembros en riesgo y actividad reciente" />
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <h3 className="font-bold text-[#1a1a1a]">Sin entrenar +7 días ({atRisk.length})</h3>
          </div>
          {atRisk.length === 0 ? (
            <p className="text-sm text-[#6b7280]">¡Todos activos! 🎉</p>
          ) : (
            <div className="space-y-3">
              {atRisk.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center font-extrabold text-red-400">{m.full_name[0]}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1a1a1a]">{m.full_name}</p>
                    <p className="text-xs text-[#6b7280]">Último entreno: {m.last_workout}</p>
                  </div>
                  <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded-lg">Contactar</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h3 className="font-bold text-[#1a1a1a]">Actividad reciente</h3>
          </div>
          <div className="space-y-3">
            {recent.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#f5f5f7] rounded-xl">
                <span className="text-xl">✅</span>
                <div className="flex-1">
                  <p className="text-sm text-[#1a1a1a]">{a.full_name} completó {a.routine_name}</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">{a.date}</p>
                </div>
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm text-[#6b7280]">Sin actividad reciente</p>}
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd C:\Users\sebas\fitpulse-admin
git add app/dashboard/ranking/page.tsx app/dashboard/alerts/page.tsx
git commit -m "feat: connect ranking and alerts to real API"
```

---

## Task 6: Rutinas con API real

**Files:**
- Modify: `C:\Users\sebas\fitpulse-admin\app\dashboard\routines\page.tsx`

`GET /api/routines` devuelve: `{ id, name, day_of_week, exercises: { id, name, sets, reps, rest_seconds, position }[] }[]`

- [ ] **Step 1: Leer el archivo actual de routines**

Leer `C:\Users\sebas\fitpulse-admin\app\dashboard\routines\page.tsx` completo para preservar la UI.

- [ ] **Step 2: Reemplazar `app/dashboard/routines/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Topbar from '@/components/topbar'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface Exercise {
  id?: number
  name: string
  sets: number
  reps: number
  rest_seconds: number
}

interface Routine {
  id: number
  name: string
  day_of_week: string
  exercises: Exercise[]
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [form, setForm] = useState({ name: '', day_of_week: '' })
  const [exercises, setExercises] = useState<Exercise[]>([{ name: '', sets: 3, reps: 12, rest_seconds: 60 }])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<Routine[]>('/routines').then(data => { setRoutines(data); setLoading(false) }).catch(console.error)
  }, [])

  function openCreate() {
    setEditingRoutine(null)
    setForm({ name: '', day_of_week: '' })
    setExercises([{ name: '', sets: 3, reps: 12, rest_seconds: 60 }])
    setShowModal(true)
  }

  function openEdit(r: Routine) {
    setEditingRoutine(r)
    setForm({ name: r.name, day_of_week: r.day_of_week })
    setExercises(r.exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, rest_seconds: e.rest_seconds })))
    setShowModal(true)
  }

  async function save() {
    if (!form.name) return
    const body = { name: form.name, day_of_week: form.day_of_week, exercises }
    if (editingRoutine) {
      await apiPut(`/routines/${editingRoutine.id}`, body)
      setRoutines(prev => prev.map(r => r.id === editingRoutine.id ? { ...r, ...body, exercises } : r))
    } else {
      const created = await apiPost<Routine>('/routines', body)
      setRoutines(prev => [...prev, created])
    }
    setShowModal(false)
  }

  async function deleteRoutine(id: number) {
    if (!confirm('¿Eliminar esta rutina?')) return
    await apiDelete(`/routines/${id}`)
    setRoutines(prev => prev.filter(r => r.id !== id))
  }

  function addExercise() {
    setExercises(prev => [...prev, { name: '', sets: 3, reps: 12, rest_seconds: 60 }])
  }

  function updateExercise(i: number, field: keyof Exercise, value: string | number) {
    setExercises(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  function removeExercise(i: number) {
    setExercises(prev => prev.filter((_, idx) => idx !== i))
  }

  if (loading) return <div className="p-8 text-[#6b7280] text-sm">Cargando rutinas...</div>

  return (
    <>
      <Topbar title="Rutinas" subtitle={`${routines.length} rutinas configuradas`} />

      <div className="flex justify-end mb-5">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#CC3D00] transition-colors">
          <Plus size={15} /> Nueva rutina
        </button>
      </div>

      <div className="space-y-3">
        {routines.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-bold text-[#1a1a1a]">{r.name}</p>
                <p className="text-xs text-[#6b7280] mt-0.5">{r.day_of_week} · {r.exercises.length} ejercicios</p>
              </div>
              <button onClick={() => openEdit(r)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]">Editar</button>
              <button onClick={() => deleteRoutine(r.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50">
                <Trash2 size={13} />
              </button>
              <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="text-[#6b7280]">
                {expanded === r.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
            {expanded === r.id && (
              <div className="border-t border-[#f5f5f7] px-4 pb-4">
                <table className="w-full mt-3">
                  <thead>
                    <tr>
                      {['Ejercicio', 'Series', 'Reps', 'Descanso'].map(h => (
                        <th key={h} className="text-left text-[11px] font-semibold text-[#6b7280] uppercase pb-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.exercises.map((e, i) => (
                      <tr key={i} className="border-t border-[#f5f5f7]">
                        <td className="py-2 text-sm text-[#1a1a1a]">{e.name}</td>
                        <td className="py-2 text-sm text-[#6b7280]">{e.sets}</td>
                        <td className="py-2 text-sm text-[#6b7280]">{e.reps}</td>
                        <td className="py-2 text-sm text-[#6b7280]">{e.rest_seconds}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl my-4">
            <h2 className="text-lg font-extrabold text-[#1a1a1a] mb-5">{editingRoutine ? 'Editar rutina' : 'Nueva rutina'}</h2>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Nombre</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]"
                  placeholder="Pecho y Tríceps" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">Días</label>
                <input value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]"
                  placeholder="Lunes / Jueves" />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-[#1a1a1a]">Ejercicios</p>
                <button onClick={addExercise} className="flex items-center gap-1 text-xs font-semibold text-[#FF4D00] hover:underline">
                  <Plus size={13} /> Agregar
                </button>
              </div>
              <div className="space-y-3">
                {exercises.map((ex, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_60px_70px_32px] gap-2 items-center">
                    <input value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)}
                      placeholder="Nombre del ejercicio"
                      className="px-3 py-2 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" />
                    <input type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', parseInt(e.target.value))}
                      className="px-2 py-2 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" />
                    <input type="number" value={ex.reps} onChange={e => updateExercise(i, 'reps', parseInt(e.target.value))}
                      className="px-2 py-2 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" />
                    <input type="number" value={ex.rest_seconds} onChange={e => updateExercise(i, 'rest_seconds', parseInt(e.target.value))}
                      className="px-2 py-2 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF4D00]" />
                    <button onClick={() => removeExercise(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_60px_60px_70px_32px] gap-2 text-[10px] text-[#6b7280] px-1">
                  <span>Ejercicio</span><span className="text-center">Series</span><span className="text-center">Reps</span><span className="text-center">Desc(s)</span><span />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f5f5f7]">Cancelar</button>
              <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-[#FF4D00] text-white text-sm font-semibold hover:bg-[#CC3D00]">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd C:\Users\sebas\fitpulse-admin
git add app/dashboard/routines/page.tsx
git commit -m "feat: connect routines page to real API"
```

---

## Task 7: Build y verificación final

**Files:** ninguno nuevo

- [ ] **Step 1: Build de producción**

```bash
cd C:\Users\sebas\fitpulse-admin
npm run build
```

Esperado: 0 errores de TypeScript. Si hay errores, corregirlos antes de continuar.

- [ ] **Step 2: Correr dev server y probar**

```bash
npm run dev
```

Abrir http://localhost:3000 y verificar:
- Login con `admin@powergym.cl` / `admin123` → redirige al dashboard
- Dashboard muestra stats reales (10 miembros, entrenamientos, cobros)
- Miembros muestra lista real de la BD
- Cobros muestra estados actualizados por el cron
- Ranking muestra top 50
- Rutinas muestra las 4 rutinas con ejercicios reales

- [ ] **Step 3: Commit final**

```bash
cd C:\Users\sebas\fitpulse-admin
git add -A
git commit -m "chore: verify build after API integration"
```

---

## Self-Review

**Spec coverage:**
- ✅ Auth real — Task 1
- ✅ Dashboard con datos reales — Task 2
- ✅ Miembros: listar, crear, activar/desactivar — Task 3
- ✅ Cobros: listar, marcar pagado, WA — Task 4
- ✅ Ranking — Task 5
- ✅ Alertas — Task 5
- ✅ Rutinas: CRUD completo — Task 6
- ✅ Build verificado — Task 7

**Placeholders:** Ninguno — código completo en todos los steps.

**Consistencia de tipos:** `apiGet`, `apiPost`, `apiPatch`, `apiPut`, `apiDelete` definidos en Task 1 y usados consistentemente en Tasks 2-6. Campos de API (`full_name`, `subscription_status`, etc.) consistentes con lo que devuelve el backend.
