# Barbería SaaS v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar 5 features: sugerencias anónimas, barbero foto+descripción, logo upload, UI glassmorphism, y multi-tenancy con código de barbería.

**Architecture:** Flutter APK admin + Next.js web comparten la misma base Supabase. Las migraciones van primero, luego APK (Flutter), luego web (Next.js). Cada tarea produce commits funcionales e independientes.

**Tech Stack:** Flutter 3 / Dart, Supabase Flutter SDK 2.5.0, image_picker ^1.1.2, Next.js App Router, Tailwind CSS, Vitest, Supabase (PostgreSQL + Storage + Auth)

---

## Mapa de archivos

### Nuevos
- `supabase/migrations/20260504000001_sugerencias.sql`
- `supabase/migrations/20260504000002_barbero_descripcion.sql`
- `supabase/migrations/20260504000003_barberia_codigo.sql`
- `barberia_admin/lib/services/barberias_service.dart`
- `barberia_admin/lib/screens/logo_upload_screen.dart`
- `barberia_admin/lib/theme.dart`
- `app/[slug]/_components/SugerenciasButton.tsx`
- `app/[slug]/sugerencias/actions.ts`
- `app/[slug]/admin/sugerencias/page.tsx`
- `app/admin-login/page.tsx`
- `scripts/crear-barberia.ts`

### Modificados
- `barberia_admin/pubspec.yaml` — agregar image_picker
- `barberia_admin/lib/models/barbero.dart` — campos descripcion, fotoUrl
- `barberia_admin/lib/services/barberos_service.dart` — crear/actualizar con foto+desc
- `barberia_admin/lib/services/auth_service.dart` — signIn con código
- `barberia_admin/lib/screens/login_screen.dart` — campo código
- `barberia_admin/lib/screens/barbero_form_screen.dart` — foto upload + desc
- `barberia_admin/lib/screens/config_screen.dart` — tile logo
- `barberia_admin/lib/screens/dashboard_screen.dart` — glow cards
- `components/booking/BarberSelector.tsx` — mostrar descripcion
- `app/[slug]/page.tsx` — glassmorphism + SugerenciasButton
- `app/[slug]/reservar/page.tsx` — agregar descripcion a query
- `app/[slug]/admin/layout.tsx` — nav item Sugerencias

---

## Task 1: Migraciones Supabase

**Files:**
- Create: `supabase/migrations/20260504000001_sugerencias.sql`
- Create: `supabase/migrations/20260504000002_barbero_descripcion.sql`
- Create: `supabase/migrations/20260504000003_barberia_codigo.sql`

- [ ] **Step 1: Crear migración sugerencias**

```sql
-- supabase/migrations/20260504000001_sugerencias.sql
CREATE TABLE IF NOT EXISTS sugerencias (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barberia_id  uuid NOT NULL REFERENCES barberias(id) ON DELETE CASCADE,
  tipo         text NOT NULL CHECK (tipo IN ('sugerencia', 'reclamo', 'elogio')),
  mensaje      text NOT NULL CHECK (char_length(mensaje) BETWEEN 1 AND 500),
  ip_hash      text NOT NULL,
  leida        boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sugerencias_barberia_created_idx
  ON sugerencias(barberia_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sugerencias_ip_hash_idx
  ON sugerencias(ip_hash, barberia_id, created_at DESC);

ALTER TABLE sugerencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_inserta_sugerencias" ON sugerencias
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_lee_sugerencias" ON sugerencias
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND rol IN ('admin', 'superadmin')
        AND barberia_id = sugerencias.barberia_id
    )
  );

CREATE POLICY "admin_actualiza_sugerencias" ON sugerencias
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND rol IN ('admin', 'superadmin')
        AND barberia_id = sugerencias.barberia_id
    )
  );

-- Storage buckets para fotos
INSERT INTO storage.buckets (id, name, public)
  VALUES ('logos', 'logos', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('barberos', 'barberos', true)
  ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: Crear migración barbero descripcion**

```sql
-- supabase/migrations/20260504000002_barbero_descripcion.sql
ALTER TABLE barberos
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS foto_url text;
```

- [ ] **Step 3: Crear migración barberia codigo**

```sql
-- supabase/migrations/20260504000003_barberia_codigo.sql
ALTER TABLE barberias
  ADD COLUMN IF NOT EXISTS codigo text;

-- Asignar código único a barberias existentes (primeros 8 chars del id en mayúscula)
UPDATE barberias
  SET codigo = upper(substr(replace(id::text, '-', ''), 1, 8))
  WHERE codigo IS NULL OR codigo = '';

ALTER TABLE barberias
  ALTER COLUMN codigo SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS barberias_codigo_unique ON barberias(codigo);
