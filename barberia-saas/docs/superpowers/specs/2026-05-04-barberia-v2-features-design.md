# Diseño: Barbería SaaS v2 — Pack de Features

**Fecha:** 2026-05-04
**Branch:** feature/barberia-admin-apk
**Alcance:** 5 features independientes que se implementan en un solo plan

---

## Features incluidas

1. **Sugerencias y Reclamos** — formulario anónimo en landing pública
2. **Barbero: descripción + foto** — edición en APK, visualización en web reserva
3. **Logo upload** — subida desde APK, visualización en web
4. **UI 3D/moderna** — glassmorphism + glow en web admin y cliente
5. **Multi-tenancy con código** — login APK/web por código de barbería (sin email visible)

---

## Feature 1: Sugerencias y Reclamos

*(Spec detallado en `2026-05-04-sugerencias-reclamos-design.md` — este resumen es la fuente de verdad para el plan)*

### Modelo de datos

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

RLS: INSERT público (anon), SELECT/UPDATE solo admin/superadmin de esa barbería.

### Componente web: `SugerenciasButton`

**Archivo:** `app/[slug]/_components/SugerenciasButton.tsx` (Client Component)

- Botón flotante: `fixed bottom-6 right-6 z-50 bg-yellow-400 text-black rounded-full w-14 h-14 shadow-lg`
- Al clic: modal blanco con overlay `bg-black/60`
- Modal: pills Elogio/Sugerencia/Reclamo (borde amarillo al seleccionar) + textarea 500 chars + botón Enviar dorado
- Éxito: mensaje "¡Gracias!" + cierre a los 2s
- Props: `barberiaId: string`

### Server Action: `app/[slug]/sugerencias/actions.ts`

```typescript
'use server'
export async function enviarSugerencia(
  barberiaId: string,
  tipo: 'sugerencia' | 'reclamo' | 'elogio',
  mensaje: string
): Promise<{ ok: boolean; error?: string }>
```

Pasos: validar → hashear IP (SHA-256) → verificar rate limit (1/IP/24h/barbería) → insertar → notificar FCM directo (leer `fcm_token_admin` de `barberias`, `POST https://fcm.googleapis.com/fcm/send` con `Authorization: key=${process.env.FCM_SERVER_KEY}`).

El fallo FCM no revierte la inserción.

### Vista admin: `app/[slug]/admin/sugerencias/page.tsx`

- Lista con tabs Todas/Elogio/Sugerencia/Reclamo (query param `?tipo=`)
- Cards: pill tipo (verde/azul/rojo) + badge "Nueva" (amarillo) + mensaje + fecha relativa
- Server Action `marcarLeida(id)` verifica acceso por `barberia_id`
- `app/[slug]/admin/layout.tsx`: agregar `{ href: '/${slug}/admin/sugerencias', label: 'Sugerencias', icon: '💬' }` al `navItems`

---

## Feature 2: Barbero — descripción + foto

### Migración

```sql
ALTER TABLE barberos
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS foto_url text;
```

*(`foto_url` ya existe en DB pero se asegura con IF NOT EXISTS)*

### Flutter: modelo `Barbero`

```dart
class Barbero {
  final String id;
  final String nombre;
  final bool activo;
  final String? descripcion;
  final String? fotoUrl;

  const Barbero({
    required this.id,
    required this.nombre,
    required this.activo,
    this.descripcion,
    this.fotoUrl,
  });

  factory Barbero.fromJson(Map<String, dynamic> j) => Barbero(
    id: j['id'] as String,
    nombre: j['nombre'] as String,
    activo: j['activo'] as bool? ?? true,
    descripcion: j['descripcion'] as String?,
    fotoUrl: j['foto_url'] as String?,
  );
}
```

### Flutter: `BarberosService` actualizado

