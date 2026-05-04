# Diseño: Sugerencias y Reclamos Anónimos — Barbería Pública

**Fecha:** 2026-05-04
**Branch:** feature/barberia-admin-apk
**Alcance:** Formulario anónimo en landing pública + almacenamiento en Supabase + push notification al admin APK + vista admin web

---

## Contexto

La landing pública de cada barbería (`app/[slug]/page.tsx`) muestra servicios, equipo y alianzas. Los clientes no tienen forma de comunicar quejas o sugerencias al dueño. Esta feature agrega un canal anónimo de feedback sin requerir registro.

---

## Flujo aprobado

```
1. Cliente visita la landing de la barbería
2. Ve un botón flotante dorado (ícono burbuja) en la esquina inferior derecha
3. Al hacer clic se abre un modal blanco con acentos dorados
4. El cliente selecciona tipo (Elogio / Sugerencia / Reclamo) y escribe su mensaje
5. Al enviar:
   a. Server Action verifica rate limit por IP (1 envío por barbería cada 24h)
   b. Si pasa: inserta en tabla `sugerencias`, notifica al admin vía FCM
   c. Si no pasa: muestra "Ya enviaste una sugerencia hoy"
6. El admin recibe notificación push en la APK
7. El admin revisa las sugerencias en la sección `/[slug]/admin/sugerencias`
8. Al leer una: se marca como leída, desaparece el badge "Nueva"
```

---

## Modelo de datos

### Tabla `sugerencias`

```sql
CREATE TABLE sugerencias (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barberia_id  uuid NOT NULL REFERENCES barberias(id) ON DELETE CASCADE,
  tipo         text NOT NULL CHECK (tipo IN ('sugerencia', 'reclamo', 'elogio')),
  mensaje      text NOT NULL CHECK (char_length(mensaje) BETWEEN 1 AND 500),
  ip_hash      text NOT NULL,
  leida        boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sugerencias_barberia_created_idx ON sugerencias(barberia_id, created_at DESC);
CREATE INDEX sugerencias_ip_hash_idx ON sugerencias(ip_hash, barberia_id, created_at DESC);
```

### RLS

| Operación | Quién | Condición |
|---|---|---|
| INSERT | anon (público) | Sin restricción de usuario |
| SELECT | admin/superadmin | `barberia_id` de la barbería que administran |
| UPDATE (`leida`) | admin/superadmin | Misma condición |

---

## Protección anti-spam

- El Server Action hashea la IP con SHA-256 (Node.js `crypto.createHash('sha256')`)
- No se guarda la IP cruda, solo el hash
- Si existe una fila con `ip_hash = hash AND barberia_id = id AND created_at > now() - interval '24h'`: rechaza con error `"Ya enviaste una sugerencia hoy. Puedes volver mañana."`

---

## Frontend

### `SugerenciasButton.tsx` (Client Component)

**Botón flotante:**
- Posición: `fixed bottom-6 right-6 z-50`
- Estilo: `bg-yellow-400 text-black rounded-full w-14 h-14 shadow-lg`
- Ícono: burbuja de chat (Heroicons `ChatBubbleLeftEllipsisIcon`)

**Modal:**
- Overlay: `fixed inset-0 bg-black/60 z-50`
- Contenedor: `bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl`
- Header: `"Cuéntanos tu experiencia"` en `text-black font-bold text-lg` + botón X
- Pills de tipo (fila de 3):
  - Por defecto: `border border-zinc-200 text-zinc-600 rounded-full px-4 py-2 text-sm`
  - Seleccionado: `border-2 border-yellow-400 bg-yellow-50 text-black font-semibold`
  - Labels: "Elogio" / "Sugerencia" / "Reclamo"
- Textarea: `border border-zinc-200 rounded-xl p-3 w-full text-black text-sm resize-none h-28`, placeholder `"Tu mensaje es anónimo..."`
- Contador: `text-xs text-zinc-400 text-right` mostrando `X/500`
- Botón Enviar: `bg-yellow-400 text-black font-bold py-3 rounded-xl w-full hover:bg-yellow-300`
- Estado loading: spinner dentro del botón, inputs deshabilitados
- Estado éxito: reemplaza contenido del modal con `"¡Gracias por tu mensaje!"` + checkmark, cierra automáticamente a los 2s
- Estado error rate-limit: texto rojo debajo del botón
- Estado error genérico: `"Error al enviar. Intenta de nuevo."`

