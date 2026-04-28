# Barbería SaaS — Diseño del Sistema
**Fecha:** 2026-04-27  
**Stack:** Next.js 14 + Supabase + Vercel  
**Modelo:** Multi-tenant white-label (una instancia sirve a N barberías)  
**Tipo de cliente:** App para una barbería específica (Fase 1), escalable a SaaS (Fase 2+)

---

## 1. Visión general

Plataforma web PWA para barberías modernas que automatiza reservas, fideliza clientes y aumenta ingresos recurrentes. Los clientes acceden desde el browser (sin descargar nada) o instalan la PWA en su pantalla de inicio. El dueño gestiona todo desde el panel admin en desktop o móvil.

**Arquitectura multi-tenant:** cada barbería es un tenant con su propio slug (`/[slug]/`), datos aislados por Row-Level Security en Supabase, y configuración independiente de pagos, branding y servicios.

---

## 2. Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR, rutas dinámicas por tenant, PWA |
| Estilos | Tailwind CSS + shadcn/ui | Rapidez de desarrollo, componentes accesibles |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions) | BaaS completo, RLS para multi-tenant, realtime para agenda |
| Notificaciones email | Resend | API moderna, plantillas React Email |
| Notificaciones push | Firebase Cloud Messaging (FCM) | Compatible con PWA en Android e iOS 16.4+ |
| Pagos | Adaptador configurable: Flow / MercadoPago / Stripe | El dueño elige desde el panel admin |
| IA | Claude API (Haiku) | Recomendaciones y sugerencias de campañas a bajo costo |
| Hosting | Vercel | Deploy automático, edge network, integración Next.js |
| Base de datos | Supabase PostgreSQL | ACID, RLS, realtime, migraciones con Supabase CLI |

---

## 3. Arquitectura multi-tenant

Cada barbería tiene:
- Un `slug` único (ej: `mi-barberia`)
- Rutas bajo `/{slug}/reservar`, `/{slug}/admin`, `/{slug}/cliente`, `/{slug}/barbero`
- Datos completamente aislados por `barberia_id` en todas las tablas
- RLS policies en Supabase que filtran automáticamente por `barberia_id`
- Configuración propia: logo, colores, servicios, barberos, precios, métodos de pago

### Roles del sistema
- `admin` — dueño de la barbería, acceso total
- `barbero` — ve su propia agenda, marca citas completadas
- `cliente` — reserva, ve historial, gestiona suscripción y referidos
- `superadmin` — (tú, el desarrollador) gestión de tenants

---

## 4. Modelo de datos

### `barberias`
```
id, slug, nombre, logo_url, colores jsonb, 
configuracion jsonb (horarios, proveedor_pago),
plan_saas (basico|pro), activo, created_at
```
Las API keys de la pasarela de pago se almacenan en **Supabase Vault** (secrets cifrados), nunca en columnas JSON.

### `users`
Extiende `auth.users` de Supabase.
```
id (= auth.user.id), barberia_id, rol (admin|barbero|cliente|superadmin),
nombre, telefono, email, referral_code (único), referral_by (user_id),
fcm_token, activo, created_at
```

### `barberos`
```
id, barberia_id, user_id, nombre, foto_url, 
horarios jsonb (días y franjas disponibles), activo
```

### `servicios`
```
id, barberia_id, nombre, descripcion, duracion_min, precio, activo, orden
```

### `disponibilidad`
```
id, barbero_id, barberia_id, fecha (date),
slots jsonb (array de {hora, disponible, reserva_id})
```
Generada automáticamente por Edge Function según horarios del barbero.

### `reservas`
```
id, barberia_id, cliente_id, barbero_id, servicio_id,
fecha_hora (timestamptz), estado (pendiente|confirmada|completada|cancelada|no_show),
precio, descuento, precio_final, notas,
origen (web|admin|suscripcion), created_at
```

### `planes`
```
id, barberia_id, nombre (basico|premium), precio_mensual,
cortes_incluidos (null = ilimitado), beneficios jsonb, activo
```

### `suscripciones`
```
id, barberia_id, cliente_id, plan_id,
estado (activa|pausada|cancelada|vencida),
fecha_inicio, fecha_renovacion, pago_automatico,
cortes_usados_mes, created_at
```

### `referidos`
```
id, barberia_id, referidor_id, referido_id,
estado (pendiente|completado), 
recompensa_tipo (descuento|saldo), recompensa_valor,
fecha_completado
```

### `recompensas`
```
id, barberia_id, usuario_id, 
tipo (referido|fidelidad|promocion),
valor, saldo_disponible, fecha_expiracion, created_at
```

