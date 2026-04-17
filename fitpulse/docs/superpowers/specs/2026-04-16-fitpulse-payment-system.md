# FitPulse — Sistema de Pagos Multi-Gateway

**Fecha:** 2026-04-16  
**Estado:** Aprobado por usuario  
**Depende de:** fitpulse-backend-api (debe estar desplegado)

## Resumen

Sistema que permite a los miembros pagar su mensualidad directamente desde la app Flutter. El dueño del gimnasio configura el gateway de pago desde el panel admin. Soporta Mercado Pago, Stripe y Webpay (Transbank). El pago ocurre en el checkout nativo de cada gateway vía WebView — la app nunca maneja datos de tarjeta.

## Gateways soportados

| Gateway | Credenciales | Países | Comisión aprox. |
|---|---|---|---|
| Mercado Pago | Access Token | Chile, LATAM | ~3.49% |
| Stripe | Secret Key + Publishable Key | Internacional | ~2.9% + USD 0.30 |
| Webpay (Transbank) | Commerce Code + API Key | Chile | ~2.95% |

## Componentes

### 1. Panel Admin — Sección "Configuración de Pagos"

Nueva página `/dashboard/payment-config` en el panel Next.js:
- Selector de gateway (Mercado Pago / Stripe / Webpay / Ninguno)
- Formulario dinámico según el gateway seleccionado con los campos de credenciales
- Botón "Guardar configuración"
- Indicador de estado: configurado / sin configurar
- Instrucciones de dónde obtener las credenciales para cada gateway

### 2. Backend — Nuevos endpoints

```
GET  /api/payments/config
     JWT admin → devuelve gateway activo (sin exponer credenciales completas)

POST /api/payments/config
     JWT admin → guarda gateway + credenciales encriptadas

POST /api/payments/checkout
     JWT miembro → crea sesión de pago con el gateway configurado del gym
     Body: { amount? }   ← si no se pasa, usa subscription.price del miembro
     Response: { checkout_url, payment_id }

POST /api/payments/webhook/mercadopago   ← Mercado Pago notifica resultado
POST /api/payments/webhook/stripe        ← Stripe notifica resultado
POST /api/payments/webhook/webpay        ← Webpay notifica resultado
     Cada webhook verifica firma del gateway y actualiza subscription.status = 'paid'

GET  /api/payments/status/:paymentId
     JWT miembro → consulta estado de un pago específico
     Response: { status: 'pending'|'approved'|'rejected' }
```

### 3. Base de Datos — Nuevas tablas

```sql
-- Configuración de gateway por gimnasio
CREATE TABLE gateway_config (
  gym_code            VARCHAR(10) PRIMARY KEY REFERENCES gyms(code),
  gateway             VARCHAR(20),   -- 'mercadopago' | 'stripe' | 'webpay' | null
  credentials_enc     TEXT,          -- JSON encriptado con AES-256
  active              BOOLEAN DEFAULT FALSE,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Registro de pagos
CREATE TABLE payment_logs (
  id              SERIAL PRIMARY KEY,
  member_id       INTEGER REFERENCES members(id),
  subscription_id INTEGER REFERENCES subscriptions(id),
  amount          INTEGER NOT NULL,
  gateway         VARCHAR(20) NOT NULL,
  external_id     VARCHAR(255),   -- ID del pago en el gateway
  status          VARCHAR(20) DEFAULT 'pending',  -- pending/approved/rejected
  checkout_url    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. App Flutter — Pantalla de Pago

Nueva pantalla `payment_screen.dart`:
- Se accede desde el perfil del miembro cuando `subscription.status != 'paid'`
- Muestra monto, fecha de vencimiento y botón "Pagar ahora"
- Al tocar: llama `POST /api/payments/checkout` → recibe `checkout_url`
- Abre `checkout_url` en un WebView (`webview_flutter` package)
- Al cerrar el WebView: consulta `GET /api/payments/status/:paymentId` → si aprobado, muestra confirmación y actualiza badge
- Si el gym no tiene gateway configurado: muestra mensaje "Consulta con tu gimnasio para opciones de pago"

## Flujo completo

```
Dueño (panel admin):
  1. Entra a "Configuración de Pagos"
  2. Selecciona Mercado Pago
  3. Pega su Access Token
  4. Guarda → backend encripta y guarda en gateway_config

Miembro (app Flutter):
  1. Ve badge "Pago pendiente" en perfil (subscription.status = 'due_soon' o 'overdue')
  2. Toca "Pagar mensualidad"
  3. App llama POST /api/payments/checkout con JWT
  4. Backend verifica gateway del gym → crea preferencia en Mercado Pago → devuelve checkout_url
  5. App abre WebView con la URL de checkout de Mercado Pago
  6. Miembro paga con tarjeta, débito o QR
  7. Mercado Pago llama webhook → backend marca subscription.status = 'paid', guarda payment_log
  8. App consulta status → muestra "¡Pago exitoso! ✅"
```

## Encriptación de credenciales

Las credenciales del gateway se encriptan con AES-256-CBC antes de guardar en la BD usando `ENCRYPTION_KEY` (variable de entorno). Nunca se devuelven completas al cliente — solo se indica si están configuradas.

## Seguridad de webhooks

Cada gateway firma sus webhooks:
- **Mercado Pago:** header `x-signature` → verificado con Access Token
- **Stripe:** header `stripe-signature` → verificado con Webhook Secret
- **Webpay:** verificación de MAC con API Key

Cualquier webhook sin firma válida devuelve 401 y no actualiza la BD.

## Variables de entorno adicionales

```
ENCRYPTION_KEY    ← 32 bytes hex para AES-256, ej: openssl rand -hex 32
```

## Orden de implementación

1. Backend: tabla gateway_config + payment_logs + endpoints config y checkout
2. Backend: webhooks por gateway
3. Panel admin: página de configuración de pagos
4. Sidebar: agregar "Config. Pagos" al nav admin
5. Flutter: payment_screen.dart + WebView
6. Flutter: badge de pago en perfil cuando status != 'paid'