**Props:** `barberiaId: string`, `slug: string`

**Ubicación:** `app/[slug]/_components/SugerenciasButton.tsx`

**Uso en page.tsx:** Importado al final del `<main>`, después de la sección de alianzas.

---

## Backend

### Server Action `app/[slug]/sugerencias/actions.ts`

```typescript
'use server'

export async function enviarSugerencia(
  barberiaId: string,
  tipo: 'sugerencia' | 'reclamo' | 'elogio',
  mensaje: string
): Promise<{ ok: boolean; error?: string }>
```

Pasos:
1. Validar `tipo` y `mensaje` (1–500 chars)
2. Obtener IP de `headers().get('x-forwarded-for')?.split(',')[0].trim() ?? '0.0.0.0'`
3. Hashear IP: `crypto.createHash('sha256').update(ip).digest('hex')`
4. Consultar `sugerencias` donde `ip_hash = hash AND barberia_id = barberiaId AND created_at > now() - interval '24 hours'`
5. Si existe: retornar `{ ok: false, error: 'Ya enviaste una sugerencia hoy. Puedes volver mañana.' }`
6. Insertar en `sugerencias`: `{ barberia_id, tipo, mensaje, ip_hash }`
7. Llamar Edge Function `notify-admin-fcm` con:
   ```json
   {
     "barberia_id": "...",
     "title": "Nueva sugerencia" | "Nuevo reclamo" | "Nuevo elogio",
     "body": "mensaje[:80]..."
   }
   ```
8. Retornar `{ ok: true }`

El fallo del paso 7 (push) no bloquea ni revierte la inserción — se ignora silenciosamente.

### Migración `supabase/migrations/20260504000001_sugerencias.sql`

Incluye: `CREATE TABLE`, índices, RLS enable, 3 políticas (INSERT anon, SELECT admin, UPDATE admin).

---

## Vista Admin Web

### `app/[slug]/admin/sugerencias/page.tsx` (Server Component)

**Layout:**
- Título: `"Sugerencias y Reclamos"`
- Tabs: `Todas | Elogio | Sugerencia | Reclamo` (filtro por query param `?tipo=`)
- Lista de cards ordenadas por `created_at DESC`

**Card por sugerencia:**
- Pill de tipo con colores: `elogio` → verde, `sugerencia` → azul, `reclamo` → rojo
- Badge `"Nueva"` en amarillo si `leida = false`
- Mensaje completo en texto
- Fecha relativa (ej: "hace 3 horas")
- Botón "Marcar como leída" (si `leida = false`) → Server Action `marcarLeida(id)`

**Badge en nav del admin:**
- El nav del panel admin muestra el count de sugerencias no leídas junto al enlace "Sugerencias"

### Server Action `marcarLeida(id: string)`

Actualiza `sugerencias` SET `leida = true` WHERE `id = id` — con verificación de que el admin tiene acceso a esa `barberia_id`.

---

## Archivos a crear/modificar

### Nuevos
- `supabase/migrations/20260504000001_sugerencias.sql`
- `app/[slug]/_components/SugerenciasButton.tsx`
- `app/[slug]/sugerencias/actions.ts`
- `app/[slug]/admin/sugerencias/page.tsx`

### Modificados
- `app/[slug]/page.tsx` — importar y renderizar `SugerenciasButton`
- `app/[slug]/admin/page.tsx` o nav del admin — agregar enlace + badge de no leídas

---

## Colores y consistencia visual

| Elemento | Color |
|---|---|
| Botón flotante | `bg-yellow-400 text-black` |
| Modal fondo | `bg-white` |
| Modal texto principal | `text-black` |
| Pill seleccionado | `border-yellow-400 bg-yellow-50` |
| Botón enviar | `bg-yellow-400 text-black` |
| Pill elogio | `bg-green-100 text-green-700` |
| Pill sugerencia | `bg-blue-100 text-blue-700` |
| Pill reclamo | `bg-red-100 text-red-700` |
