# Diseño: APK Admin Barbería

**Fecha:** 2026-04-28  
**Proyecto:** Barbería SaaS  
**Alcance:** APK Android nativa para el dueño/administrador de la barbería

---

## Contexto

El panel web admin tenía problemas de SSR en Vercel y una interfaz pobre. Se reemplaza por una APK Flutter nativa conectada directamente al mismo backend Supabase. El portal web del cliente (booking, login, portal) se mantiene sin cambios.

---

## Arquitectura

```
Supabase (rcdcgonvmwzthdumpwga)
    │
    ├── DB Webhook: INSERT en reservas
    │       └── Edge Function send-push
    │               └── FCM → push al token del admin
    │
    └── supabase_flutter SDK
            ├── Auth email+contraseña (rol='admin')
            ├── Queries directas a todas las tablas
            └── Token FCM guardado en barberias.fcm_token_admin

Flutter APK (Android)
    ├── firebase_messaging        → recibe push (app cerrada/abierta/background)
    ├── supabase_flutter          → datos
    └── flutter_local_notifications → muestra notificación en foreground
```

**Flujo notificación push:**
1. Cliente reserva desde web → INSERT en `reservas`
2. Supabase Database Webhook llama Edge Function `send-push`
3. Edge Function lee `barberias.fcm_token_admin` y llama FCM API
4. Android muestra notificación aunque la app esté cerrada
5. Tap en notificación → abre app en pantalla Agenda

---

## Pantallas

```
Login
└── Dashboard
    ├── Agenda
    │   └── Detalle reserva (confirmar / cancelar / completar)
    ├── Clientes
    │   └── Perfil cliente (historial, alianza asignada, gasto total)
    ├── Alianzas
    │   ├── Listado
    │   └── Crear / Editar
    ├── Barberos
    │   ├── Listado
    │   └── Crear / Editar
    ├── Servicios
    │   ├── Listado
    │   └── Crear / Editar
    └── Configuración (datos barbería + cerrar sesión)
```

### Login
- Campos: email + contraseña
- Valida que `public.users.rol = 'admin'` tras autenticar
- Si el rol no es admin → cierra sesión + mensaje de error
- Persiste sesión (auto-login al reabrir la app)

### Dashboard
- Resumen del día: total citas, ingresos estimados, clientes nuevos del mes
- Badge con reservas pendientes de confirmar
- Acceso rápido a Agenda

### Agenda
- Lista scrolleable con pestañas: Hoy / Mañana / Esta semana
- Cada tarjeta: hora, cliente, servicio, barbero, estado (pendiente/confirmada/completada/cancelada)
- Color por estado

### Detalle de reserva
- Todos los datos de la reserva
- Botones según estado actual:
  - Pendiente → Confirmar | Cancelar
  - Confirmada → Completar | Cancelar
  - Completada / Cancelada → solo lectura

### Clientes
- Lista con buscador (nombre o teléfono)
- Chips de segmento: Todos / Frecuente / Nuevo / Inactivo
- Cada fila: nombre, teléfono, total visitas, último segmento

### Perfil de cliente
- Datos: nombre, email, teléfono, referral code
- Estadísticas: total visitas, gasto total, última visita
- Alianza asignada: dropdown para asignar/quitar
- Historial de reservas (últimas 10)

### Alianzas
- Listado con nombre, descuento %, estado activo/inactivo
- Formulario: nombre, descuento_pct, días de semana, servicios, código opcional, max usos

### Barberos
- Listado con nombre y estado activo
- Formulario: nombre, activo (toggle)

### Servicios
- Listado con nombre, duración, precio
- Formulario: nombre, duración (minutos), precio

### Configuración
- Nombre de la barbería (solo lectura)
- Slug (solo lectura)
- Cerrar sesión

---

## Base de datos — cambios requeridos

```sql
-- Agregar columna para token FCM del admin
ALTER TABLE barberias ADD COLUMN IF NOT EXISTS fcm_token_admin TEXT;
```

No se requieren otras migraciones — todas las tablas ya existen.

---

## Firebase / FCM

- Crear proyecto Firebase gratuito: `barberia-saas`
- Activar Firebase Cloud Messaging
- Descargar `google-services.json` → `android/app/`
- Guardar FCM Server Key en Supabase secrets: `FCM_SERVER_KEY`
- La Edge Function `send-push` ya existe — se actualiza para leer `barberias.fcm_token_admin`

---

## Estructura de archivos Flutter

```
barberia_admin/
├── lib/
│   ├── main.dart
│   ├── config/
│   │   └── supabase_config.dart
│   ├── models/
│   │   ├── reserva.dart
│   │   ├── cliente.dart
│   │   ├── alianza.dart
│   │   ├── barbero.dart
│   │   └── servicio.dart
│   ├── services/
│   │   ├── auth_service.dart
│   │   ├── reservas_service.dart
│   │   ├── clientes_service.dart
│   │   ├── alianzas_service.dart
│   │   └── push_service.dart
│   └── screens/
│       ├── login_screen.dart
│       ├── dashboard_screen.dart
│       ├── agenda_screen.dart
│       ├── reserva_detail_screen.dart
│       ├── clientes_screen.dart
│       ├── cliente_detail_screen.dart
│       ├── alianzas_screen.dart
│       ├── barberos_screen.dart
│       ├── servicios_screen.dart
│       └── config_screen.dart
├── android/
│   └── app/
│       └── google-services.json   ← descargar de Firebase Console
└── pubspec.yaml
```

---

## Dependencias pubspec.yaml

```yaml
dependencies:
  supabase_flutter: ^2.x
  firebase_core: ^3.x
  firebase_messaging: ^15.x
  flutter_local_notifications: ^17.x
  intl: ^0.19.x
  go_router: ^14.x
```

---

## Fuera de alcance (v1)

- iOS (solo Android APK por ahora)
- Descuentos masivos desde la app (queda en web o v2)
- Campañas de email desde la app
- Predicción IA / recomendaciones (queda en web o v2)
- Modo offline