### `alianzas`
```
id, barberia_id, nombre, tipo (colegio|empresa|gimnasio|otro),
codigo_validacion, dominio_email, descuento_porcentaje,
activo, usos, created_at
```

### `campanias`
```
id, barberia_id, nombre,
segmento (frecuentes|inactivos|nuevos|suscriptores|todos),
canal (email|push|ambos), asunto, mensaje,
estado (borrador|programada|enviada), enviar_en, enviada_en, 
destinatarios_count, created_at
```

### `pagos`
```
id, barberia_id, reserva_id (nullable), suscripcion_id (nullable),
monto, proveedor (flow|mercadopago|stripe),
estado (pendiente|completado|fallido|reembolsado),
referencia_externa, metadata jsonb, created_at
```

### `calificaciones`
```
id, barberia_id, reserva_id, cliente_id, barbero_id,
puntaje (1-5), comentario, created_at
```

### `notificaciones`
```
id, barberia_id, usuario_id, tipo, titulo, mensaje, 
leida, metadata jsonb, created_at
```

---

## 5. Módulos del sistema

### 5.1 Agenda inteligente
- Reserva pública en `/{slug}/reservar` sin login — al confirmar se pide email para crear cuenta OTP o identificar cuenta existente
- Flujo: seleccionar servicio → barbero (o "cualquiera") → fecha → hora → confirmar → pago
- Slots generados dinámicamente según duración del servicio y horarios del barbero
- Realtime: si otro cliente toma el slot mientras reservas, desaparece automáticamente
- Confirmación automática por email (Resend) y push (FCM)
- Recordatorio automático 24h y 1h antes (Edge Function con cron)
- Vista de agenda del barbero con estado en tiempo real

### 5.2 Portal del cliente
- Acceso con email + OTP (sin contraseña, más amigable)
- Perfil: historial de servicios, próximas citas, calificaciones dadas
- Gestión de suscripción: ver plan, pausar, cancelar
- Saldo y recompensas: ver saldo disponible, aplicar al próximo pago
- Código referido único y link de invitación para compartir

### 5.3 Suscripciones
- Planes configurables por barbería (nombre, precio, beneficios, cortes incluidos)
- Cobro automático mensual via pasarela configurada
- Webhook de pago → actualiza estado de suscripción automáticamente
- Suscriptores premium marcados visualmente en la agenda del barbero
- Si el plan incluye cortes ilimitados, el precio en la reserva es $0

### 5.4 Sistema de referidos
- Al registrarse, cada cliente recibe un `referral_code` único
- Link compartible: `/{slug}/reservar?ref=CODIGO`
- Cuando el referido completa su primera reserva pagada → recompensa activada
- Recompensa configurable: % descuento o saldo en pesos
- Dashboard de referidos en el portal del cliente

### 5.5 Promociones y campañas
- Segmentación automática:
  - **Frecuentes:** +3 visitas en los últimos 60 días
  - **Inactivos:** sin visitas en los últimos 30 días
  - **Nuevos:** registrados en los últimos 14 días
  - **Suscriptores:** con suscripción activa
- Creación de campaña: segmento → canal (email/push) → mensaje → programar o enviar ahora
- IA (Claude Haiku): sugiere el mensaje y el segmento más apropiado según el historial

### 5.6 Alianzas estratégicas
- Admin crea una alianza con nombre, tipo y código de validación
- Cliente ingresa el código al reservar → descuento aplicado automáticamente
- Opción de validación por dominio de email institucional (@colegio.cl)
- Reporte de usos por alianza en el panel admin

### 5.7 Panel administrador
- **Dashboard:** ingresos del día/mes, citas completadas, cancelaciones, suscripciones activas
- **Agenda:** vista calendario semanal/diaria, crear/editar/cancelar citas manualmente
- **Clientes:** listado con filtros, perfil completo, historial, asignar descuentos
- **Barberos:** gestión de perfiles, horarios, estadísticas individuales
- **Servicios:** CRUD de servicios con precios y duración
- **Suscripciones:** ver todas las activas, gestionar casos especiales
- **Campañas:** crear, programar y ver resultados
- **Alianzas:** CRUD de convenios
- **Configuración:** logo, colores, horarios de la barbería, método de pago, integrar pasarela

### 5.8 Vista del barbero
- Agenda del día propia (solo sus citas)
- Marcar cita como completada o no-show
- Ver perfil del cliente (historial, si es suscriptor, notas)
- Ver sus estadísticas del mes (ingresos generados, citas completadas, rating promedio)