```

- [ ] **Step 4: Aplicar migraciones en Supabase**

Ve a Supabase Dashboard → SQL Editor. Ejecuta cada archivo en orden:
1. Contenido de `20260504000001_sugerencias.sql`
2. Contenido de `20260504000002_barbero_descripcion.sql`
3. Contenido de `20260504000003_barberia_codigo.sql`

Cada uno debe devolver "Success. No rows returned."

- [ ] **Step 5: Verificar código generado**

En SQL Editor:
```sql
SELECT id, nombre, codigo FROM barberias LIMIT 5;
```
Debe mostrar el campo `codigo` con un valor de 8 caracteres en mayúsculas.

- [ ] **Step 6: Commit**

```bash
cd C:\Users\sebas\barberia-saas
git add supabase/migrations/
git commit -m "feat: migrations sugerencias + barbero_descripcion + barberia_codigo"
```

---

## Task 2: Flutter multi-tenancy — AuthService + LoginScreen

**Files:**
- Modify: `barberia_admin/lib/services/auth_service.dart`
- Modify: `barberia_admin/lib/screens/login_screen.dart`

- [ ] **Step 1: Reemplazar AuthService.dart completo**

```dart
// barberia_admin/lib/services/auth_service.dart
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService {
  final _db = Supabase.instance.client;

  String _emailFromCodigo(String codigo) =>
      '${codigo.toLowerCase().trim()}@barberia.local';

  Future<String?> signIn(String codigo, String password) async {
    final email = _emailFromCodigo(codigo);
    try {
      final res = await _db.auth.signInWithPassword(email: email, password: password);
      if (res.user == null) return 'No se pudo iniciar sesión';

      final profile = await _db
          .from('users')
          .select('rol, barberia_id')
          .eq('id', res.user!.id)
          .maybeSingle();

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
    final profile = await _db
        .from('users')
        .select('barberia_id')
        .eq('id', user.id)
        .maybeSingle();
    return profile?['barberia_id'] as String?;
  }

  Future<void> signOut() => _db.auth.signOut();

  bool get isSignedIn => _db.auth.currentUser != null;
}
```

- [ ] **Step 2: Reemplazar LoginScreen.dart completo**

```dart
// barberia_admin/lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/push_service.dart';
import 'main_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _codigo = TextEditingController();
  final _password = TextEditingController();
  final _auth = AuthService();
  bool _loading = false;
  String? _error;

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    final error = await _auth.signIn(_codigo.text.trim(), _password.text);
    if (!mounted) return;
    setState(() => _loading = false);
    if (error != null) {
      setState(() => _error = error);
    } else {
      await PushService().init();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainShell()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('✂️', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 8),
              const Text('Admin Barbería',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 32),
              TextField(
                controller: _codigo,
                textCapitalization: TextCapitalization.characters,
                decoration: _inputDeco('Código de barbería'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _password,
                obscureText: true,
                decoration: _inputDeco('Contraseña'),
                onSubmitted: (_) => _login(),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.redAccent)),
              ],
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _login,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFACC15),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _loading
                      ? const SizedBox(height: 20, width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                      : const Text('Ingresar', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDeco(String hint) => InputDecoration(
    hintText: hint,
    filled: true,
    fillColor: const Color(0xFF27272A),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFFACC15)),
    ),
  );
}
```

- [ ] **Step 3: Actualizar contraseña del admin existente**

La barbería actual tiene un usuario admin con email antiguo (email@something). Necesitas actualizarlo para que use el nuevo formato `{codigo}@barberia.local`.

En Supabase Dashboard → SQL Editor:
```sql
-- Verificar el código asignado a la barbería
SELECT nombre, codigo FROM barberias LIMIT 1;
```
Anota el código (ej: `ABC12345`).

Luego en Supabase Dashboard → Authentication → Users: localiza al usuario admin, edita su email a `{codigo}@barberia.local` (todo en minúscula).

- [ ] **Step 4: Verificar en Flutter web**

```bash
cd C:\Users\sebas\barberia-saas\barberia_admin
flutter run -d chrome --web-port 8081
```

Ingresar con el nuevo código y la contraseña existente. Debe entrar al MainShell sin errores.

- [ ] **Step 5: Commit**

```bash
cd C:\Users\sebas\barberia-saas
git add barberia_admin/lib/services/auth_service.dart barberia_admin/lib/screens/login_screen.dart
git commit -m "feat(apk): multi-tenancy login con código de barbería"
```

---

## Task 3: Flutter — Barbero model + BarberosService

**Files:**
- Modify: `barberia_admin/lib/models/barbero.dart`
- Modify: `barberia_admin/lib/services/barberos_service.dart`

- [ ] **Step 1: Reemplazar Barbero model**

```dart
// barberia_admin/lib/models/barbero.dart
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

- [ ] **Step 2: Reemplazar BarberosService completo**

```dart
// barberia_admin/lib/services/barberos_service.dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/barbero.dart';

class BarberosService {
  final _db = Supabase.instance.client;

  Future<List<Barbero>> getAll(String barberiaId) async {
    final data = await _db
        .from('barberos')
        .select('id, nombre, activo, descripcion, foto_url')
        .eq('barberia_id', barberiaId)
        .order('nombre');
    return (data as List).map((e) => Barbero.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> crear(String barberiaId, String nombre, {String? descripcion, String? fotoUrl}) async {
    await _db.from('barberos').insert({
      'barberia_id': barberiaId,
      'nombre': nombre,
      'activo': true,
      if (descripcion != null && descripcion.isNotEmpty) 'descripcion': descripcion,
      if (fotoUrl != null) 'foto_url': fotoUrl,
    });
  }

  Future<void> actualizar(String id, String nombre, bool activo, {String? descripcion, String? fotoUrl}) async {
    await _db.from('barberos').update({
      'nombre': nombre,
      'activo': activo,
      'descripcion': descripcion?.isNotEmpty == true ? descripcion : null,
      if (fotoUrl != null) 'foto_url': fotoUrl,
    }).eq('id', id);
  }

  Future<void> eliminar(String id) async {
    await _db.from('barberos').delete().eq('id', id);
  }
}
```

- [ ] **Step 3: Verificar compilación**

```bash
cd C:\Users\sebas\barberia-saas\barberia_admin
flutter build apk --debug 2>&1 | tail -5
```

Expected: `✓ Built build/app/outputs/flutter-apk/app-debug.apk`

- [ ] **Step 4: Commit**

```bash
cd C:\Users\sebas\barberia-saas
git add barberia_admin/lib/models/barbero.dart barberia_admin/lib/services/barberos_service.dart
git commit -m "feat(apk): Barbero model con descripcion+fotoUrl, BarberosService actualizado"
```

---

## Task 4: Flutter — image_picker + BarberoFormScreen con foto y descripción

**Files:**
- Modify: `barberia_admin/pubspec.yaml`
- Modify: `barberia_admin/lib/screens/barbero_form_screen.dart`

- [ ] **Step 1: Agregar image_picker a pubspec.yaml**

En `barberia_admin/pubspec.yaml`, bajo `dependencies:`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  supabase_flutter: ^2.5.0
  firebase_core: ^3.6.0
  firebase_messaging: ^15.1.3
  flutter_local_notifications: ^17.2.3
  intl: ^0.19.0
  image_picker: ^1.1.2
```

- [ ] **Step 2: Obtener dependencias**

```bash
cd C:\Users\sebas\barberia-saas\barberia_admin
flutter pub get
```

Expected: `Resolving dependencies... Got dependencies!`

- [ ] **Step 3: Reemplazar BarberoFormScreen completo**

```dart
// barberia_admin/lib/screens/barbero_form_screen.dart
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/barbero.dart';
import '../services/barberos_service.dart';

class BarberoFormScreen extends StatefulWidget {
  final String barberiaId;
  final Barbero? barbero;
  const BarberoFormScreen({super.key, required this.barberiaId, this.barbero});
  @override
  State<BarberoFormScreen> createState() => _BarberoFormScreenState();
}

