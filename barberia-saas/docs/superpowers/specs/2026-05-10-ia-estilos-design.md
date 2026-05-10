# Spec: IA de Estilos de Corte — Barbería SaaS

**Fecha:** 2026-05-10
**Estado:** Aprobado
**Módulo:** Admin App (Flutter) + API Vercel

---

## Problema

La barbería no tiene forma de mostrarle al cliente cómo quedaría con un corte antes de hacerlo. Esto genera dudas, demoras en la decisión y a veces insatisfacción. No existe ninguna app de barbería en Chile con esta función.

## Solución

Herramienta en la app del administrador que:
1. Toma una foto del cliente (cámara o galería)
2. Muestra una grilla de estilos disponibles (predefinidos + propios de la barbería)
3. Genera con IA una transformación realista de cómo quedaría el cliente con ese corte
4. Muestra resultado antes/después en pantalla — el cliente decide en la silla

## Modelo de negocio

- **Plan básico:** reservas, referidos, dashboard — precio base
- **Plan premium:** todo lo anterior + IA de estilos — precio mayor
- El costo variable de la IA (~$0.05 USD/imagen) se absorbe en el diferencial del plan premium

---

## Arquitectura

```
Flutter Admin App
    └── PruebaEstiloScreen
    └── GestionEstilosScreen
    └── EstilosService (HTTP → Vercel API)

Vercel Next.js
    └── POST /api/[slug]/generar-estilo
        └── OpenAI gpt-image-1 (image edit)

Supabase
    └── Tabla: estilos_corte
    └── Storage: bucket estilos-referencia/
```

---

## Base de datos

### Tabla `estilos_corte`

```sql
CREATE TABLE estilos_corte (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barberia_id         uuid REFERENCES barberias(id) ON DELETE CASCADE,
  nombre              text NOT NULL,
  descripcion         text,
  foto_referencia_url text,
  prompt_ia           text NOT NULL,
  es_predefinido      boolean NOT NULL DEFAULT false,
  orden               integer NOT NULL DEFAULT 0,
  activo              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);
```

- `barberia_id = NULL` → estilo predefinido visible para todas las barberías
- `barberia_id = <id>` → estilo propio de esa barbería

### RLS

- Admin puede leer todos los estilos donde `barberia_id = su barberia_id` OR `es_predefinido = true`
- Admin puede insertar/actualizar/eliminar solo los suyos (`barberia_id = su barberia_id`)
- Nadie más tiene acceso

### Estilos predefinidos (seed)

| Nombre | Prompt IA |
|--------|-----------|
| Degradé clásico | Modifica solo el cabello aplicando un degradé clásico con transición suave en los laterales. Mantén el rostro, expresión, ropa y fondo exactamente iguales. |
| Fade americano | Modifica solo el cabello aplicando un fade americano con contraste alto en los laterales. Mantén el rostro, expresión, ropa y fondo exactamente iguales. |
| Tapered | Modifica solo el cabello aplicando un corte tapered con laterales cortos y parte superior con volumen moderado. Mantén el rostro, expresión, ropa y fondo exactamente iguales. |
| Undercut | Modifica solo el cabello aplicando un undercut con laterales rapados y parte superior larga hacia un lado. Mantén el rostro, expresión, ropa y fondo exactamente iguales. |
| Corte texturizado | Modifica solo el cabello aplicando un corte texturizado moderno con capas y movimiento natural. Mantén el rostro, expresión, ropa y fondo exactamente iguales. |
| Pompadour | Modifica solo el cabello aplicando un pompadour con volumen hacia arriba y laterales cortos. Mantén el rostro, expresión, ropa y fondo exactamente iguales. |
| Buzz cut | Modifica solo el cabello aplicando un buzz cut rapado uniforme muy corto. Mantén el rostro, expresión, ropa y fondo exactamente iguales. |
| Corte largo natural | Modifica solo el cabello dejándolo largo y natural hasta los hombros con caída libre. Mantén el rostro, expresión, ropa y fondo exactamente iguales. |

---

## API Vercel

### `POST /api/[slug]/generar-estilo`

**Request:**
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "promptEstilo": "Modifica solo el cabello aplicando un degradé clásico..."
}
```

**Proceso:**
1. Validar que el slug existe y el usuario es admin
2. Convertir base64 a Buffer
3. Llamar `openai.images.edit({ model: 'gpt-image-1', image, prompt, size: '1024x1024' })`
4. Retornar imagen resultado en base64

**Response:**
```json
{
  "imageBase64": "data:image/png;base64,..."
}
```

**Variable de entorno requerida:** `OPENAI_API_KEY`

**Manejo de errores:**
- Timeout: 60 segundos máximo (OpenAI puede tardar 15-20s)
- Si falla: retornar error claro para mostrar en la app

---

## Flutter Admin App

### Pantallas nuevas

#### `prueba_estilo_screen.dart`

**Estados:**
1. `initial` — botones de cámara y galería
2. `foto_tomada` — muestra la foto + grilla de estilos
3. `generando` — spinner con "Generando tu look..." (~15s)
4. `resultado` — vista antes/después con opción de reintentar

**Componentes:**
- `ImagePicker` para cámara/galería (paquete `image_picker`)
- Grilla horizontal de estilos (predefinidos primero, luego propios)
- Botón "Generar" activo solo cuando hay foto + estilo seleccionado
- Resultado: dos imágenes lado a lado con labels "Antes" / "Después"
- Botón "Probar otro estilo" → vuelve a la grilla con la misma foto

#### `gestion_estilos_screen.dart`

**Secciones:**
1. "Estilos base" — 8 cards en grilla, solo lectura, con ícono de candado
2. "Mis estilos" — estilos propios del barbero, editables
3. Botón "Agregar estilo" → bottom sheet con:
   - Campo nombre
   - Campo descripción (opcional)
   - Foto de referencia (desde galería)
   - El `prompt_ia` se genera automáticamente desde nombre + descripción

### Servicio `EstilosService`

```dart
class EstilosService {
  Future<List<EstiloCorte>> getEstilos(String barberiaId)
  Future<void> agregarEstilo(String barberiaId, EstiloCorte estilo)
  Future<void> eliminarEstilo(String estiloId)
  Future<String> generarTransformacion(Uint8List foto, EstiloCorte estilo)
}
```

### Navegación en admin app

Agregar nueva sección en el menú principal:
- Ícono: `auto_fix_high` (varita mágica)
- Label: "Prueba de Estilo"
- Acceso desde el bottom nav o el drawer

---

## Restricciones importantes

- **Foto no se guarda en Supabase** — solo se usa para la generación, no se almacena. Privacidad del cliente.
- **Resultado no se guarda** — se muestra en pantalla, el barbero puede hacer screenshot si quiere guardarlo.
- **Máximo 1 generación a la vez** — no permitir múltiples requests simultáneos.
- **Tamaño foto:** comprimir a máximo 1024x1024 antes de enviar a la API.
- **Solo admin** — la pantalla no existe en la app del cliente.

---

## Variables de entorno a agregar

```
OPENAI_API_KEY=sk-...
```

---

## Criterios de éxito

- El barbero puede tomar una foto y ver el resultado en menos de 20 segundos
- La transformación mantiene el rostro reconocible del cliente
- El barbero puede agregar y eliminar sus propios estilos
- Los 8 estilos predefinidos funcionan correctamente desde el primer día