```dart
Future<void> crear(String barberiaId, String nombre, {String? descripcion, String? fotoUrl}) async {
  await _db.from('barberos').insert({
    'barberia_id': barberiaId,
    'nombre': nombre,
    'activo': true,
    if (descripcion != null) 'descripcion': descripcion,
    if (fotoUrl != null) 'foto_url': fotoUrl,
  });
}

Future<void> actualizar(String id, String nombre, bool activo, {String? descripcion, String? fotoUrl}) async {
  await _db.from('barberos').update({
    'nombre': nombre,
    'activo': activo,
    'descripcion': descripcion,
    if (fotoUrl != null) 'foto_url': fotoUrl,
  }).eq('id', id);
}
```

### Flutter: `BarberoFormScreen` actualizado

Agrega sobre los campos existentes:
1. **Avatar con foto**: `CircleAvatar` de 80px. Si tiene `fotoUrl` muestra `NetworkImage`, si no muestra inicial del nombre. Tap → `ImagePicker().pickImage(source: ImageSource.gallery)` → upload a Storage bucket `barberos/{barberiaId}/{uuid}.jpg` → guarda URL en `_fotoUrl`.
2. **Campo descripción**: `TextField` multilínea (maxLines: 3), hint "Descripción del barbero (opcional)", max 200 chars.
3. **pubspec.yaml**: agregar `image_picker: ^1.1.2`

### Web: `BookingWizard` — paso de selección de barbero

**Archivo:** buscar `components/booking/BookingWizard.tsx` (o similar) y actualizar la query en `app/[slug]/reservar/page.tsx`:

```typescript
const { data: barberos } = await supabase
  .from('barberos')
  .select('id, nombre, foto_url, descripcion')  // agregar descripcion
  .eq('barberia_id', barberia.id)
  .eq('activo', true)
```

En el componente de selección de barbero: mostrar foto circular (o inicial si no hay foto) + nombre en negrita + descripción en texto pequeño gris.

---

## Feature 3: Logo upload desde APK

### Storage

- Bucket: `logos` (público, ya puede existir — crear si no existe)
- Path: `logos/{barberiaId}/logo.jpg` (sobreescribe al re-subir)
- RLS bucket: solo admin/superadmin de la barbería puede write

### Flutter: `ConfigScreen`

Agregar tile "Logo de la barbería" que navega a `LogoUploadScreen`.

### Flutter: `LogoUploadScreen` (nuevo)

**Archivo:** `barberia_admin/lib/screens/logo_upload_screen.dart`

- Muestra logo actual (`barberia.logo_url`) si existe, o placeholder gris
- Botón "Cambiar logo" → `ImagePicker().pickImage(source: ImageSource.gallery)`
- Upload a Storage `logos/{barberiaId}/logo.jpg`
- Obtiene URL pública con `supabase.storage.from('logos').getPublicUrl(...)`
- UPDATE `barberias SET logo_url = url WHERE id = barberiaId`
- SnackBar de éxito/error

### Servicio: `BarberiasService` (nuevo)

**Archivo:** `barberia_admin/lib/services/barberias_service.dart`

```dart
class BarberiasService {
  final _db = Supabase.instance.client;

  Future<Map<String, dynamic>?> getBarberia(String barberiaId) async {
    return await _db.from('barberias').select('id, nombre, logo_url').eq('id', barberiaId).maybeSingle();
  }

  Future<void> updateLogoUrl(String barberiaId, String logoUrl) async {
    await _db.from('barberias').update({'logo_url': logoUrl}).eq('id', barberiaId);
  }
}
```

---

## Feature 4: UI 3D/moderna

Aplica glassmorphism, glow dorado y efectos de profundidad. **No cambia funcionalidad, solo CSS/widgets.**

### Web: clases Tailwind nuevas (reutilizables)

```
card-glass:  bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl
btn-gold:    bg-yellow-400 text-black font-bold shadow-[0_0_20px_rgba(250,204,21,0.25)] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] transition-all
card-hover:  hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200
```

### Archivos web a actualizar