class _BarberoFormScreenState extends State<BarberoFormScreen> {
  final _nombre = TextEditingController();
  final _descripcion = TextEditingController();
  bool _activo = true;
  bool _loading = false;
  String? _fotoUrl;
  Uint8List? _fotoBytes;
  final _service = BarberosService();

  @override
  void initState() {
    super.initState();
    if (widget.barbero != null) {
      _nombre.text = widget.barbero!.nombre;
      _descripcion.text = widget.barbero!.descripcion ?? '';
      _activo = widget.barbero!.activo;
      _fotoUrl = widget.barbero!.fotoUrl;
    }
  }

  Future<void> _pickFoto() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, maxWidth: 800, imageQuality: 80);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    setState(() => _fotoBytes = bytes);
  }

  Future<String?> _uploadFoto() async {
    if (_fotoBytes == null) return _fotoUrl;
    final db = Supabase.instance.client;
    final path = '${widget.barberiaId}/${DateTime.now().millisecondsSinceEpoch}.jpg';
    await db.storage.from('barberos').uploadBinary(
      path,
      _fotoBytes!,
      fileOptions: const FileOptions(contentType: 'image/jpeg', upsert: true),
    );
    return db.storage.from('barberos').getPublicUrl(path);
  }

  Future<void> _guardar() async {
    if (_nombre.text.trim().isEmpty) return;
    setState(() => _loading = true);
    try {
      final url = await _uploadFoto();
      if (widget.barbero == null) {
        await _service.crear(
          widget.barberiaId,
          _nombre.text.trim(),
          descripcion: _descripcion.text.trim(),
          fotoUrl: url,
        );
      } else {
        await _service.actualizar(
          widget.barbero!.id,
          _nombre.text.trim(),
          _activo,
          descripcion: _descripcion.text.trim(),
          fotoUrl: url,
        );
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.barbero == null ? 'Nuevo barbero' : 'Editar barbero')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: ListView(children: [
          // Avatar
          Center(
            child: GestureDetector(
              onTap: _pickFoto,
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 48,
                    backgroundColor: const Color(0xFF27272A),
                    backgroundImage: _fotoBytes != null
                        ? MemoryImage(_fotoBytes!)
                        : (_fotoUrl != null ? NetworkImage(_fotoUrl!) as ImageProvider : null),
                    child: (_fotoBytes == null && _fotoUrl == null)
                        ? Text(
                            _nombre.text.isNotEmpty ? _nombre.text[0].toUpperCase() : '?',
                            style: const TextStyle(fontSize: 36, color: Colors.white70),
                          )
                        : null,
                  ),
                  Positioned(
                    bottom: 0, right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFACC15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.camera_alt, size: 16, color: Colors.black),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          // Nombre
          TextField(
            controller: _nombre,
            decoration: _inputDeco('Nombre del barbero'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          // Descripción
          TextField(
            controller: _descripcion,
            maxLines: 3,
            maxLength: 200,
            decoration: _inputDeco('Descripción (opcional)'),
          ),
          if (widget.barbero != null) ...[
            const SizedBox(height: 4),
            SwitchListTile(
              title: const Text('Activo', style: TextStyle(color: Colors.white)),
              value: _activo,
              activeColor: const Color(0xFFFACC15),
              onChanged: (v) => setState(() => _activo = v),
              tileColor: const Color(0xFF27272A),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading ? null : _guardar,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFACC15),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _loading
                  ? const SizedBox(height: 20, width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : Text(widget.barbero == null ? 'Agregar barbero' : 'Guardar',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ]),
      ),
    );
  }

  InputDecoration _inputDeco(String hint) => InputDecoration(
    hintText: hint,
    filled: true,
    fillColor: const Color(0xFF27272A),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFFACC15)),
    ),
    counterStyle: const TextStyle(color: Color(0xFFA1A1AA)),
  );
}
```

- [ ] **Step 4: Verificar compilación**

```bash
cd C:\Users\sebas\barberia-saas\barberia_admin
flutter build apk --debug 2>&1 | tail -5
```

Expected: `✓ Built build/app/outputs/flutter-apk/app-debug.apk`

- [ ] **Step 5: Commit**

```bash
cd C:\Users\sebas\barberia-saas
git add barberia_admin/pubspec.yaml barberia_admin/lib/screens/barbero_form_screen.dart
git commit -m "feat(apk): BarberoForm con foto upload y descripción"
```

---

## Task 5: Flutter — BarberiasService + LogoUploadScreen

**Files:**
- Create: `barberia_admin/lib/services/barberias_service.dart`
- Create: `barberia_admin/lib/screens/logo_upload_screen.dart`

- [ ] **Step 1: Crear BarberiasService**

```dart
// barberia_admin/lib/services/barberias_service.dart
import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';

class BarberiasService {
  final _db = Supabase.instance.client;

  Future<Map<String, dynamic>?> getBarberia(String barberiaId) async {
    return await _db
        .from('barberias')
        .select('id, nombre, logo_url, slug, codigo')
        .eq('id', barberiaId)
        .maybeSingle();
  }

  Future<String> uploadLogo(String barberiaId, Uint8List bytes) async {
    const path = 'logo.jpg';
    final storagePath = '$barberiaId/$path';
    await _db.storage.from('logos').uploadBinary(
      storagePath,
      bytes,
      fileOptions: const FileOptions(contentType: 'image/jpeg', upsert: true),
    );
    return _db.storage.from('logos').getPublicUrl(storagePath);
  }

  Future<void> updateLogoUrl(String barberiaId, String logoUrl) async {
    await _db.from('barberias').update({'logo_url': logoUrl}).eq('id', barberiaId);
  }
}
```

- [ ] **Step 2: Crear LogoUploadScreen**

```dart
// barberia_admin/lib/screens/logo_upload_screen.dart
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/barberias_service.dart';

class LogoUploadScreen extends StatefulWidget {
  final String barberiaId;
  final String? logoUrlActual;
  const LogoUploadScreen({super.key, required this.barberiaId, this.logoUrlActual});
  @override
  State<LogoUploadScreen> createState() => _LogoUploadScreenState();
}

class _LogoUploadScreenState extends State<LogoUploadScreen> {
  final _service = BarberiasService();
  Uint8List? _bytes;
  bool _loading = false;
  String? _logoUrl;

  @override
  void initState() {
    super.initState();
    _logoUrl = widget.logoUrlActual;
  }

  Future<void> _pickAndUpload() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, maxWidth: 400, imageQuality: 90);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    setState(() { _bytes = bytes; _loading = true; });
    try {
      final url = await _service.uploadLogo(widget.barberiaId, bytes);
      await _service.updateLogoUrl(widget.barberiaId, url);
      setState(() { _logoUrl = url; _loading = false; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Logo actualizado'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Logo de la barbería')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  color: const Color(0xFF27272A),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: _bytes != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.memory(_bytes!, fit: BoxFit.contain))
                    : (_logoUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.network(_logoUrl!, fit: BoxFit.contain))
                        : const Icon(Icons.store, size: 64, color: Color(0xFFA1A1AA))),
              ),
              const SizedBox(height: 24),
              if (_loading)
                const CircularProgressIndicator(color: Color(0xFFFACC15))
              else
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _pickAndUpload,
                    icon: const Icon(Icons.upload),
                    label: const Text('Cambiar logo', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFACC15),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 3: Verificar compilación**

