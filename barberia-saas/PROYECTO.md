# Barbería SaaS — Contexto del proyecto

Eres mi asistente de desarrollo. Estamos construyendo un SaaS multi-tenant
para barberías en Chile.

## Stack técnico
- Frontend/Backend: Next.js 16 App Router + TypeScript
- Base de datos y auth: Supabase (proyecto rcdcgonvmwzthdumpwga)
- Deploy web: Vercel Hobby ($0) → https://barberia-saas-gamma.vercel.app
- Emails: Resend API
- Pagos: Flow (pendiente integración)
- IA: Claude API (claude-haiku-4-5-20251001) — $0.50–$1/mes a escala demo
- Push: FCM (pendiente Firebase config)
- Repo local: C:\Users\sebas\barberia-saas (branch main)

## Costos actuales
| Servicio     | Plan       | Costo    |
|--------------|------------|----------|
| Vercel       | Hobby      | $0/mes   |
| Supabase     | Free       | $0/mes   |
| Claude API   | Haiku 4.5  | ~$1/mes  |

## Arquitectura multi-tenant
Cada barbería tiene un slug único. Las rutas web son:
- `/{slug}`              → landing pública de la barbería
- `/{slug}/reservar`     → booking wizard (requiere login)
- `/{slug}/login`        → registro + login clientes (email+password)
- `/{slug}/cliente`      → portal cliente (mis reservas, descuentos, referidos)
- `/{slug}/barbero`      → portal barbero
- `/{slug}/admin/*`      → panel admin web (reemplazado por APK Flutter)

## Tablas Supabase principales
```
barberias
users           (id, nombre, telefono, rol, barberia_id, referral_code)
barberos
servicios
disponibilidad
reservas
notificaciones
campanas
alianzas        (descuento_pct, dias_semana, servicio_ids, requiere_codigo,
                 codigo_acceso, max_usos_por_cliente)
alianza_usos
alianza_clientes
descuentos_masivos
referido_premios
```

## Auth
- Clientes: email + contraseña, registro obligatorio para reservar
- Admin: email + contraseña, rol='admin' en public.users
- `registrarCliente()` usa `admin.auth.admin.createUser` con `email_confirm:true`
- Middleware protege rutas `/admin`, `/barbero`, `/cliente`, `/reservar`

## Patrón clave (importante)
Todas las queries del servidor usan `createAdminClient()` (service role key),
**NO** `createClient()` SSR (cookie-based). El cliente SSR falla silenciosamente
en Vercel para rutas server-side y retorna 404.

## Barbería demo
- Slug: `barberia-demo`
- Admin: `seba.v.a1989@gmail.com` / `Admin2026!`
- URL: https://barberia-saas-gamma.vercel.app/barberia-demo

## Features web completas (portal cliente + booking)
1. Booking wizard: barbero → servicio → fecha/hora → confirmación
2. Portal cliente: historial, calificaciones, descuentos disponibles, referidos
3. Sistema referidos: código único por cliente, 10% de descuento al referido
4. Alianzas con descuento real aplicado en reserva
5. Descuentos masivos por segmento con email via Claude Haiku
6. Recordatorios email 24h antes (Supabase Edge Function + pg_cron)
7. Recomendación IA en portal cliente (Claude Haiku)

## Variables de entorno en Vercel
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
ANTHROPIC_API_KEY
```

## Pendiente (requiere acción externa)
- [ ] DNS tuamigodigital.cl para SMTP Resend
- [ ] Pagos Flow: FLOW_API_KEY + FLOW_SECRET_KEY
- [ ] Firebase FCM: NEXT_PUBLIC_FIREBASE_*

## APK Flutter admin (en desarrollo)
El panel de administración de la barbería se construye como APK Flutter nativa,
conectada directamente al mismo backend Supabase.
Patrón de referencia: capitalhumano_admin en este mismo repo.

Pantallas previstas:
- Login (email + contraseña, rol admin)
- Dashboard (citas del día, estadísticas básicas)
- Agenda (calendario de reservas, confirmar/cancelar)
- Clientes (lista, segmentos, alianzas asignadas)
- Alianzas (crear/editar descuentos)
- Barberos (gestión del equipo)
