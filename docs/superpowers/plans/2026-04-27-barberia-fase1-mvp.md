# Barbería SaaS — Fase 1 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el MVP de la plataforma barbería — agenda pública, panel admin, portal cliente, vista barbero, notificaciones email y deploy en Vercel.

**Architecture:** Next.js 14 App Router con rutas multi-tenant por `[slug]`. Supabase maneja DB (PostgreSQL), Auth (OTP), Realtime y Edge Functions. RLS policies aíslan datos por `barberia_id` automáticamente.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Resend, React Email, Vitest, Vercel.

> **Scope note:** Este plan cubre Fase 1 (MVP). Fases 2 (suscripciones+referidos), 3 (campañas+IA) y 4 (SaaS billing) son planes separados.

---

## Estructura de archivos

```
barberia-saas/
├── app/
│   ├── [slug]/
│   │   ├── page.tsx                        # Landing barbería
│   │   ├── reservar/page.tsx               # Booking público
│   │   ├── cliente/
│   │   │   ├── layout.tsx                  # Requiere auth cliente
│   │   │   └── page.tsx                    # Portal cliente
│   │   ├── admin/
│   │   │   ├── layout.tsx                  # Requiere auth admin
│   │   │   ├── page.tsx                    # Dashboard
│   │   │   ├── agenda/page.tsx
│   │   │   ├── clientes/page.tsx
│   │   │   ├── barberos/page.tsx
│   │   │   └── servicios/page.tsx
│   │   └── barbero/
│   │       ├── layout.tsx                  # Requiere auth barbero
│   │       └── page.tsx
│   ├── api/
│   │   └── auth/callback/route.ts          # Supabase OTP callback
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── booking/
│   │   ├── BookingWizard.tsx               # Orquesta los 3 pasos
│   │   ├── ServiceSelector.tsx
│   │   ├── BarberSelector.tsx
│   │   ├── TimeSlotPicker.tsx
│   │   └── BookingConfirm.tsx
│   ├── admin/
│   │   ├── StatsCards.tsx
│   │   ├── AgendaCalendar.tsx
│   │   ├── ClientsTable.tsx
│   │   ├── BarbersForm.tsx
│   │   └── ServicesForm.tsx
│   ├── cliente/
│   │   ├── NextAppointment.tsx
│   │   └── HistoryList.tsx
│   └── barbero/
│       ├── TodayAgenda.tsx
│       └── AppointmentItem.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       # createBrowserClient
│   │   ├── server.ts                       # createServerClient (cookies)
│   │   └── admin.ts                        # createServiceRoleClient
│   ├── slots.ts                            # Lógica generación de slots (testeada)
│   └── referral.ts                         # Generación de códigos referido
├── hooks/
│   ├── useTenant.ts                        # Lee barberia_id del contexto
│   └── useRealtimeSlots.ts                 # Suscripción Realtime a disponibilidad
├── types/
│   └── database.ts                         # Tipos generados por Supabase CLI
├── emails/
│   ├── ReservationConfirmed.tsx            # React Email template
│   └── Reminder24h.tsx
├── middleware.ts                           # Tenant resolution + auth guard
├── supabase/
│   ├── migrations/
│   │   ├── 20260427000001_initial_schema.sql
│   │   ├── 20260427000002_rls_policies.sql
│   │   └── 20260427000003_seed_dev.sql
│   └── functions/
│       └── send-reminders/index.ts         # Edge Function cron
├── tests/
│   ├── unit/
│   │   ├── slots.test.ts
│   │   └── referral.test.ts
│   └── integration/
│       └── booking.test.ts
├── public/
│   ├── manifest.json
│   └── sw.js                               # Service worker básico
├── .env.local.example
├── next.config.ts
├── vitest.config.ts
└── package.json
```

---

## Task 1: Scaffolding del proyecto

**Files:**
- Create: `barberia-saas/` (directorio raíz)
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`
- Create: `public/manifest.json`
- Create: `.env.local.example`

- [ ] **Step 1: Crear el proyecto Next.js**

```bash
cd C:/Users/sebas
npx create-next-app@latest barberia-saas \
  --typescript --tailwind --app --src-dir=false \
  --import-alias="@/*" --eslint
cd barberia-saas
```

- [ ] **Step 2: Instalar dependencias**

```bash
npm install @supabase/supabase-js @supabase/ssr \
  resend @react-email/components react-email \
  @radix-ui/react-dialog @radix-ui/react-select \
  date-fns lucide-react clsx tailwind-merge \
  nanoid

npm install -D vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom \
  jsdom supabase

npx shadcn@latest init
```
Cuando shadcn pregunte: style=Default, base color=Zinc, CSS variables=yes.

- [ ] **Step 3: Instalar componentes shadcn necesarios**

```bash
npx shadcn@latest add button card input label \
  select dialog calendar badge table tabs \
  dropdown-menu avatar toast sheet