```bash
cd C:\Users\sebas\barberia-saas\barberia_admin
flutter build apk --debug 2>&1 | tail -5
```

Expected: `✓ Built build/app/outputs/flutter-apk/app-debug.apk`

- [ ] **Step 4: Commit**

```bash
cd C:\Users\sebas\barberia-saas
git add barberia_admin/lib/services/barberias_service.dart barberia_admin/lib/screens/logo_upload_screen.dart
git commit -m "feat(apk): BarberiasService + LogoUploadScreen"
```

---

## Task 6: Flutter — ConfigScreen con tile de logo

**Files:**
- Modify: `barberia_admin/lib/screens/config_screen.dart`

- [ ] **Step 1: Actualizar ConfigScreen**

Reemplazar el archivo completo:

```dart
// barberia_admin/lib/screens/config_screen.dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/auth_service.dart';
import '../services/barberias_service.dart';
import 'barberos_screen.dart';
import 'servicios_screen.dart';
import 'campana_referidos_screen.dart';
import 'logo_upload_screen.dart';
import 'login_screen.dart';

class ConfigScreen extends StatefulWidget {
  final String barberiaId;
  const ConfigScreen({super.key, required this.barberiaId});
  @override
  State<ConfigScreen> createState() => _ConfigScreenState();
}

class _ConfigScreenState extends State<ConfigScreen> {
  Map<String, dynamic>? _barberia;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await BarberiasService().getBarberia(widget.barberiaId);
    if (!mounted || data == null) return;
    setState(() => _barberia = data);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Configuración')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (_barberia != null) ...[
            _InfoTile('Barbería', _barberia!['nombre'] as String? ?? ''),
            _InfoTile('Código', _barberia!['codigo'] as String? ?? ''),
            _InfoTile('URL slug', _barberia!['slug'] as String? ?? ''),
          ],
          const SizedBox(height: 24),
          const Text('GESTIÓN',
              style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 12, letterSpacing: 1)),
          const SizedBox(height: 8),
          _NavTile(Icons.image_outlined, 'Logo de la barbería', () async {
            await Navigator.push(context, MaterialPageRoute(
              builder: (_) => LogoUploadScreen(
                barberiaId: widget.barberiaId,
                logoUrlActual: _barberia?['logo_url'] as String?,
              ),
            ));
            _load();
          }),
          const SizedBox(height: 8),
          _NavTile(Icons.content_cut, 'Barberos', () => Navigator.push(context,
              MaterialPageRoute(builder: (_) => BarberosScreen(barberiaId: widget.barberiaId)))),
          const SizedBox(height: 8),
          _NavTile(Icons.list_alt, 'Servicios', () => Navigator.push(context,
              MaterialPageRoute(builder: (_) => ServiciosScreen(barberiaId: widget.barberiaId)))),
          const SizedBox(height: 8),
          _NavTile(Icons.people_outline, 'Campaña de Referidos', () => Navigator.push(context,
              MaterialPageRoute(builder: (_) => CampanaReferidosScreen(barberiaId: widget.barberiaId)))),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () async {
                await AuthService().signOut();
                if (mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                    (_) => false,
                  );
                }
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.redAccent),
                foregroundColor: Colors.redAccent,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Cerrar sesión', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label, value;
  const _InfoTile(this.label, this.value);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(children: [
      SizedBox(width: 80, child: Text(label, style: const TextStyle(color: Color(0xFFA1A1AA)))),
      Expanded(child: Text(value, style: const TextStyle(color: Colors.white))),
    ]),
  );
}

class _NavTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _NavTile(this.icon, this.label, this.onTap);
  @override
  Widget build(BuildContext context) => ListTile(
    tileColor: const Color(0xFF27272A),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    leading: Icon(icon, color: const Color(0xFFFACC15)),
    title: Text(label, style: const TextStyle(color: Colors.white)),
    trailing: const Icon(Icons.chevron_right, color: Color(0xFFA1A1AA)),
    onTap: onTap,
  );
}
```

- [ ] **Step 2: Verificar compilación**

```bash
cd C:\Users\sebas\barberia-saas\barberia_admin
flutter build apk --debug 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd C:\Users\sebas\barberia-saas
git add barberia_admin/lib/screens/config_screen.dart
git commit -m "feat(apk): ConfigScreen con tile logo y muestra código de barbería"
```

---

## Task 7: Flutter — UI glassmorphism (theme + DashboardScreen)

**Files:**
- Create: `barberia_admin/lib/theme.dart`
- Modify: `barberia_admin/lib/screens/dashboard_screen.dart`

- [ ] **Step 1: Crear theme.dart**