### 5.9 IA — Recomendaciones y predicciones (Claude Haiku)
- **Recomendaciones al cliente:** "Basado en tu historial, te recomendamos el Pack Barba"
- **Predicción de demanda:** horarios con mayor ocupación → sugerencia de precios dinámicos
- **Sugerencias de campañas:** "Tienes 12 clientes inactivos, ¿enviar promoción de reactivación?"
- Implementado como llamadas on-demand a Claude API, no en tiempo real

---

## 6. Adaptador de pagos

Patrón factory para soportar múltiples proveedores:

```
/lib/payments/
  index.ts        → factory, retorna el proveedor configurado para la barbería
  types.ts        → interfaces: PaymentProvider, PaymentResult, WebhookEvent
  flow.ts         → implementación Flow
  mercadopago.ts  → implementación MercadoPago  
  stripe.ts       → implementación Stripe
```

Flujo de pago:
1. Cliente confirma reserva → Next.js API Route llama al adaptador → redirige a pasarela
2. Pasarela procesa → webhook a `/api/webhooks/pagos/[proveedor]`
3. Webhook valida firma → actualiza estado de reserva/suscripción en Supabase

---

## 7. Notificaciones

### Email (Resend + React Email)
- Confirmación de reserva
- Recordatorio 24h antes
- Recordatorio 1h antes
- Bienvenida al registrarse
- Recompensa de referido activada
- Campañas del admin

### Push (FCM)
- Confirmación de reserva
- Recordatorio 24h antes
- Campañas del admin
- Nueva promoción disponible

Los recordatorios se disparan desde **Supabase Edge Functions** con cron jobs.

---

## 8. Estructura de rutas Next.js

```
app/
  [slug]/
    page.tsx                    → landing de la barbería
    reservar/
      page.tsx                  → booking público
    cliente/
      page.tsx                  → portal cliente (requiere auth cliente)
      suscripcion/page.tsx
      referidos/page.tsx
    admin/
      page.tsx                  → dashboard admin (requiere auth admin)
      agenda/page.tsx
      clientes/page.tsx
      barberos/page.tsx
      servicios/page.tsx
      suscripciones/page.tsx
      campanias/page.tsx
      alianzas/page.tsx
      configuracion/page.tsx
    barbero/
      page.tsx                  → vista barbero (requiere auth barbero)
  api/
    webhooks/
      pagos/[proveedor]/route.ts
    fcm/subscribe/route.ts
    ai/recomendar/route.ts
  superadmin/
    page.tsx                    → gestión de tenants (solo superadmin)
```

---

## 9. Seguridad

- **Autenticación:** Supabase Auth con email + OTP (sin contraseña)
- **Autorización:** RLS policies por `barberia_id` y `rol` en cada tabla
- **Webhooks de pago:** verificación de firma HMAC antes de procesar
- **Variables de entorno:** API keys de pagos cifradas, nunca en cliente
- **Rutas protegidas:** middleware Next.js verifica sesión y rol antes de cada ruta admin/barbero

---

## 10. Costos de infraestructura

| Servicio | Costo mensual (operando) |
|---|---|
| Vercel Pro | $20 USD |
| Supabase Pro | $25 USD |
| Resend | $0–20 USD |
| FCM | $0 |
| Claude API (Haiku) | $5–15 USD |
| Dominio | $1–2 USD |
| **Total** | **~$51–82 USD/mes** |

**Modelo de cobro al cliente:** $60.000–80.000 CLP/mes de mantención (cubre costos + margen).

---

## 11. Fases de desarrollo

### Fase 1 — MVP (4–6 semanas)
- Setup Next.js + Supabase + multi-tenant base
- Agenda inteligente (reserva pública + panel admin)
- Auth (OTP) + roles
- Portal cliente básico (historial, próximas citas)
- Panel admin (agenda, clientes, barberos, servicios)
- Vista barbero
- Notificaciones email (confirmación + recordatorios)
- Deploy Vercel + dominio

### Fase 2 — Fidelización y monetización (3–4 semanas)
- Suscripciones mensuales + adaptador de pagos
- Sistema de referidos
- Notificaciones push (FCM)
- Calificaciones post-servicio

### Fase 3 — Crecimiento (2–3 semanas)
- Campañas y promociones con segmentación
- Alianzas estratégicas
- IA (Claude API) — recomendaciones y sugerencias

### Fase 4 — SaaS (2–3 semanas adicionales)
- Panel superadmin para gestión de tenants
- Onboarding de nuevas barberías
- Billing propio (cobrar a las barberías su suscripción mensual)