```

- [ ] **Step 4: Configurar Vitest**

Crear `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Crear `tests/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Configurar PWA manifest**

Crear `public/manifest.json`:
```json
{
  "name": "Barbería App",
  "short_name": "Barbería",
  "description": "Reserva tu hora en la barbería",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111111",
  "theme_color": "#111111",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Agregar en `app/layout.tsx` dentro del `<head>`:
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#111111" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

- [ ] **Step 6: Crear .env.local.example**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Resend
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@tudominio.cl

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Copiar a `.env.local` y completar con tus credenciales reales.

- [ ] **Step 7: Commit inicial**

```bash
git init && git add .
git commit -m "feat: scaffold Next.js 14 + shadcn + Vitest"
```

---

## Task 2: Schema de base de datos (Supabase)

**Files:**
- Create: `supabase/migrations/20260427000001_initial_schema.sql`
- Create: `supabase/migrations/20260427000002_rls_policies.sql`
- Create: `supabase/migrations/20260427000003_seed_dev.sql`

- [ ] **Step 1: Inicializar Supabase CLI**

```bash
npx supabase init
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
```

- [ ] **Step 2: Crear migración schema principal**

Crear `supabase/migrations/20260427000001_initial_schema.sql`:
```sql
-- Extensiones
create extension if not exists "pgcrypto";

-- Tabla central de tenants
create table barberias (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  logo_url text,
  colores jsonb default '{"primary":"#e8c84a","background":"#111111"}'::jsonb,
  configuracion jsonb default '{}'::jsonb,
  plan_saas text not null default 'basico' check (plan_saas in ('basico','pro')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Extensión de auth.users
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  barberia_id uuid references barberias(id) on delete cascade,
  rol text not null default 'cliente' check (rol in ('superadmin','admin','barbero','cliente')),
  nombre text not null default '',
  telefono text,
  referral_code text unique,
  referral_by uuid references users(id),
  fcm_token text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Barberos
create table barberos (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references barberias(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  nombre text not null,
  foto_url text,
  horarios jsonb not null default '{
    "lunes":    {"activo": true,  "inicio": "09:00", "fin": "18:00"},
    "martes":   {"activo": true,  "inicio": "09:00", "fin": "18:00"},
    "miercoles":{"activo": true,  "inicio": "09:00", "fin": "18:00"},
    "jueves":   {"activo": true,  "inicio": "09:00", "fin": "18:00"},
    "viernes":  {"activo": true,  "inicio": "09:00", "fin": "18:00"},
    "sabado":   {"activo": true,  "inicio": "09:00", "fin": "14:00"},
    "domingo":  {"activo": false, "inicio": "09:00", "fin": "13:00"}
  }'::jsonb,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Servicios
create table servicios (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references barberias(id) on delete cascade,
  nombre text not null,
  descripcion text,
  duracion_min integer not null default 30,
  precio integer not null,
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

-- Disponibilidad (slots por barbero/fecha)
create table disponibilidad (
  id uuid primary key default gen_random_uuid(),
  barbero_id uuid not null references barberos(id) on delete cascade,
  barberia_id uuid not null references barberias(id) on delete cascade,
  fecha date not null,
  slots jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique(barbero_id, fecha)
);

-- Reservas
create table reservas (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references barberias(id) on delete cascade,
  cliente_id uuid references users(id) on delete set null,
  barbero_id uuid not null references barberos(id) on delete restrict,
  servicio_id uuid not null references servicios(id) on delete restrict,
  fecha_hora timestamptz not null,
  estado text not null default 'confirmada'
    check (estado in ('pendiente','confirmada','completada','cancelada','no_show')),
  precio integer not null,
  descuento integer not null default 0,
  precio_final integer not null,
  notas text,
  cliente_email text,
  cliente_nombre text,
  origen text not null default 'web' check (origen in ('web','admin','suscripcion')),
  created_at timestamptz not null default now()
);

-- Notificaciones
create table notificaciones (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references barberias(id) on delete cascade,
  usuario_id uuid references users(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensaje text not null,
  leida boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Índices críticos
create index idx_reservas_barberia_fecha on reservas(barberia_id, fecha_hora);
create index idx_reservas_cliente on reservas(cliente_id);
create index idx_reservas_barbero_fecha on reservas(barbero_id, fecha_hora);
create index idx_disponibilidad_barbero_fecha on disponibilidad(barbero_id, fecha);
create index idx_users_barberia on users(barberia_id);
create index idx_users_referral_code on users(referral_code);
```

- [ ] **Step 3: Crear políticas RLS**

Crear `supabase/migrations/20260427000002_rls_policies.sql`:
```sql
-- Habilitar RLS en todas las tablas
alter table barberias enable row level security;
alter table users enable row level security;
alter table barberos enable row level security;
alter table servicios enable row level security;
alter table disponibilidad enable row level security;
alter table reservas enable row level security;
alter table notificaciones enable row level security;

-- Helper: obtener barberia_id del usuario actual
create or replace function get_my_barberia_id()
returns uuid language sql stable security definer as $$
  select barberia_id from users where id = auth.uid()
$$;

-- Helper: obtener rol del usuario actual
create or replace function get_my_rol()
returns text language sql stable security definer as $$
  select rol from users where id = auth.uid()
$$;

-- barberias: solo lectura pública por slug, escritura solo superadmin
create policy "barberias_select" on barberias for select using (activo = true);
create policy "barberias_update_admin" on barberias for update
  using (get_my_rol() = 'superadmin' or (get_my_rol() = 'admin' and id = get_my_barberia_id()));

-- users: cada uno ve sus propios datos + admin ve su barbería
create policy "users_select_own" on users for select
  using (id = auth.uid() or barberia_id = get_my_barberia_id());
create policy "users_insert_self" on users for insert with check (id = auth.uid());
create policy "users_update_own" on users for update using (id = auth.uid());

-- barberos: visible para todos en la misma barbería
create policy "barberos_select" on barberos for select
  using (barberia_id = get_my_barberia_id() or get_my_rol() = 'superadmin');
create policy "barberos_write_admin" on barberos for all
  using (get_my_rol() in ('admin','superadmin') and barberia_id = get_my_barberia_id());

-- servicios: lectura pública por barbería, escritura admin
create policy "servicios_select" on servicios for select using (activo = true);
create policy "servicios_write_admin" on servicios for all
  using (get_my_rol() in ('admin','superadmin') and barberia_id = get_my_barberia_id());

-- disponibilidad: lectura pública (para el booking), escritura admin/barbero
create policy "disponibilidad_select" on disponibilidad for select using (true);
create policy "disponibilidad_write" on disponibilidad for all
  using (get_my_rol() in ('admin','barbero','superadmin'));

-- reservas: cliente ve las suyas, barbero ve las de su barbería, admin ve todas
create policy "reservas_select_cliente" on reservas for select
  using (cliente_id = auth.uid() or barberia_id = get_my_barberia_id());
create policy "reservas_insert_public" on reservas for insert with check (true);
create policy "reservas_update_admin_barbero" on reservas for update
  using (get_my_rol() in ('admin','barbero','superadmin') and barberia_id = get_my_barberia_id());

-- notificaciones: cada usuario ve las suyas
create policy "notificaciones_select" on notificaciones for select
  using (usuario_id = auth.uid());
create policy "notificaciones_update" on notificaciones for update
  using (usuario_id = auth.uid());
```

- [ ] **Step 4: Crear seed de desarrollo**

Crear `supabase/migrations/20260427000003_seed_dev.sql`:
```sql
-- Solo ejecutar en desarrollo
-- Barbería de prueba
insert into barberias (id, slug, nombre, colores, configuracion) values (
  '00000000-0000-0000-0000-000000000001',
  'barberia-demo',
  'Barbería Demo',
  '{"primary":"#e8c84a","background":"#111111"}'::jsonb,
  '{"horarios":{"apertura":"09:00","cierre":"19:00"},"proveedor_pago":"flow"}'::jsonb
);

-- Servicios de prueba
insert into servicios (barberia_id, nombre, duracion_min, precio, orden) values
  ('00000000-0000-0000-0000-000000000001', 'Corte clásico', 30, 8000, 1),
  ('00000000-0000-0000-0000-000000000001', 'Pack Barba', 45, 12000, 2),
  ('00000000-0000-0000-0000-000000000001', 'Corte + Barba', 60, 18000, 3);

-- Barberos de prueba
insert into barberos (barberia_id, nombre) values
  ('00000000-0000-0000-0000-000000000001', 'Carlos'),
  ('00000000-0000-0000-0000-000000000001', 'Diego');
```

- [ ] **Step 5: Aplicar migraciones**

```bash
npx supabase db push
```
Verificar en Supabase Dashboard → Table Editor que las tablas existen.

- [ ] **Step 6: Generar tipos TypeScript**

```bash
npx supabase gen types typescript \
  --project-id TU_PROJECT_REF \
  --schema public > types/database.ts
```

- [ ] **Step 7: Commit**

```bash
git add supabase/ types/
git commit -m "feat: Supabase schema + RLS policies + seed dev"
```

---

## Task 3: Supabase clients + middleware

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/admin.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Crear browser client**

Crear `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Crear server client**

Crear `lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Crear admin client (service role)**

Crear `lib/supabase/admin.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

- [ ] **Step 4: Crear middleware**

Crear `middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const slugMatch = pathname.match(/^\/([^/]+)\/(.+)/)

  if (slugMatch) {
    const section = slugMatch[2].split('/')[0] // 'admin', 'barbero', 'cliente'

    if (['admin', 'barbero', 'cliente'].includes(section) && !user) {
      const loginUrl = new URL(`/${slugMatch[1]}/reservar`, request.url)
      loginUrl.searchParams.set('login', 'true')
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (section === 'admin' && user) {
      const { data: userData } = await supabase
        .from('users')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (userData?.rol !== 'admin' && userData?.rol !== 'superadmin') {
        return NextResponse.redirect(new URL(`/${slugMatch[1]}/cliente`, request.url))
      }
    }

    if (section === 'barbero' && user) {
      const { data: userData } = await supabase
        .from('users')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (userData?.rol !== 'barbero' && userData?.rol !== 'admin' && userData?.rol !== 'superadmin') {
        return NextResponse.redirect(new URL(`/${slugMatch[1]}/cliente`, request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 5: Crear hook useTenant**

Crear `hooks/useTenant.ts`:
```typescript
'use client'
import { useParams } from 'next/navigation'

export function useTenant() {
  const params = useParams()
  return { slug: params.slug as string }
}
```

- [ ] **Step 6: Verificar que middleware compila**

```bash
npm run build 2>&1 | head -30
```
Esperado: sin errores de TypeScript.

- [ ] **Step 7: Commit**

```bash
git add lib/ hooks/ middleware.ts
git commit -m "feat: Supabase clients + auth middleware + tenant hook"
```

---

## Task 4: Lógica de slots (TDD)

**Files:**
- Create: `lib/slots.ts`
- Create: `tests/unit/slots.test.ts`

- [ ] **Step 1: Escribir los tests**

Crear `tests/unit/slots.test.ts`:
```typescript
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
```

- [ ] **Step 2: Ejecutar tests — deben fallar**

```bash
npx vitest run tests/unit/slots.test.ts
```
Esperado: FAIL — `Cannot find module '@/lib/slots'`

- [ ] **Step 3: Implementar lib/slots.ts**

Crear `lib/slots.ts`:
```typescript
export interface Slot {
  hora: string
  disponible: boolean
  reserva_id: string | null
}

/** Genera array de horas ["09:00","09:30",...] entre inicio y fin con duracion_min de intervalo */
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

/** Filtra slots que ya están ocupados según el registro de disponibilidad */
export function getAvailableSlots(allSlots: string[], booked: Slot[]): string[] {
  const bookedHoras = new Set(booked.filter(s => !s.disponible).map(s => s.hora))
  return allSlots.filter(hora => !bookedHoras.has(hora))
}

/** Marca un slot como ocupado en el array de slots */
export function markSlotBooked(slots: Slot[], hora: string, reservaId: string): Slot[] {
  return slots.map(s =>
    s.hora === hora ? { ...s, disponible: false, reserva_id: reservaId } : s
  )
}
```

- [ ] **Step 4: Ejecutar tests — deben pasar**

```bash
npx vitest run tests/unit/slots.test.ts
```
Esperado: PASS — 6 tests pasando.

- [ ] **Step 5: Commit**

```bash
git add lib/slots.ts tests/unit/slots.test.ts
git commit -m "feat: slot generation logic (TDD)"
```

---

## Task 5: Auth OTP + registro de usuario

**Files:**
- Create: `app/api/auth/callback/route.ts`
- Create: `components/auth/OtpLoginModal.tsx`

- [ ] **Step 1: Crear callback de Supabase Auth**

Crear `app/api/auth/callback/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/error`)
}
```

- [ ] **Step 2: Crear modal de login OTP**

Crear `components/auth/OtpLoginModal.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface OtpLoginModalProps {
  open: boolean
  onClose: () => void
  redirectTo: string
  slug: string
}

export function OtpLoginModal({ open, onClose, redirectTo, slug }: OtpLoginModalProps) {
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSendOtp() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo}`,
        data: { nombre, barberia_slug: slug },
      },
    })
    setLoading(false)
    if (!error) setStep('sent')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Confirma tu identidad</DialogTitle>
        </DialogHeader>
        {step === 'email' ? (
          <div className="space-y-4">
            <Input
              placeholder="Tu nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
            <Button
              onClick={handleSendOtp}
              disabled={!email || !nombre || loading}
              className="w-full bg-yellow-400 text-black hover:bg-yellow-300"
            >
              {loading ? 'Enviando...' : 'Continuar'}
            </Button>
          </div>
        ) : (
          <p className="text-zinc-400 text-sm">
            Te enviamos un link a <strong className="text-white">{email}</strong>.
            Ábrelo para completar tu reserva.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Crear trigger en Supabase para auto-crear users row**

Agregar al final de `supabase/migrations/20260427000001_initial_schema.sql` (o nueva migración):
```sql
-- Trigger: crea fila en users al registrarse
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_barberia_id uuid;
  v_nombre text;
  v_slug text;
begin
  v_nombre := coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1));
  v_slug   := new.raw_user_meta_data->>'barberia_slug';

  if v_slug is not null then
    select id into v_barberia_id from barberias where slug = v_slug;
  end if;

  insert into users (id, barberia_id, rol, nombre)
  values (new.id, v_barberia_id, 'cliente', v_nombre);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

```bash
npx supabase db push
```

- [ ] **Step 4: Commit**

```bash
git add app/api/auth/ components/auth/
git commit -m "feat: OTP auth + auto-create user row trigger"
```

---

## Task 6: Booking público (página de reserva)

**Files:**
- Create: `app/[slug]/reservar/page.tsx`
- Create: `components/booking/BookingWizard.tsx`
- Create: `components/booking/ServiceSelector.tsx`
- Create: `components/booking/BarberSelector.tsx`
- Create: `components/booking/TimeSlotPicker.tsx`
- Create: `components/booking/BookingConfirm.tsx`
- Create: `hooks/useRealtimeSlots.ts`

- [ ] **Step 1: Crear página de reserva (Server Component)**

Crear `app/[slug]/reservar/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BookingWizard } from '@/components/booking/BookingWizard'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ref?: string }>
}

export default async function ReservarPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { ref } = await searchParams
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias')
    .select('id, nombre, logo_url, colores')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  if (!barberia) notFound()

  const { data: servicios } = await supabase
    .from('servicios')
    .select('id, nombre, descripcion, duracion_min, precio')
    .eq('barberia_id', barberia.id)
    .eq('activo', true)
    .order('orden')

  const { data: barberos } = await supabase
    .from('barberos')
    .select('id, nombre, foto_url')
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
          barberos={barberos ?? []}
          refCode={ref}
        />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Crear BookingWizard (orquestador de pasos)**

Crear `components/booking/BookingWizard.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { ServiceSelector } from './ServiceSelector'
import { BarberSelector } from './BarberSelector'
import { TimeSlotPicker } from './TimeSlotPicker'
import { BookingConfirm } from './BookingConfirm'

interface Servicio { id: string; nombre: string; descripcion: string | null; duracion_min: number; precio: number }
interface Barbero { id: string; nombre: string; foto_url: string | null }
interface Barberia { id: string; nombre: string; colores: { primary: string; background: string } | null }

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
      {/* Stepper */}
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
```

- [ ] **Step 3: Crear ServiceSelector**

Crear `components/booking/ServiceSelector.tsx`:
```tsx
'use client'
interface Servicio { id: string; nombre: string; descripcion: string | null; duracion_min: number; precio: number }
interface Props { servicios: Servicio[]; selected: Servicio | null; onSelect: (s: Servicio) => void }

export function ServiceSelector({ servicios, selected, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold mb-4">¿Qué servicio necesitas?</h2>
      {servicios.map(s => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          className={`w-full text-left p-4 rounded-xl border transition-all
            ${selected?.id === s.id
              ? 'border-yellow-400 bg-yellow-400/10'
              : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-white">{s.nombre}</p>
              {s.descripcion && <p className="text-zinc-400 text-sm mt-0.5">{s.descripcion}</p>}
              <p className="text-zinc-500 text-xs mt-1">{s.duracion_min} min</p>
            </div>
            <p className="text-yellow-400 font-bold text-lg">
              ${s.precio.toLocaleString('es-CL')}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Crear BarberSelector**

Crear `components/booking/BarberSelector.tsx`:
```tsx
'use client'
interface Barbero { id: string; nombre: string; foto_url: string | null }
interface Props { barberos: Barbero[]; selected: Barbero | null; onSelect: (b: Barbero) => void; onBack: () => void }

export function BarberSelector({ barberos, selected, onSelect, onBack }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">¿Con quién quieres atenderte?</h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {barberos.map(b => (
          <button
            key={b.id}
            onClick={() => onSelect(b)}
            className={`flex flex-col items-center p-3 rounded-xl border transition-all
              ${selected?.id === b.id ? 'border-yellow-400 bg-yellow-400/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}
          >
            <div className="w-14 h-14 rounded-full bg-zinc-700 mb-2 overflow-hidden">
              {b.foto_url
                ? <img src={b.foto_url} alt={b.nombre} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-zinc-400">{b.nombre[0]}</div>
              }
            </div>
            <span className="text-sm text-white">{b.nombre}</span>
          </button>
        ))}
      </div>
      <button onClick={onBack} className="text-zinc-400 text-sm hover:text-white transition-colors">← Volver</button>
    </div>
  )
}
```

- [ ] **Step 5: Crear hook useRealtimeSlots**

Crear `hooks/useRealtimeSlots.ts`:
```typescript
'use client'
import { useEffect, useState } from 'react'
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
  const supabase = createClient()

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

      // Si no hay registro, generar slots del horario estándar
      const bookedSlots: Slot[] = data?.slots ?? []
      const allSlots = generateSlots('09:00', '18:00', duracionMin)
      setAvailableSlots(getAvailableSlots(allSlots, bookedSlots))
      setLoading(false)
    }

    load()

    // Suscripción realtime para updates de disponibilidad
    const channel = supabase
      .channel(`slots-${barberoId}-${fechaStr}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'disponibilidad',
          filter: `barbero_id=eq.${barberoId}` },
        payload => {
          const bookedSlots: Slot[] = payload.new.slots ?? []
          const allSlots = generateSlots('09:00', '18:00', duracionMin)
          setAvailableSlots(getAvailableSlots(allSlots, bookedSlots))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [barberoId, fecha, duracionMin])

  return { availableSlots, loading }
}
```

- [ ] **Step 6: Crear TimeSlotPicker**

Crear `components/booking/TimeSlotPicker.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRealtimeSlots } from '@/hooks/useRealtimeSlots'
import { addDays, format, isBefore, startOfDay } from 'date-fns'
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

      {/* Selector de fecha */}
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

      {/* Slots de hora */}
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

- [ ] **Step 7: Crear BookingConfirm**

Crear `components/booking/BookingConfirm.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OtpLoginModal } from '@/components/auth/OtpLoginModal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useParams } from 'next/navigation'

interface Props {
  barberia: { id: string; nombre: string; colores: { primary: string } | null }
  servicio: { id: string; nombre: string; precio: number; duracion_min: number }
  barbero: { id: string; nombre: string }
  fecha: Date
  hora: string
  refCode?: string
  onBack: () => void
}

export function BookingConfirm({ barberia, servicio, barbero, fecha, hora, refCode, onBack }: Props) {
  const params = useParams()
  const slug = params.slug as string
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const supabase = createClient()

  async function confirmar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      setShowLogin(true)
      return
    }

    const fechaHora = new Date(fecha)
    const [h, m] = hora.split(':').map(Number)
    fechaHora.setHours(h, m, 0, 0)

    await supabase.from('reservas').insert({
      barberia_id: barberia.id,
      cliente_id: user.id,
      barbero_id: barbero.id,
      servicio_id: servicio.id,
      fecha_hora: fechaHora.toISOString(),
      precio: servicio.precio,
      descuento: 0,
      precio_final: servicio.precio,
      estado: 'confirmada',
      origen: 'web',
    })

    setLoading(false)
    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-white mb-2">¡Reserva confirmada!</h2>
        <p className="text-zinc-400 text-sm">Te enviamos la confirmación por email.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Confirma tu reserva</h2>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-zinc-400 text-sm">Servicio</span>
          <span className="text-white font-medium">{servicio.nombre}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400 text-sm">Barbero</span>
          <span className="text-white font-medium">{barbero.nombre}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400 text-sm">Fecha</span>
          <span className="text-white font-medium">
            {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400 text-sm">Hora</span>
          <span className="text-white font-medium">{hora}</span>
        </div>
        <div className="flex justify-between border-t border-zinc-800 pt-3">
          <span className="text-zinc-400 text-sm">Total</span>
          <span className="text-yellow-400 font-bold text-lg">
            ${servicio.precio.toLocaleString('es-CL')}
          </span>
        </div>
      </div>

      <button
        onClick={confirmar}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-yellow-400 text-black font-bold
          hover:bg-yellow-300 transition-colors disabled:opacity-50"
      >
        {loading ? 'Procesando...' : 'Confirmar reserva'}
      </button>

      <button onClick={onBack} className="w-full mt-3 text-zinc-400 text-sm hover:text-white transition-colors">
        ← Volver
      </button>

      <OtpLoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        redirectTo={`/${slug}/reservar`}
        slug={slug}
      />
    </div>
  )
}
```

- [ ] **Step 8: Ejecutar dev y probar el flujo manualmente**

```bash
npm run dev
```
Abrir `http://localhost:3000/barberia-demo/reservar` y completar el flujo de los 4 pasos.

- [ ] **Step 9: Commit**

```bash
git add app/[slug]/reservar/ components/booking/ hooks/useRealtimeSlots.ts
git commit -m "feat: booking público — wizard 4 pasos con realtime slots"
```

---

## Task 7: Notificaciones por email (Resend + React Email)

**Files:**
- Create: `emails/ReservationConfirmed.tsx`
- Create: `emails/Reminder24h.tsx`
- Create: `app/api/send-confirmation/route.ts`
- Create: `supabase/functions/send-reminders/index.ts`

- [ ] **Step 1: Crear template de confirmación**

Crear `emails/ReservationConfirmed.tsx`:
```tsx
import {
  Body, Container, Head, Heading, Html,
  Preview, Section, Text, Hr
} from '@react-email/components'

interface Props {
  clienteNombre: string
  servicio: string
  barbero: string
  fecha: string
  hora: string
  barberiaNombre: string
  precio: string
}

export function ReservationConfirmed({
  clienteNombre, servicio, barbero, fecha, hora, barberiaNombre, precio
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Tu reserva en {barberiaNombre} está confirmada</Preview>
      <Body style={{ backgroundColor: '#111111', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '500px', margin: '0 auto', padding: '32px 16px' }}>
          <Heading style={{ color: '#e8c84a', fontSize: '24px' }}>
            ✅ Reserva confirmada
          </Heading>
          <Text style={{ color: '#aaaaaa' }}>Hola {clienteNombre},</Text>
          <Text style={{ color: '#ffffff' }}>Tu hora en <strong>{barberiaNombre}</strong> está confirmada:</Text>
          <Section style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <Text style={{ color: '#aaaaaa', margin: '4px 0' }}>Servicio: <span style={{ color: '#fff' }}>{servicio}</span></Text>
            <Text style={{ color: '#aaaaaa', margin: '4px 0' }}>Barbero: <span style={{ color: '#fff' }}>{barbero}</span></Text>
            <Text style={{ color: '#aaaaaa', margin: '4px 0' }}>Fecha: <span style={{ color: '#fff' }}>{fecha}</span></Text>
            <Text style={{ color: '#aaaaaa', margin: '4px 0' }}>Hora: <span style={{ color: '#fff' }}>{hora}</span></Text>
            <Hr style={{ borderColor: '#333' }} />
            <Text style={{ color: '#e8c84a', fontWeight: 'bold', margin: '4px 0' }}>Total: {precio}</Text>
          </Section>
          <Text style={{ color: '#666666', fontSize: '12px', marginTop: '24px' }}>
            Si necesitas cancelar, responde este correo.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] **Step 2: Crear template de recordatorio**

Crear `emails/Reminder24h.tsx`:
```tsx
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'

interface Props {
  clienteNombre: string
  servicio: string
  barbero: string
  hora: string
  barberiaNombre: string
}

export function Reminder24h({ clienteNombre, servicio, barbero, hora, barberiaNombre }: Props) {
  return (
    <Html>
      <Head />
      <Preview>⏰ Recordatorio: tu cita en {barberiaNombre} es mañana a las {hora}</Preview>
      <Body style={{ backgroundColor: '#111111', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '500px', margin: '0 auto', padding: '32px 16px' }}>
          <Heading style={{ color: '#e8c84a' }}>⏰ Tu cita es mañana</Heading>
          <Text style={{ color: '#ffffff' }}>Hola {clienteNombre}, te recordamos:</Text>
          <Section style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <Text style={{ color: '#aaaaaa', margin: '4px 0' }}>Servicio: <span style={{ color: '#fff' }}>{servicio}</span></Text>
            <Text style={{ color: '#aaaaaa', margin: '4px 0' }}>Barbero: <span style={{ color: '#fff' }}>{barbero}</span></Text>
            <Text style={{ color: '#e8c84a', fontWeight: 'bold', margin: '4px 0' }}>Hora: {hora}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] **Step 3: Crear API route de confirmación**

Crear `app/api/send-confirmation/route.ts`:
```typescript
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { ReservationConfirmed } from '@/emails/ReservationConfirmed'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { reservaId } = await request.json()
  const supabase = createAdminClient()

  const { data: reserva } = await supabase
    .from('reservas')
    .select(`
      id, fecha_hora, precio_final, cliente_email, cliente_nombre,
      servicios(nombre),
      barberos(nombre),
      barberias(nombre)
    `)
    .eq('id', reservaId)
    .single()

  if (!reserva || !reserva.cliente_email) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  const fecha = new Date(reserva.fecha_hora)

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: reserva.cliente_email,
    subject: `✅ Reserva confirmada — ${(reserva.barberias as any).nombre}`,
    html: await render(ReservationConfirmed({
      clienteNombre: reserva.cliente_nombre ?? 'Cliente',
      servicio: (reserva.servicios as any).nombre,
      barbero: (reserva.barberos as any).nombre,
      fecha: fecha.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }),
      hora: fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      barberiaNombre: (reserva.barberias as any).nombre,
      precio: `$${reserva.precio_final.toLocaleString('es-CL')}`,
    })),
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Crear Edge Function para recordatorios**

Crear `supabase/functions/send-reminders/index.ts`:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@3'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async () => {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const window_start = new Date(in24h.getTime() - 15 * 60 * 1000)
  const window_end   = new Date(in24h.getTime() + 15 * 60 * 1000)

  const { data: reservas } = await supabase
    .from('reservas')
    .select('id, fecha_hora, cliente_email, cliente_nombre, servicios(nombre), barberos(nombre), barberias(nombre)')
    .eq('estado', 'confirmada')
    .gte('fecha_hora', window_start.toISOString())
    .lte('fecha_hora', window_end.toISOString())

  for (const r of reservas ?? []) {
    if (!r.cliente_email) continue
    const hora = new Date(r.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    await resend.emails.send({
      from: Deno.env.get('RESEND_FROM_EMAIL')!,
      to: r.cliente_email,
      subject: `⏰ Recordatorio: tu cita es mañana a las ${hora}`,
      html: `<p>Hola ${r.cliente_nombre}, tu cita de ${(r.servicios as any).nombre} con ${(r.barberos as any).nombre} es mañana a las ${hora}.</p>`,
    })
  }

  return new Response(JSON.stringify({ sent: reservas?.length ?? 0 }))
})
```

- [ ] **Step 5: Desplegar Edge Function**

```bash
npx supabase functions deploy send-reminders
```

Configurar cron en Supabase Dashboard → Edge Functions → send-reminders → Schedule:
`0 * * * *` (cada hora)

- [ ] **Step 6: Commit**

```bash
git add emails/ app/api/send-confirmation/ supabase/functions/
git commit -m "feat: email notifications — confirmation + 24h reminder cron"
```

---

## Task 8: Panel admin — Dashboard y Agenda

**Files:**
- Create: `app/[slug]/admin/layout.tsx`
- Create: `app/[slug]/admin/page.tsx`
- Create: `app/[slug]/admin/agenda/page.tsx`
- Create: `components/admin/StatsCards.tsx`
- Create: `components/admin/AgendaCalendar.tsx`

- [ ] **Step 1: Crear layout del admin**

Crear `app/[slug]/admin/layout.tsx`:
```tsx
import Link from 'next/link'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const navItems = [
    { href: `/${slug}/admin`, label: 'Dashboard', icon: '📊' },
    { href: `/${slug}/admin/clientes`, label: 'Clientes', icon: '👥' },
    { href: `/${slug}/admin/barberos`, label: 'Barberos', icon: '✂️' },
    { href: `/${slug}/admin/servicios`, label: 'Servicios', icon: '💈' },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 flex-col bg-zinc-900 border-r border-zinc-800 p-4">
        <div className="text-yellow-400 font-bold text-lg mb-8 px-2">⚙ Admin</div>
        <nav className="flex flex-col gap-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-400
                hover:text-white hover:bg-zinc-800 transition-colors text-sm"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 text-white overflow-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Crear StatsCards**

Crear `components/admin/StatsCards.tsx`:
```tsx
interface Stat { label: string; value: string; sub?: string; color?: string }
export function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">{s.label}</p>
          <p className={`text-2xl font-bold ${s.color ?? 'text-white'}`}>{s.value}</p>
          {s.sub && <p className="text-zinc-500 text-xs mt-1">{s.sub}</p>}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Crear dashboard admin**

Crear `app/[slug]/admin/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StatsCards } from '@/components/admin/StatsCards'
import { startOfDay, endOfDay, startOfMonth } from 'date-fns'

export default async function AdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id, nombre').eq('slug', slug).single()
  if (!barberia) notFound()

  const today = new Date()
  const [{ data: citasHoy }, { data: citasMes }, { data: canceladas }] = await Promise.all([
    supabase.from('reservas').select('id, precio_final')
      .eq('barberia_id', barberia.id).eq('estado', 'confirmada')
      .gte('fecha_hora', startOfDay(today).toISOString())
      .lte('fecha_hora', endOfDay(today).toISOString()),
    supabase.from('reservas').select('precio_final')
      .eq('barberia_id', barberia.id).eq('estado', 'completada')
      .gte('fecha_hora', startOfMonth(today).toISOString()),
    supabase.from('reservas').select('id')
      .eq('barberia_id', barberia.id).eq('estado', 'cancelada')
      .gte('fecha_hora', startOfDay(today).toISOString()),
  ])

  const ingresosMes = citasMes?.reduce((s, r) => s + r.precio_final, 0) ?? 0

  const stats = [
    { label: 'Citas hoy', value: String(citasHoy?.length ?? 0), color: 'text-blue-400' },
    { label: 'Ingresos mes', value: `$${Math.round(ingresosMes / 1000)}k`, color: 'text-green-400' },
    { label: 'Canceladas hoy', value: String(canceladas?.length ?? 0), color: 'text-red-400' },
    { label: 'Completadas mes', value: String(citasMes?.length ?? 0), color: 'text-yellow-400' },
  ]

  // Agenda de hoy
  const { data: agendaHoy } = await supabase
    .from('reservas')
    .select('id, fecha_hora, estado, cliente_nombre, servicios(nombre), barberos(nombre)')
    .eq('barberia_id', barberia.id)
    .in('estado', ['confirmada', 'completada'])
    .gte('fecha_hora', startOfDay(today).toISOString())
    .lte('fecha_hora', endOfDay(today).toISOString())
    .order('fecha_hora')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{barberia.nombre}</h1>
      <StatsCards stats={stats} />

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Agenda de hoy</h2>
        <div className="space-y-2">
          {agendaHoy?.map(r => (
            <div key={r.id} className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.estado === 'completada' ? 'bg-green-500' : 'bg-yellow-400'}`} />
              <span className="text-white font-mono text-sm w-12">
                {new Date(r.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-white flex-1">{r.cliente_nombre ?? 'Sin nombre'}</span>
              <span className="text-zinc-400 text-sm">{(r.servicios as any)?.nombre}</span>
              <span className="text-zinc-500 text-sm">{(r.barberos as any)?.nombre}</span>
            </div>
          ))}
          {!agendaHoy?.length && <p className="text-zinc-500 text-sm">No hay citas para hoy</p>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/[slug]/admin/ components/admin/StatsCards.tsx
git commit -m "feat: panel admin — dashboard con stats y agenda del día"
```

---

## Task 9: Panel admin — CRUD Clientes, Barberos, Servicios

**Files:**
- Create: `app/[slug]/admin/clientes/page.tsx`
- Create: `app/[slug]/admin/barberos/page.tsx`
- Create: `app/[slug]/admin/servicios/page.tsx`

- [ ] **Step 1: Página de clientes**

Crear `app/[slug]/admin/clientes/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function ClientesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).single()
  if (!barberia) notFound()

  const { data: clientes } = await supabase
    .from('users')
    .select('id, nombre, telefono, created_at')
    .eq('barberia_id', barberia.id)
    .eq('rol', 'cliente')
    .eq('activo', true)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800">
            <tr>
              <th className="text-left p-3 text-zinc-400 font-medium">Nombre</th>
              <th className="text-left p-3 text-zinc-400 font-medium">Teléfono</th>
              <th className="text-left p-3 text-zinc-400 font-medium">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {clientes?.map(c => (
              <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="p-3 text-white">{c.nombre}</td>
                <td className="p-3 text-zinc-400">{c.telefono ?? '—'}</td>
                <td className="p-3 text-zinc-400">
                  {new Date(c.created_at).toLocaleDateString('es-CL')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!clientes?.length && (
          <p className="text-zinc-500 text-center py-8">Aún no hay clientes registrados</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Página de servicios con Server Action para CRUD**

Crear `app/[slug]/admin/servicios/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'

async function upsertServicio(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string | null
  const barberia_id = formData.get('barberia_id') as string
  const slug = formData.get('slug') as string

  const payload = {
    barberia_id,
    nombre: formData.get('nombre') as string,
    descripcion: formData.get('descripcion') as string,
    duracion_min: Number(formData.get('duracion_min')),
    precio: Number(formData.get('precio')),
    activo: true,
  }

  if (id) {
    await supabase.from('servicios').update(payload).eq('id', id)
  } else {
    await supabase.from('servicios').insert(payload)
  }
  revalidatePath(`/${slug}/admin/servicios`)
}

export default async function ServiciosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).single()
  if (!barberia) notFound()

  const { data: servicios } = await supabase
    .from('servicios').select('*').eq('barberia_id', barberia.id).order('orden')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Servicios</h1>

      {/* Form nuevo servicio */}
      <form action={upsertServicio} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 grid grid-cols-2 gap-3">
        <input type="hidden" name="barberia_id" value={barberia.id} />
        <input type="hidden" name="slug" value={slug} />
        <input name="nombre" placeholder="Nombre del servicio" required
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm col-span-2" />
        <input name="descripcion" placeholder="Descripción (opcional)"
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm col-span-2" />
        <input name="duracion_min" type="number" placeholder="Duración (min)" required
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
        <input name="precio" type="number" placeholder="Precio ($)" required
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
        <button type="submit"
          className="col-span-2 py-2 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-300 transition-colors text-sm">
          Agregar servicio
        </button>
      </form>

      {/* Lista de servicios */}
      <div className="space-y-2">
        {servicios?.map(s => (
          <div key={s.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <div>
              <p className="text-white font-medium">{s.nombre}</p>
              <p className="text-zinc-400 text-sm">{s.duracion_min} min</p>
            </div>
            <p className="text-yellow-400 font-bold">${s.precio.toLocaleString('es-CL')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Página de barberos**

Crear `app/[slug]/admin/barberos/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'

async function crearBarbero(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const barberia_id = formData.get('barberia_id') as string
  const slug = formData.get('slug') as string
  await supabase.from('barberos').insert({
    barberia_id,
    nombre: formData.get('nombre') as string,
    activo: true,
  })
  revalidatePath(`/${slug}/admin/barberos`)
}

export default async function BarberosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).single()
  if (!barberia) notFound()

  const { data: barberos } = await supabase
    .from('barberos').select('*').eq('barberia_id', barberia.id).eq('activo', true)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Barberos</h1>
      <form action={crearBarbero} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex gap-3">
        <input type="hidden" name="barberia_id" value={barberia.id} />
        <input type="hidden" name="slug" value={slug} />
        <input name="nombre" placeholder="Nombre del barbero" required
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />
        <button type="submit"
          className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-300 text-sm">
          Agregar
        </button>
      </form>
      <div className="space-y-2">
        {barberos?.map(b => (
          <div key={b.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
              {b.nombre[0]}
            </div>
            <p className="text-white font-medium">{b.nombre}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/[slug]/admin/clientes/ app/[slug]/admin/barberos/ app/[slug]/admin/servicios/
git commit -m "feat: admin CRUD — clientes, barberos, servicios"
```

---

## Task 10: Portal del cliente

**Files:**
- Create: `app/[slug]/cliente/layout.tsx`
- Create: `app/[slug]/cliente/page.tsx`

- [ ] **Step 1: Crear layout cliente**

Crear `app/[slug]/cliente/layout.tsx`:
```tsx
export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-6">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Crear portal del cliente**

Crear `app/[slug]/cliente/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ClientePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${slug}/reservar?login=true`)

  const { data: barberia } = await supabase
    .from('barberias').select('id, nombre').eq('slug', slug).single()
  if (!barberia) notFound()

  const { data: userData } = await supabase
    .from('users').select('nombre, referral_code').eq('id', user.id).single()

  const { data: proximaCita } = await supabase
    .from('reservas')
    .select('id, fecha_hora, servicios(nombre), barberos(nombre)')
    .eq('cliente_id', user.id)
    .eq('barberia_id', barberia.id)
    .eq('estado', 'confirmada')
    .gte('fecha_hora', new Date().toISOString())
    .order('fecha_hora')
    .limit(1)
    .single()

  const { data: historial } = await supabase
    .from('reservas')
    .select('id, fecha_hora, estado, precio_final, servicios(nombre), barberos(nombre)')
    .eq('cliente_id', user.id)
    .eq('barberia_id', barberia.id)
    .in('estado', ['completada', 'cancelada'])
    .order('fecha_hora', { ascending: false })
    .limit(10)

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-white text-lg font-bold">
          {userData?.nombre?.[0] ?? '?'}
        </div>
        <div>
          <p className="font-bold text-white text-lg">{userData?.nombre}</p>
          <p className="text-zinc-400 text-sm">{barberia.nombre}</p>
        </div>
      </div>

      {/* Próxima cita */}
      {proximaCita && (
        <div className="bg-zinc-900 border border-yellow-400/30 rounded-xl p-4 mb-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-2">Próxima cita</p>
          <p className="text-white font-semibold">
            {new Date(proximaCita.fecha_hora).toLocaleDateString('es-CL', {
              weekday: 'long', day: 'numeric', month: 'long'
            })}
          </p>
          <p className="text-yellow-400 font-bold">
            {new Date(proximaCita.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            {' — '}{(proximaCita.servicios as any)?.nombre} con {(proximaCita.barberos as any)?.nombre}
          </p>
        </div>
      )}

      {/* Código referido */}
      {userData?.referral_code && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-2">Tu código de referido</p>
          <div className="flex items-center justify-between">
            <p className="text-white text-xl font-bold tracking-widest">{userData.referral_code}</p>
            <CopyReferralButton
              referralCode={userData.referral_code}
              slug={slug}
            />
          </div>
          <p className="text-zinc-500 text-xs mt-2">Comparte y gana descuentos al traer amigos</p>
        </div>
      )}

      {/* Historial */}
      <div>
        <p className="text-zinc-400 text-xs uppercase tracking-wide mb-3">Historial</p>
        <div className="space-y-2">
          {historial?.map(r => (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-white text-sm font-medium">{(r.servicios as any)?.nombre}</p>
                <p className="text-zinc-400 text-xs">
                  {new Date(r.fecha_hora).toLocaleDateString('es-CL')} · {(r.barberos as any)?.nombre}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white text-sm">${r.precio_final.toLocaleString('es-CL')}</p>
                <span className={`text-xs ${r.estado === 'completada' ? 'text-green-400' : 'text-red-400'}`}>
                  {r.estado}
                </span>
              </div>
            </div>
          ))}
          {!historial?.length && <p className="text-zinc-500 text-sm">Aún no tienes reservas pasadas</p>}
        </div>
      </div>

      <Link href={`/${slug}/reservar`}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-black font-bold
          px-8 py-3 rounded-full shadow-lg hover:bg-yellow-300 transition-colors">
        + Nueva reserva
      </Link>
    </div>
  )
}
```

Crear `components/cliente/CopyReferralButton.tsx` (Client Component para el clipboard):
```tsx
'use client'
interface Props { referralCode: string; slug: string }
export function CopyReferralButton({ referralCode, slug }: Props) {
  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}/${slug}/reservar?ref=${referralCode}`)
  }
  return (
    <button onClick={copy}
      className="text-xs bg-zinc-800 px-3 py-1 rounded-lg text-yellow-400 hover:bg-zinc-700">
      Copiar link
    </button>
  )
}
```

Agregar al inicio de `app/[slug]/cliente/page.tsx`:
```tsx
import { CopyReferralButton } from '@/components/cliente/CopyReferralButton'
```

- [ ] **Step 3: Commit**

```bash
git add app/[slug]/cliente/ components/cliente/
git commit -m "feat: portal cliente — próxima cita, referidos, historial"
```

---

## Task 11: Vista del barbero

**Files:**
- Create: `app/[slug]/barbero/layout.tsx`
- Create: `app/[slug]/barbero/page.tsx`

- [ ] **Step 1: Crear vista del barbero**

Crear `app/[slug]/barbero/layout.tsx`:
```tsx
export default function BarberoLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-zinc-950 text-white p-4 max-w-lg mx-auto">{children}</div>
}
```

Crear `app/[slug]/barbero/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { startOfDay, endOfDay } from 'date-fns'

async function updateEstado(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = formData.get('id') as string
  const estado = formData.get('estado') as string
  const slug = formData.get('slug') as string
  await supabase.from('reservas').update({ estado }).eq('id', id)
}

export default async function BarberoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${slug}/reservar?login=true`)

  const { data: barberia } = await supabase
    .from('barberias').select('id').eq('slug', slug).single()
  if (!barberia) notFound()

  const { data: barbero } = await supabase
    .from('barberos').select('id, nombre').eq('user_id', user.id).eq('barberia_id', barberia.id).single()

  if (!barbero) return <p className="text-zinc-400 p-8">No estás registrado como barbero en esta barbería.</p>

  const today = new Date()
  const { data: citas } = await supabase
    .from('reservas')
    .select('id, fecha_hora, estado, cliente_nombre, precio_final, servicios(nombre)')
    .eq('barbero_id', barbero.id)
    .eq('barberia_id', barberia.id)
    .gte('fecha_hora', startOfDay(today).toISOString())
    .lte('fecha_hora', endOfDay(today).toISOString())
    .order('fecha_hora')

  const ingresos = citas?.filter(c => c.estado === 'completada').reduce((s, c) => s + c.precio_final, 0) ?? 0

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">{barbero.nombre}</h1>
          <p className="text-zinc-400 text-sm">Agenda de hoy</p>
        </div>
        <div className="text-right bg-zinc-900 rounded-xl px-4 py-2">
          <p className="text-green-400 font-bold text-lg">${ingresos.toLocaleString('es-CL')}</p>
          <p className="text-zinc-500 text-xs">hoy</p>
        </div>
      </div>

      <div className="space-y-3">
        {citas?.map(c => (
          <div key={c.id}
            className={`border rounded-xl p-4 ${
              c.estado === 'completada' ? 'border-green-800 bg-green-900/20' :
              c.estado === 'no_show' ? 'border-zinc-800 bg-zinc-900/50 opacity-60' :
              'border-yellow-400/30 bg-zinc-900'
            }`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-white font-semibold">
                  {new Date(c.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  {' — '}{c.cliente_nombre ?? 'Sin nombre'}
                </p>
                <p className="text-zinc-400 text-sm">{(c.servicios as any)?.nombre}</p>
              </div>
              <p className="text-white font-bold">${c.precio_final.toLocaleString('es-CL')}</p>
            </div>

            {c.estado === 'confirmada' && (
              <div className="flex gap-2">
                <form action={updateEstado}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="estado" value="completada" />
                  <input type="hidden" name="slug" value={slug} />
                  <button type="submit"
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-500">
                    ✓ Completado
                  </button>
                </form>
                <form action={updateEstado}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="estado" value="no_show" />
                  <input type="hidden" name="slug" value={slug} />
                  <button type="submit"
                    className="px-3 py-1 bg-zinc-700 text-zinc-300 text-xs rounded-lg hover:bg-zinc-600">
                    No asistió
                  </button>
                </form>
              </div>
            )}
            {c.estado === 'completada' && <span className="text-green-400 text-xs">✓ Completado</span>}
            {c.estado === 'no_show' && <span className="text-zinc-500 text-xs">No asistió</span>}
          </div>
        ))}
        {!citas?.length && <p className="text-zinc-500 text-center py-8">No hay citas para hoy</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[slug]/barbero/
git commit -m "feat: vista barbero — agenda del día + marcar completado/no-show"
```

---

## Task 12: Landing de la barbería

**Files:**
- Create: `app/[slug]/page.tsx`

- [ ] **Step 1: Crear landing**

Crear `app/[slug]/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function BarberiaLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id, nombre, logo_url, colores').eq('slug', slug).eq('activo', true).single()
  if (!barberia) notFound()

  const { data: servicios } = await supabase
    .from('servicios').select('nombre, precio, duracion_min')
    .eq('barberia_id', barberia.id).eq('activo', true).order('orden').limit(6)

  const { data: barberos } = await supabase
    .from('barberos').select('nombre, foto_url')
    .eq('barberia_id', barberia.id).eq('activo', true)

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-[40vh] px-4 py-16 text-center">
        {barberia.logo_url && (
          <img src={barberia.logo_url} alt={barberia.nombre} className="h-20 mb-4" />
        )}
        <h1 className="text-4xl font-bold text-white mb-2">{barberia.nombre}</h1>
        <p className="text-zinc-400 mb-8">Tu estilo, tu identidad</p>
        <Link href={`/${slug}/reservar`}
          className="px-8 py-4 bg-yellow-400 text-black font-bold text-lg rounded-full hover:bg-yellow-300 transition-colors">
          Reservar hora
        </Link>
      </section>

      {/* Servicios */}
      {servicios && servicios.length > 0 && (
        <section className="max-w-2xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Nuestros servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servicios.map(s => (
              <div key={s.nombre} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">{s.nombre}</p>
                  <p className="text-zinc-400 text-sm">{s.duracion_min} min</p>
                </div>
                <p className="text-yellow-400 font-bold">${s.precio.toLocaleString('es-CL')}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Equipo */}
      {barberos && barberos.length > 0 && (
        <section className="max-w-2xl mx-auto px-4 py-8 pb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Nuestro equipo</h2>
          <div className="flex justify-center gap-6">
            {barberos.map(b => (
              <div key={b.nombre} className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-zinc-700 mb-2 overflow-hidden">
                  {b.foto_url
                    ? <img src={b.foto_url} alt={b.nombre} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">{b.nombre[0]}</div>
                  }
                </div>
                <p className="text-white text-sm font-medium">{b.nombre}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[slug]/page.tsx
git commit -m "feat: landing pública de la barbería"
```

---

## Task 13: Deploy en Vercel

**Files:**
- Modify: `.env.local.example` (ya existe)

- [ ] **Step 1: Crear proyecto en Vercel**

```bash
npm install -g vercel
vercel login
vercel
```
Responder: proyecto nuevo, Next.js detectado automáticamente.

- [ ] **Step 2: Configurar variables de entorno en Vercel**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM_EMAIL production
vercel env add NEXT_PUBLIC_APP_URL production
```

- [ ] **Step 3: Configurar dominio (opcional)**

En Vercel Dashboard → Project → Domains → Add Domain → ingresar dominio del cliente.

En el proveedor de DNS del cliente, crear registro CNAME apuntando a `cname.vercel-dns.com`.

- [ ] **Step 4: Deploy a producción**

```bash
vercel --prod
```
Esperado: URL de producción `https://barberia-saas.vercel.app` (o dominio custom).

- [ ] **Step 5: Verificar funcionalidad end-to-end**

1. Abrir `https://tu-dominio.cl/barberia-demo/reservar`
2. Completar flujo completo de reserva (servicio → barbero → hora → confirmar con OTP)
3. Verificar que llega email de confirmación
4. Abrir `https://tu-dominio.cl/barberia-demo/admin` y revisar que aparece la cita
5. Abrir `https://tu-dominio.cl/barberia-demo/barbero` y marcar como completada

- [ ] **Step 6: Commit final**

```bash
git add .
git commit -m "feat: deploy Vercel — barbería SaaS MVP v1.0 🚀"
```

---

## Tests de integración (opcional pero recomendado)

Crear `tests/integration/booking.test.ts`:
```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import { generateSlots, getAvailableSlots } from '@/lib/slots'

describe('Booking flow integration', () => {
  it('el flujo completo genera slots correctos para una cita de 30 min', () => {
    const slots = generateSlots('09:00', '18:00', 30)
    expect(slots).toHaveLength(18)
    expect(slots[0]).toBe('09:00')
    expect(slots[17]).toBe('17:30')
  })

  it('después de reservar 09:00, ese slot no está disponible', () => {
    const allSlots = generateSlots('09:00', '11:00', 30)
    const booked = [{ hora: '09:00', disponible: false, reserva_id: 'reserva-1' }]
    const available = getAvailableSlots(allSlots, booked)
    expect(available).not.toContain('09:00')
    expect(available).toContain('09:30')
  })
})
```

```bash
npx vitest run tests/
```

---

## Próximos pasos — Fases 2, 3 y 4

Una vez validado el MVP con el primer cliente:

- **Fase 2:** `docs/superpowers/plans/2026-XX-XX-barberia-fase2-fidelizacion.md`
  - Suscripciones mensuales + adaptador de pagos (Flow/MercadoPago/Stripe)
  - Sistema de referidos con recompensas
  - Notificaciones push (FCM)
  - Calificaciones post-servicio

- **Fase 3:** `docs/superpowers/plans/2026-XX-XX-barberia-fase3-crecimiento.md`
  - Campañas y promociones segmentadas
  - Alianzas estratégicas
  - IA con Claude API (Haiku) — recomendaciones y sugerencias

- **Fase 4:** `docs/superpowers/plans/2026-XX-XX-barberia-fase4-saas.md`
  - Panel superadmin para gestión de tenants
  - Onboarding self-service de nuevas barberías
  - Billing propio (cobrar suscripción mensual a cada barbería)