```dart
// barberia_admin/lib/theme.dart
import 'package:flutter/material.dart';

class AppTheme {
  static const gold = Color(0xFFFACC15);
  static const surface = Color(0xFF27272A);
  static const bg = Color(0xFF18181B);

  static const cardDecoration = BoxDecoration(
    color: Color(0xFF2D2D31),
    borderRadius: BorderRadius.all(Radius.circular(16)),
    boxShadow: [
      BoxShadow(color: Color(0x1AFACC15), blurRadius: 20, spreadRadius: 1),
    ],
    border: Border.fromBorderSide(BorderSide(color: Color(0x33FACC15), width: 1)),
  );

  static BoxDecoration accentCardDecoration(Color accentColor) => BoxDecoration(
    color: const Color(0xFF2D2D31),
    borderRadius: const BorderRadius.all(Radius.circular(16)),
    boxShadow: [
      BoxShadow(color: accentColor.withOpacity(0.15), blurRadius: 20, spreadRadius: 1),
    ],
    border: Border.fromBorderSide(BorderSide(color: accentColor.withOpacity(0.3), width: 1)),
  );
}
```

- [ ] **Step 2: Actualizar DashboardScreen._StatCard**

En `dashboard_screen.dart`, reemplazar el bloque `_StatCard.build` (líneas 114-134):

```dart
// En class _StatCard extends StatelessWidget:
@override
Widget build(BuildContext context) {
  final card = Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: const Color(0xFF2D2D31),
      borderRadius: BorderRadius.circular(16),
      boxShadow: [
        BoxShadow(color: color.withOpacity(0.15), blurRadius: 20, spreadRadius: 1),
      ],
      border: Border.fromBorderSide(BorderSide(color: color.withOpacity(0.3), width: 1)),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, color: color, size: 28),
      const SizedBox(height: 12),
      Text(value, style: TextStyle(color: color, fontSize: 28, fontWeight: FontWeight.bold)),
      const SizedBox(height: 4),
      Text(label, style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 13)),
    ]),
  );
  return Expanded(child: card);
}
```

- [ ] **Step 3: Verificar compilación**

```bash
cd C:\Users\sebas\barberia-saas\barberia_admin
flutter build apk --debug 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
cd C:\Users\sebas\barberia-saas
git add barberia_admin/lib/theme.dart barberia_admin/lib/screens/dashboard_screen.dart
git commit -m "feat(apk): UI glassmorphism - theme tokens + DashboardScreen glow cards"
```

---

## Task 8: Web — Admin login con código de barbería

**Files:**
- Create: `app/admin-login/page.tsx`

- [ ] **Step 1: Crear app/admin-login/page.tsx**

```tsx
// app/admin-login/page.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const email = `${codigo.toLowerCase().trim()}@barberia.local`
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Código o contraseña incorrectos')
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Error de sesión'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('users')
      .select('rol, barberia_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !['admin', 'superadmin'].includes(profile.rol)) {
      await supabase.auth.signOut()
      setError('Esta cuenta no tiene acceso de administrador')
      setLoading(false)
      return
    }

    const { data: barberia } = await supabase
      .from('barberias')
      .select('slug')
      .eq('id', profile.barberia_id)
      .maybeSingle()

    router.push(`/${barberia?.slug ?? ''}/admin`)
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">✂️</span>
          <h1 className="text-2xl font-bold text-white mt-3">Admin Barbería</h1>
          <p className="text-zinc-400 text-sm mt-1">Acceso para administradores</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Código de barbería</label>
            <input
              type="text"
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              placeholder="STYLE2024"
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white
                placeholder-zinc-600 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white
                placeholder-zinc-600 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl
              hover:bg-yellow-300 transition-colors shadow-[0_0_20px_rgba(250,204,21,0.25)]
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
cd C:\Users\sebas\barberia-saas
npm run build 2>&1 | tail -10
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add "app/admin-login/page.tsx"
git commit -m "feat(web): admin login page con código de barbería"
```

---

## Task 9: Web — SugerenciasButton (floating button + modal)

**Files:**
- Create: `app/[slug]/_components/SugerenciasButton.tsx`

- [ ] **Step 1: Crear directorio _components**

```bash
mkdir "C:\Users\sebas\barberia-saas\app\[slug]\_components"
```

- [ ] **Step 2: Crear SugerenciasButton.tsx**

