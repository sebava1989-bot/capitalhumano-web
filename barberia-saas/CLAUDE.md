# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
# Next.js web app (run from barberia-saas/)
npm run dev        # localhost:3000
npm run build
npm run lint
npm run test       # Vitest (single run)
npm run test:watch

# Flutter admin app (run from barberia-saas/barberia_admin/)
flutter pub get
flutter run
flutter build apk --release
```

To run a single test file: `npx vitest run tests/nombre.test.ts`

## Architecture Overview

Multi-tenant SaaS for barbershops in Chile. Stack: **Next.js 16 App Router + Supabase + Resend + Claude Haiku + Flutter admin app**.

Each barbershop is identified by a `slug`. All Next.js routes live under `app/[slug]/` and every DB query must be scoped by `barberia_id` (resolved from slug).

### Route Map

| Path | Purpose |
|------|---------|
| `/{slug}` | Public landing page |
| `/{slug}/login` | Client auth (login / registro / reset) |
| `/{slug}/reservar` | 3-step booking wizard (barbero → servicio → hora) |
| `/{slug}/cliente` | Client portal (mis reservas, descuentos, referidos) |
| `/{slug}/barbero` | Barber portal |
| `/{slug}/admin/*` | Admin dashboard (being replaced by Flutter app) |

### Supabase Client Pattern (Critical)

There are three clients — use the right one or queries fail silently on Vercel:

| Client | File | When to use |
|--------|------|-------------|
| `createServerClient` | `lib/supabase/server.ts` | Server Components reading user session |
| `createBrowserClient` | `lib/supabase/client.ts` | Client Components |
| `createAdminClient` | `lib/supabase/admin.ts` | All Server Actions and mutations (service role key) |

**Server Actions must use `createAdminClient()`**, not the SSR client. The SSR client fails silently in Vercel's server action context and returns 404.

### Auth & Role Guard

- Roles stored in `public.users.rol` (values: `cliente`, `admin`, `barbero`)
- `lib/auth/assertAdmin.ts` exports:
  - `assertAdminBySlug(slug)` — redirects if not admin (use in page.tsx)
  - `checkAdmin(barberiaId)` — silent boolean check (use in server actions)
- Admin registration uses `admin.auth.admin.createUser()` with `email_confirm: true` to skip email verification

### Booking Slots

`lib/slots.ts`:
- `generateSlots(inicio, fin, duracionMin)` — creates time slots from barbero availability
- `getAvailableSlots()` — filters out already-booked times
- All dates are stored as UTC and displayed in `America/Santiago` timezone via `date-fns-tz`

### AI Integration

`lib/ai.ts` exposes `askClaude(prompt)` using `claude-haiku-4-5-20251001` (512 tokens max). Used for service recommendations in the client portal and personalized bulk discount emails.

### Email

Resend (`RESEND_API_KEY`) sends transactional emails. Supabase Edge Functions in `supabase/functions/` handle:
- `send-reminders` — 24h booking reminders (triggered by pg_cron)
- `notify-admin` — cancellation alerts
- `send-discount` — bulk campaign emails

### Realtime

`components/admin/RealtimeAdminRefresh.tsx` uses Supabase subscriptions to auto-refresh the admin dashboard without full page reloads.

### Flutter Admin App (`barberia_admin/`)

Standalone Flutter app connecting directly to Supabase (same project). Key services in `lib/services/` mirror the web admin functionality. Config in `lib/config/supabase_config.dart`.

## Key Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY     # required for admin client
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_APP_URL
INTERNAL_API_SECRET
```

## Database Conventions

- Multi-tenancy enforced by `barberia_id` on all tables (RLS enabled)
- `users` table extends Supabase Auth — `id` matches `auth.users.id`
- Referral codes are 6-char alphanumeric stored in `users.referral_code`; reward = 10% discount applied to both referrer and referee
- Alianzas (partnerships) track usage per client via `alianza_usos` table

## TypeScript

- Strict mode enabled; path alias `@/*` maps to repo root
- Database types auto-generated in `types/database.ts` — do not edit manually, regenerate with `supabase gen types typescript`
- Test environment: jsdom via Vitest + `@testing-library/react`