| Archivo | Cambio |
|---|---|
| `app/[slug]/page.tsx` | Cards de servicios y alianzas → glassmorphism |
| `app/[slug]/reservar/page.tsx` + BookingWizard | Cards de pasos → glassmorphism, botones → btn-gold |
| `app/[slug]/admin/layout.tsx` | Sidebar con `bg-white/5 backdrop-blur-sm` |
| `app/[slug]/admin/page.tsx` | Cards de stats → glassmorphism |

### Flutter: tokens de estilo

Agregar en `barberia_admin/lib/theme.dart` (o constante local donde se use):

```dart
static const cardDecoration = BoxDecoration(
  color: Color(0xFF27272A),
  borderRadius: BorderRadius.all(Radius.circular(16)),
  boxShadow: [BoxShadow(color: Color(0x1AFACC15), blurRadius: 20, spreadRadius: 2)],
  border: Border.fromBorderSide(BorderSide(color: Color(0x33FACC15), width: 1)),
);

static const elevatedGold = BoxDecoration(
  gradient: LinearGradient(colors: [Color(0xFFFACC15), Color(0xFFD97706)]),
  borderRadius: BorderRadius.all(Radius.circular(12)),
  boxShadow: [BoxShadow(color: Color(0x4DFACC15), blurRadius: 16, offset: Offset(0, 4))],
);
```

Aplicar `cardDecoration` a: `DashboardScreen` stats, `AgendaScreen` cards de reserva, `ConfigScreen` tiles.

---

## Feature 5: Multi-tenancy con código de barbería

### Por qué

El sistema actual permite que cualquier admin con email válido acceda. Se necesita que cada barbería tenga credenciales propias sin cruces.

### Modelo de datos

```sql
ALTER TABLE barberias
  ADD COLUMN IF NOT EXISTS codigo text UNIQUE NOT NULL DEFAULT '';

-- Asignar códigos a barberias existentes (ejecutar una sola vez)
UPDATE barberias SET codigo = upper(substr(replace(id::text, '-', ''), 1, 8)) WHERE codigo = '';

-- Quitar el default después
ALTER TABLE barberias ALTER COLUMN codigo DROP DEFAULT;
```

El `codigo` es el identificador público (ej: `"STYLE2024"`, `"BARBA001"`).

### Mecanismo de auth

El email interno en Supabase Auth se construye como:
```
{codigo.toLowerCase().trim()}@barberia.local
```

El admin **nunca ve ni escribe el email**. Solo escribe código + contraseña.

### Flutter: `AuthService` actualizado

```dart
Future<String?> signIn(String codigo, String password) async {
  final email = '${codigo.toLowerCase().trim()}@barberia.local';
  try {
    final res = await _db.auth.signInWithPassword(email: email, password: password);
    if (res.user == null) return 'No se pudo iniciar sesión';

    final profile = await _db.from('users').select('rol, barberia_id').eq('id', res.user!.id).maybeSingle();
    final rol = profile?['rol'] as String?;
    if (rol != 'admin' && rol != 'superadmin') {
      await _db.auth.signOut();
      return 'Esta cuenta no tiene acceso de administrador';
    }
    return null;
  } on AuthException catch (e) {
    if (e.message.toLowerCase().contains('invalid')) {
      return 'Código o contraseña incorrectos';
    }
    return e.message;
  } catch (_) {
    return 'Error de conexión';
  }
}

Future<String?> getBarberiaId() async {
  final user = _db.auth.currentUser;
  if (user == null) return null;
  final profile = await _db.from('users').select('barberia_id').eq('id', user.id).maybeSingle();
  return profile?['barberia_id'] as String?;
  // Sin fallback: cada admin está ligado a exactamente una barbería
}
```

### Flutter: `LoginScreen` actualizado

- Campo 1: `_codigo` TextEditingController, label `'Código de barbería'`, `TextInputType.text`, sin autocomplete
- Campo 2: `_password` (igual que antes)
- Llamada: `_auth.signIn(_codigo.text.trim(), _password.text)`
- Error genérico: "Código o contraseña incorrectos"
- Eliminar campo `_email`

### Web admin login