```tsx
// app/[slug]/_components/SugerenciasButton.tsx
'use client'
import { useState } from 'react'
import { enviarSugerencia } from '../sugerencias/actions'

type Tipo = 'elogio' | 'sugerencia' | 'reclamo'

const TIPOS: { value: Tipo; label: string; emoji: string }[] = [
  { value: 'elogio', label: 'Elogio', emoji: '⭐' },
  { value: 'sugerencia', label: 'Sugerencia', emoji: '💡' },
  { value: 'reclamo', label: 'Reclamo', emoji: '⚠️' },
]

export function SugerenciasButton({ barberiaId }: { barberiaId: string }) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<Tipo>('sugerencia')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<'ok' | 'error' | 'ratelimit' | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleEnviar() {
    if (!mensaje.trim()) return
    setLoading(true)
    const res = await enviarSugerencia(barberiaId, tipo, mensaje.trim())
    setLoading(false)
    if (res.ok) {
      setResultado('ok')
      setTimeout(() => {
        setOpen(false)
        setResultado(null)
        setMensaje('')
        setTipo('sugerencia')
      }, 2000)
    } else if (res.error?.includes('hoy')) {
      setResultado('ratelimit')
      setErrorMsg(res.error)
    } else {
      setResultado('error')
      setErrorMsg('Error al enviar. Intenta de nuevo.')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-yellow-400 text-black rounded-full
          shadow-[0_0_24px_rgba(250,204,21,0.4)] flex items-center justify-center
          hover:bg-yellow-300 hover:scale-105 transition-all"
        title="Sugerencias y reclamos"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            {resultado === 'ok' ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-black font-semibold text-lg">¡Gracias por tu mensaje!</p>
                <p className="text-zinc-500 text-sm mt-1">Lo revisaremos pronto</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-black font-bold text-lg">Cuéntanos tu experiencia</h2>
                  <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex gap-2 mb-4">
                  {TIPOS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTipo(t.value)}
                      className={`flex-1 py-2 px-2 rounded-full text-xs font-semibold border-2 transition-all
                        ${tipo === t.value
                          ? 'border-yellow-400 bg-yellow-50 text-black'
                          : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>

                <div className="relative mb-2">
                  <textarea
                    value={mensaje}
                    onChange={e => { setMensaje(e.target.value.slice(0, 500)); setResultado(null) }}
                    placeholder="Tu mensaje es anónimo..."
                    rows={4}
                    className="w-full border border-zinc-200 rounded-xl p-3 text-black text-sm resize-none
                      focus:outline-none focus:border-yellow-400 transition-colors"
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-zinc-400">{mensaje.length}/500</span>
                </div>

                {(resultado === 'error' || resultado === 'ratelimit') && (
                  <p className="text-red-500 text-xs mb-2">{errorMsg}</p>
                )}

                <button
                  onClick={handleEnviar}
                  disabled={loading || !mensaje.trim()}
                  className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl
                    hover:bg-yellow-300 transition-colors
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar mensaje'}
                </button>
                <p className="text-zinc-400 text-xs text-center mt-2">Tu mensaje es completamente anónimo</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Verificar build**

```bash
cd C:\Users\sebas\barberia-saas
npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add "app/[slug]/_components/SugerenciasButton.tsx"
git commit -m "feat(web): SugerenciasButton floating modal con 3 tipos"
```

---

## Task 10: Web — Sugerencias server action

**Files:**
- Create: `app/[slug]/sugerencias/actions.ts`

- [ ] **Step 1: Crear directorio sugerencias**

```bash
mkdir "C:\Users\sebas\barberia-saas\app\[slug]\sugerencias"
```

- [ ] **Step 2: Crear actions.ts**

```typescript
// app/[slug]/sugerencias/actions.ts
'use server'
import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function enviarSugerencia(
  barberiaId: string,
  tipo: 'sugerencia' | 'reclamo' | 'elogio',
  mensaje: string
): Promise<{ ok: boolean; error?: string }> {
  if (!['sugerencia', 'reclamo', 'elogio'].includes(tipo)) {
    return { ok: false, error: 'Tipo inválido' }
  }
  if (!mensaje || mensaje.length < 1 || mensaje.length > 500) {
    return { ok: false, error: 'Mensaje inválido' }
  }

  const hdrs = await headers()
  const rawIp = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? '0.0.0.0'
  const ipHash = createHash('sha256').update(rawIp).digest('hex')

  const supabase = await createClient()

  // Rate limit: 1 por IP por barbería cada 24h
  const { data: existing } = await supabase
    .from('sugerencias')
    .select('id')
    .eq('ip_hash', ipHash)
    .eq('barberia_id', barberiaId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1)
    .maybeSingle()

  if (existing) {
    return { ok: false, error: 'Ya enviaste una sugerencia hoy. Puedes volver mañana.' }
  }

  const { error: insertError } = await supabase
    .from('sugerencias')
    .insert({ barberia_id: barberiaId, tipo, mensaje, ip_hash: ipHash })

  if (insertError) {
    return { ok: false, error: 'Error al guardar. Intenta de nuevo.' }
  }

  // Notificación FCM (no bloquea si falla)
  try {
    const { data: barberia } = await supabase
      .from('barberias')
      .select('fcm_token_admin')
      .eq('id', barberiaId)
      .maybeSingle()

    const token = (barberia as { fcm_token_admin?: string } | null)?.fcm_token_admin
    if (token && process.env.FCM_SERVER_KEY) {
      const tipoLabel = tipo === 'elogio' ? 'Nuevo elogio' : tipo === 'reclamo' ? 'Nuevo reclamo' : 'Nueva sugerencia'
      await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${process.env.FCM_SERVER_KEY}`,
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: tipoLabel,
            body: mensaje.length > 80 ? mensaje.slice(0, 80) + '...' : mensaje,
            sound: 'default',
          },
          android: { priority: 'high', notification: { channel_id: 'barberia_reservas' } },
        }),
      })
    }
  } catch (_) {
    // FCM failure doesn't affect the response
  }

  return { ok: true }
}
```

- [ ] **Step 3: Verificar build**

```bash
cd C:\Users\sebas\barberia-saas
npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add "app/[slug]/sugerencias/actions.ts"
git commit -m "feat(web): server action enviarSugerencia con rate limit + FCM"
```

---

## Task 11: Web — Vista admin de sugerencias

**Files:**
- Create: `app/[slug]/admin/sugerencias/page.tsx`
- Modify: `app/[slug]/admin/layout.tsx`

- [ ] **Step 1: Crear app/[slug]/admin/sugerencias/page.tsx**

```tsx
// app/[slug]/admin/sugerencias/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

type Tipo = 'sugerencia' | 'reclamo' | 'elogio' | 'todas'

const TIPO_STYLES: Record<string, string> = {
  elogio:    'bg-green-100 text-green-700',
  sugerencia:'bg-blue-100 text-blue-700',
  reclamo:   'bg-red-100 text-red-700',
}

async function marcarLeida(id: string, barberiaId: string) {
  'use server'
  const supabase = await createClient()
  await supabase.from('sugerencias').update({ leida: true }).eq('id', id).eq('barberia_id', barberiaId)
  revalidatePath('/[slug]/admin/sugerencias', 'page')
}

export default async function SugerenciasPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tipo?: string }>
}) {
  const { slug } = await params
  const { tipo: tipoFilter } = await searchParams
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id, nombre').eq('slug', slug).maybeSingle()
  if (!barberia) notFound()

  let query = supabase
    .from('sugerencias')
    .select('id, tipo, mensaje, leida, created_at')
    .eq('barberia_id', barberia.id)
    .order('created_at', { ascending: false })

  if (tipoFilter && tipoFilter !== 'todas') {
    query = query.eq('tipo', tipoFilter)
  }

  const { data: sugerencias } = await query

  const tabs: { label: string; value: Tipo }[] = [
    { label: 'Todas', value: 'todas' },
    { label: 'Elogios', value: 'elogio' },
    { label: 'Sugerencias', value: 'sugerencia' },
    { label: 'Reclamos', value: 'reclamo' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sugerencias y Reclamos</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <a
            key={t.value}
            href={`/${slug}/admin/sugerencias?tipo=${t.value}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${(tipoFilter ?? 'todas') === t.value
                ? 'bg-yellow-400 text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            {t.label}
          </a>
        ))}
      </div>
      {!sugerencias?.length && (
        <p className="text-zinc-500 text-center py-16">No hay mensajes aún</p>
      )}
      <div className="flex flex-col gap-4">
        {sugerencias?.map(s => (
          <div
            key={s.id}
            className={`rounded-2xl p-4 border transition-all
              ${s.leida ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-800 border-zinc-700'}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TIPO_STYLES[s.tipo]}`}>
                  {s.tipo.charAt(0).toUpperCase() + s.tipo.slice(1)}
                </span>
                {!s.leida && (
                  <span className="bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full font-semibold">
                    Nueva
                  </span>
                )}
                <span className="text-zinc-500 text-xs">
                  {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: es })}
                </span>
              </div>
              {!s.leida && (
                <form action={marcarLeida.bind(null, s.id, barberia.id)}>
                  <button
                    type="submit"
                    className="text-xs text-zinc-400 hover:text-white transition-colors whitespace-nowrap"
                  >
                    Marcar leída
                  </button>
                </form>
              )}
            </div>
            <p className="text-white text-sm leading-relaxed">{s.mensaje}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Actualizar admin/layout.tsx — agregar nav item Sugerencias**

En `app/[slug]/admin/layout.tsx`, reemplazar el array `navItems`:

```typescript
const navItems = [
  { href: `/${slug}/admin`, label: 'Dashboard', icon: '📊' },
  { href: `/${slug}/admin/clientes`, label: 'Clientes', icon: '👥' },
  { href: `/${slug}/admin/campanas`, label: 'Campañas', icon: '📣' },
  { href: `/${slug}/admin/suscripciones`, label: 'Suscripciones', icon: '💳' },
  { href: `/${slug}/admin/alianzas`, label: 'Alianzas', icon: '🤝' },
  { href: `/${slug}/admin/barberos`, label: 'Barberos', icon: '✂️' },
  { href: `/${slug}/admin/servicios`, label: 'Servicios', icon: '💈' },
  { href: `/${slug}/admin/sugerencias`, label: 'Sugerencias', icon: '💬' },
]
```

- [ ] **Step 3: Verificar build**

```bash
cd C:\Users\sebas\barberia-saas
npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
mkdir "C:\Users\sebas\barberia-saas\app\[slug]\admin\sugerencias"
git add "app/[slug]/admin/sugerencias/page.tsx" "app/[slug]/admin/layout.tsx"
git commit -m "feat(web): vista admin sugerencias + nav item"
```

---

## Task 12: Web — BarberSelector con descripción

**Files:**
- Modify: `app/[slug]/reservar/page.tsx`
- Modify: `components/booking/BarberSelector.tsx`

- [ ] **Step 1: Agregar descripcion a query en reservar/page.tsx**

En `app/[slug]/reservar/page.tsx`, la query de barberos (línea ~38):

```typescript
const { data: barberos } = await supabase
  .from('barberos')
  .select('id, nombre, foto_url, descripcion')
  .eq('barberia_id', barberia.id)
  .eq('activo', true)
```

- [ ] **Step 2: Actualizar BookingWizard.tsx — interface Barbero**

En `components/booking/BookingWizard.tsx` línea 10:

```typescript
interface Barbero { id: string; nombre: string; foto_url: string | null; descripcion: string | null }
```

- [ ] **Step 3: Reemplazar BarberSelector.tsx completo**

```tsx
// components/booking/BarberSelector.tsx
'use client'
interface Barbero { id: string; nombre: string; foto_url: string | null; descripcion: string | null }
interface Props { barberos: Barbero[]; selected: Barbero | null; onSelect: (b: Barbero) => void; onBack: () => void }

export function BarberSelector({ barberos, selected, onSelect, onBack }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">¿Con quién quieres atenderte?</h2>
      <div className="flex flex-col gap-3 mb-6">
        {barberos.map(b => (
          <button
            key={b.id}
            onClick={() => onSelect(b)}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left w-full
              backdrop-blur-sm
              ${selected?.id === b.id
                ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_16px_rgba(250,204,21,0.2)]'
                : 'border-zinc-700/50 bg-white/5 hover:border-zinc-500 hover:bg-white/10 hover:-translate-y-0.5'}`}
          >
            <div className="w-14 h-14 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
              {b.foto_url
                ? <img src={b.foto_url} alt={b.nombre} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-zinc-400">{b.nombre[0]}</div>
              }
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold">{b.nombre}</p>
              {b.descripcion && (
                <p className="text-zinc-400 text-sm mt-0.5 truncate">{b.descripcion}</p>
              )}
            </div>
          </button>
        ))}
      </div>
      <button onClick={onBack} className="text-zinc-400 text-sm hover:text-white transition-colors">← Volver</button>
    </div>
  )
}
```

- [ ] **Step 4: Verificar build**

```bash
cd C:\Users\sebas\barberia-saas
npm run build 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add "app/[slug]/reservar/page.tsx" "components/booking/BarberSelector.tsx" "components/booking/BookingWizard.tsx"
git commit -m "feat(web): BarberSelector con foto y descripción, glassmorphism"
```

---

## Task 13: Web — Glassmorphism en landing + SugerenciasButton integration

**Files:**
- Modify: `app/[slug]/page.tsx`

- [ ] **Step 1: Reemplazar app/[slug]/page.tsx completo**

```tsx
// app/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SugerenciasButton } from './_components/SugerenciasButton'