El panel web admin (`app/[slug]/admin`) no tiene middleware ni página de login dedicada — actualmente cualquier sesión de Supabase con `rol = admin` puede acceder. Con el sistema de códigos, crear:

**Archivo nuevo:** `app/admin-login/page.tsx` (Client Component)
- Campo "Código de barbería" + Campo "Contraseña"
- Construye email internamente: `${codigo.toLowerCase().trim()}@barberia.local`
- Llama `supabase.auth.signInWithPassword({ email, password })`
- Redirige a `/${slug}/admin` (obtiene el slug desde `users.barberia_id` → `barberias.slug`)
- URL de acceso para admins web: `/admin-login` (no depende del slug de la barbería)

### Script de creación de nueva barbería

**Archivo:** `scripts/crear-barberia.ts` (ejecutar con `npx ts-node scripts/crear-barberia.ts`)

```typescript
// Uso: BARBERIA_NOMBRE="Cortes Estilo" BARBERIA_CODIGO="STYLE2024" ADMIN_PASSWORD="Pass1234!" npx ts-node scripts/crear-barberia.ts
```

Pasos del script:
1. Crear registro en `barberias`: `{ nombre, codigo, slug: codigo.toLowerCase(), activo: true }`
2. Crear usuario en Supabase Auth Admin API: `email: ${codigo.toLowerCase()}@barberia.local`, `password`
3. Crear registro en `users`: `{ id: authUserId, email: ..., rol: 'admin', barberia_id: nuevaBarberia.id }`
4. Imprimir: código, contraseña, URL de acceso

---

## Archivos a crear/modificar

### Supabase migrations
- `supabase/migrations/20260504000001_sugerencias.sql` — tabla sugerencias + RLS
- `supabase/migrations/20260504000002_barbero_descripcion.sql` — columna descripcion
- `supabase/migrations/20260504000003_barberia_codigo.sql` — columna codigo + update existing

### Flutter (barberia_admin)
- `pubspec.yaml` — agregar `image_picker: ^1.1.2`
- `lib/models/barbero.dart` — agregar descripcion, fotoUrl
- `lib/services/barberos_service.dart` — actualizar crear/actualizar
- `lib/services/auth_service.dart` — cambiar signIn a codigo, remover fallback
- `lib/services/barberias_service.dart` — NUEVO
- `lib/screens/login_screen.dart` — campo codigo en vez de email
- `lib/screens/barbero_form_screen.dart` — avatar + foto upload + descripcion
- `lib/screens/config_screen.dart` — tile logo upload
- `lib/screens/logo_upload_screen.dart` — NUEVO
- `lib/screens/dashboard_screen.dart` — glassmorphism cards
- `lib/screens/agenda_screen.dart` — glassmorphism cards

### Next.js web
- `app/admin-login/page.tsx` — NUEVO (login web para admins con código + contraseña)
- `app/[slug]/_components/SugerenciasButton.tsx` — NUEVO
- `app/[slug]/sugerencias/actions.ts` — NUEVO
- `app/[slug]/admin/sugerencias/page.tsx` — NUEVO
- `app/[slug]/admin/layout.tsx` — agregar nav item Sugerencias
- `app/[slug]/page.tsx` — glassmorphism + SugerenciasButton
- `app/[slug]/reservar/page.tsx` — agregar descripcion a query barberos
- `components/booking/BookingWizard.tsx` — cards barbero con foto+desc, glassmorphism
- `app/[slug]/admin/page.tsx` — glassmorphism stats

### Scripts
- `scripts/crear-barberia.ts` — NUEVO

---

## Protecciones y restricciones

- El código de barbería es inmutable una vez creado (no hay UI para cambiarlo)
- Cada admin pertenece a exactamente una barbería — `getBarberiaId()` sin fallback
- El `ip_hash` de sugerencias nunca expone la IP real
- El rate limit de sugerencias es por IP + barbería (no global)
- Las fotos de barberos y logos van a buckets públicos de Supabase Storage — URLs firmadas no son necesarias para contenido público