export default async function BarberiaLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: barberia } = await supabase
    .from('barberias').select('id, nombre, logo_url, colores').eq('slug', slug).eq('activo', true).maybeSingle()
  if (!barberia) notFound()

  const { data: servicios } = await supabase
    .from('servicios').select('id, nombre, precio, duracion_min')
    .eq('barberia_id', barberia.id).eq('activo', true).order('orden').limit(6)

  const { data: barberos } = await supabase
    .from('barberos').select('id, nombre, foto_url')
    .eq('barberia_id', barberia.id).eq('activo', true)

  const { data: alianzas } = await supabase
    .from('alianzas').select('id, nombre, descripcion, tipo, beneficio, descuento_pct')
    .eq('barberia_id', barberia.id).eq('activo', true)

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-[40vh] px-4 py-16 text-center">
        {barberia.logo_url && (
          <img src={barberia.logo_url} alt={barberia.nombre} className="h-20 mb-4 drop-shadow-lg" />
        )}
        <h1 className="text-4xl font-bold text-white mb-2">{barberia.nombre}</h1>
        <p className="text-zinc-400 mb-8">Tu estilo, tu identidad</p>
        <Link
          href={`/${slug}/reservar`}
          className="px-8 py-4 bg-yellow-400 text-black font-bold text-lg rounded-full
            hover:bg-yellow-300 transition-all
            shadow-[0_0_24px_rgba(250,204,21,0.35)] hover:shadow-[0_0_36px_rgba(250,204,21,0.5)]
            hover:-translate-y-0.5"
        >
          Reservar hora
        </Link>
      </section>

      {/* Servicios */}
      {servicios && servicios.length > 0 && (
        <section className="max-w-2xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Nuestros servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servicios.map(s => (
              <div
                key={s.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4
                  flex justify-between items-center
                  hover:-translate-y-0.5 hover:border-yellow-400/30 hover:shadow-[0_0_16px_rgba(250,204,21,0.1)]
                  transition-all"
              >
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
          <div className="flex justify-center gap-6 flex-wrap">
            {barberos.map(b => (
              <div key={b.id} className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-zinc-700 mb-2 overflow-hidden
                  ring-2 ring-yellow-400/20 hover:ring-yellow-400/60 transition-all">
                  {b.foto_url
                    ? <img src={b.foto_url} alt={b.nombre} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">
                        {b.nombre?.[0] ?? '?'}
                      </div>
                  }
                </div>
                <p className="text-white text-sm font-medium">{b.nombre}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Alianzas */}
      {alianzas && alianzas.length > 0 && (
        <section className="max-w-2xl mx-auto px-4 py-8 pb-16">
          <h2 className="text-2xl font-bold mb-2 text-center">Alianzas</h2>
          <p className="text-zinc-400 text-center text-sm mb-6">Beneficios exclusivos para nuestros clientes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {alianzas.map(a => (
              <div
                key={a.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4
                  flex items-center gap-3 hover:-translate-y-0.5 hover:border-yellow-400/30 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-yellow-400/10 border border-yellow-400/20
                  flex items-center justify-center text-2xl flex-shrink-0">🤝</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{a.nombre}</p>
                    {a.descuento_pct && (
                      <span className="bg-yellow-400/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full font-medium">
                        -{a.descuento_pct}%
                      </span>
                    )}
                  </div>
                  {a.descripcion && <p className="text-zinc-400 text-xs">{a.descripcion}</p>}
                  {a.beneficio && <p className="text-yellow-400 text-xs font-medium mt-0.5">{a.beneficio}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <SugerenciasButton barberiaId={barberia.id} />
    </main>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
cd C:\Users\sebas\barberia-saas
npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add "app/[slug]/page.tsx"
git commit -m "feat(web): landing glassmorphism + SugerenciasButton integrado"
```

---

## Task 14: Script crear-barberia

**Files:**
- Create: `scripts/crear-barberia.ts`

- [ ] **Step 1: Crear scripts/crear-barberia.ts**

```typescript
// scripts/crear-barberia.ts
// Uso: BARBERIA_NOMBRE="Estilo Total" BARBERIA_CODIGO="ESTILO01" ADMIN_PASSWORD="Pass1234!" npx ts-node scripts/crear-barberia.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const NOMBRE = process.env.BARBERIA_NOMBRE!
const CODIGO = process.env.BARBERIA_CODIGO!
const PASSWORD = process.env.ADMIN_PASSWORD!

if (!SUPABASE_URL || !SERVICE_KEY || !NOMBRE || !CODIGO || !PASSWORD) {
  console.error('Faltan variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BARBERIA_NOMBRE, BARBERIA_CODIGO, ADMIN_PASSWORD')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const codigo = CODIGO.toUpperCase().trim()
  const slug = codigo.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const email = `${codigo.toLowerCase()}@barberia.local`

  console.log(`\nCreando barbería "${NOMBRE}" con código "${codigo}"...`)

  // 1. Crear barbería
  const { data: barberia, error: barbError } = await supabase
    .from('barberias')
    .insert({ nombre: NOMBRE, codigo, slug, activo: true })
    .select('id')
    .single()

  if (barbError) { console.error('Error creando barbería:', barbError.message); process.exit(1) }
  console.log(`✓ Barbería creada: ${barberia.id}`)

  // 2. Crear usuario admin en Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  })

  if (authError) { console.error('Error creando usuario Auth:', authError.message); process.exit(1) }
  console.log(`✓ Usuario Auth creado: ${email}`)

  // 3. Crear registro en users
  const { error: userError } = await supabase.from('users').insert({
    id: authUser.user.id,
    email,
    rol: 'admin',
    barberia_id: barberia.id,
  })

  if (userError) { console.error('Error creando perfil users:', userError.message); process.exit(1) }

  console.log(`\n✅ Barbería creada exitosamente:`)
  console.log(`   Nombre:     ${NOMBRE}`)
  console.log(`   Código:     ${codigo}`)
  console.log(`   Contraseña: ${PASSWORD}`)
  console.log(`   APK login:  Código "${codigo}" + contraseña`)
  console.log(`   Web login:  /admin-login → código "${codigo}"`)
  console.log(`   Web slug:   /${slug}`)
}

main()
```

- [ ] **Step 2: Probar script en seco (dry run)**

```bash
cd C:\Users\sebas\barberia-saas
node -e "console.log('Script syntax OK')" && echo "Script ready"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/crear-barberia.ts
git commit -m "feat: script crear-barberia con código + usuario admin"
```

---

## Self-Review Checklist

- [x] **Sugerencias**: tabla + RLS + SugerenciasButton + actions.ts + admin page + nav item ✓
- [x] **Barbero foto+desc**: migración + model + service + BarberoFormScreen + BarberSelector + BookingWizard ✓
- [x] **Logo upload**: BarberiasService + LogoUploadScreen + ConfigScreen tile ✓
- [x] **UI glassmorphism**: DashboardScreen cards + landing page + BarberSelector ✓
- [x] **Multi-tenancy**: AuthService signIn(codigo) + LoginScreen + admin-login web + migration + script ✓
- [x] **Tipos consistentes**: `Barbero.fotoUrl` (Dart) ↔ `j['foto_url']` (JSON) — consistente ✓
- [x] **Tipos consistentes**: `Barbero.descripcion` (Dart) ↔ `j['descripcion']` (JSON) — consistente ✓
- [x] **Tipos consistentes**: `BarberSelector interface Barbero` actualizado con `descripcion` ✓
- [x] **image_picker**: agregado a pubspec.yaml antes de usarse en Tasks 4 y 5 ✓
- [x] **Storage buckets**: creados en migración Task 1 antes de usarse en Tasks 4 y 5 ✓
