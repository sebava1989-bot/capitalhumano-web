# APK Admin Barbería — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** APK Android nativa para el administrador de la barbería — gestión de citas, clientes, alianzas, barberos y servicios, con push FCM al llegar una reserva nueva.

**Architecture:** Flutter conectado directo a Supabase (supabase_flutter). Admin autentica con email+contraseña; se verifica `rol='admin'` en `public.users`. `barberia_id` viene de `public.users.barberia_id`. Firebase Cloud Messaging notifica al admin vía DB Webhook → Edge Function `notify-admin`. Navegación con BottomNavigationBar + Navigator.push para detalles.

**Tech Stack:** Flutter 3.x, supabase_flutter ^2.5.0, firebase_core ^3.6.0, firebase_messaging ^15.1.3, flutter_local_notifications ^17.2.3, intl ^0.19.0

---

## PREREQUISITO MANUAL (hacer antes de Task 12)
1. Ir a https://console.firebase.google.com → Nuevo proyecto `barberia-saas`
2. Agregar app Android, package name: `cl.tuamigodigital.barberia_admin`
3. Descargar `google-services.json` → copiar a `barberia_admin/android/app/google-services.json`
4. Firebase Console → Cloud Messaging → copiar **Server key (legacy)**
5. Supabase Dashboard → Edge Functions → Secrets → agregar `FCM_SERVER_KEY = <server_key>`
6. Supabase Dashboard → Settings → API → copiar **anon public** key

---

## Task 1: Crear proyecto Flutter

**Files:**
- Crear: `barberia_admin/` (proyecto Flutter)
- Modificar: `barberia_admin/pubspec.yaml`
- Modificar: `barberia_admin/android/app/build.gradle.kts`
- Modificar: `barberia_admin/android/build.gradle.kts`

- [ ] **Step 1: Crear proyecto**
```bash
cd C:/Users/sebas/barberia-saas
flutter create --org cl.tuamigodigital --project-name barberia_admin barberia_admin
```

- [ ] **Step 2: Reemplazar pubspec.yaml**

Contenido completo de `barberia_admin/pubspec.yaml`:
```yaml
name: barberia_admin
description: Panel de administración Barbería SaaS
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  supabase_flutter: ^2.5.0
  firebase_core: ^3.6.0
  firebase_messaging: ^15.1.3
  flutter_local_notifications: ^17.2.3
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true
```

- [ ] **Step 3: Instalar dependencias**
```bash
cd barberia_admin && flutter pub get
```
Esperado: sin errores, genera `pubspec.lock`.

- [ ] **Step 4: Actualizar android/app/build.gradle.kts**

Agregar al bloque `plugins` al inicio del archivo:
```kotlin
id("com.google.gms.google-services")
```
Y en `android { defaultConfig { ... } }` asegurar:
```kotlin
minSdk = 21
```

- [ ] **Step 5: Actualizar android/build.gradle.kts**

Si el archivo existe, agregar en `dependencies` del bloque `buildscript`:
```kotlin
classpath("com.google.gms:google-services:4.4.2")
```
Si no existe `buildscript`, agregar al inicio del archivo:
```kotlin
buildscript {
    repositories { google(); mavenCentral() }
    dependencies { classpath("com.google.gms:google-services:4.4.2") }
}
```

- [ ] **Step 6: Commit**
```bash
git add barberia_admin/
git commit -m "feat: crear proyecto Flutter barberia_admin"
```

---

## Task 2: Config + Modelos

**Files:**
- Crear: `barberia_admin/lib/config/supabase_config.dart`
- Crear: `barberia_admin/lib/models/reserva.dart`
- Crear: `barberia_admin/lib/models/cliente.dart`
- Crear: `barberia_admin/lib/models/alianza.dart`
- Crear: `barberia_admin/lib/models/barbero.dart`
- Crear: `barberia_admin/lib/models/servicio.dart`
- Crear: `barberia_admin/test/models/reserva_test.dart`

- [ ] **Step 1: Crear supabase_config.dart**
```dart
// lib/config/supabase_config.dart
class SupabaseConfig {
  static const url = 'https://rcdcgonvmwzthdumpwga.supabase.co';
  // Supabase Dashboard → Settings → API → anon public
  static const anonKey = 'REEMPLAZAR_CON_ANON_KEY';
}
```

- [ ] **Step 2: Crear reserva.dart**
```dart
// lib/models/reserva.dart
class Reserva {
  final String id;
  final String barberiaId;
  final String? clienteId;
  final String? barberoId;
  final String? servicioId;
  final String clienteNombre;
  final String? clienteEmail;
  final String? clienteTelefono;
  final DateTime fechaHora;
  final String estado;
  final double? precioFinal;
  final String? barberoNombre;
  final String? servicioNombre;
  final int? duracionMin;

  const Reserva({
    required this.id,
    required this.barberiaId,
    this.clienteId,
    this.barberoId,
    this.servicioId,
    required this.clienteNombre,
    this.clienteEmail,
    this.clienteTelefono,
    required this.fechaHora,
    required this.estado,
    this.precioFinal,
    this.barberoNombre,
    this.servicioNombre,
    this.duracionMin,
  });

  factory Reserva.fromJson(Map<String, dynamic> j) => Reserva(
    id: j['id'] as String,
    barberiaId: j['barberia_id'] as String,
    clienteId: j['cliente_id'] as String?,
    barberoId: j['barbero_id'] as String?,
    servicioId: j['servicio_id'] as String?,
    clienteNombre: (j['cliente_nombre'] as String?) ?? 'Sin nombre',
    clienteEmail: j['cliente_email'] as String?,
    clienteTelefono: j['cliente_telefono'] as String?,
    fechaHora: DateTime.parse(j['fecha_hora'] as String).toLocal(),
    estado: j['estado'] as String,
    precioFinal: (j['precio_final'] as num?)?.toDouble(),
    barberoNombre: (j['barberos'] as Map?)?['nombre'] as String?,
    servicioNombre: (j['servicios'] as Map?)?['nombre'] as String?,
    duracionMin: (j['servicios'] as Map?)?['duracion_min'] as int?,
  );
}
```

- [ ] **Step 3: Crear cliente.dart**
```dart
// lib/models/cliente.dart
class Cliente {
  final String id;
  final String nombre;
  final String? email;
  final String? telefono;
  final String? referralCode;
  final int totalVisitas;
  final double gastoTotal;
  final DateTime? ultimaVisita;
  final String segmento;
  final List<String> alianzasAsignadas;

  const Cliente({
    required this.id,
    required this.nombre,
    this.email,
    this.telefono,
    this.referralCode,
    required this.totalVisitas,
    required this.gastoTotal,
    this.ultimaVisita,
    required this.segmento,
    required this.alianzasAsignadas,
  });
}
```

- [ ] **Step 4: Crear alianza.dart**
```dart
// lib/models/alianza.dart
class Alianza {
  final String id;
  final String nombre;
  final int? descuentoPct;
  final bool activo;
  final String? codigoAcceso;
  final int? maxUsosPorCliente;

  const Alianza({
    required this.id,
    required this.nombre,
    this.descuentoPct,
    required this.activo,
    this.codigoAcceso,
    this.maxUsosPorCliente,
  });

  factory Alianza.fromJson(Map<String, dynamic> j) => Alianza(
    id: j['id'] as String,
    nombre: j['nombre'] as String,
    descuentoPct: j['descuento_pct'] as int?,
    activo: j['activo'] as bool? ?? true,
    codigoAcceso: j['codigo_acceso'] as String?,
    maxUsosPorCliente: j['max_usos_por_cliente'] as int?,
  );

  Map<String, dynamic> toInsert(String barberiaId) => {
    'barberia_id': barberiaId,
    'nombre': nombre,
    if (descuentoPct != null) 'descuento_pct': descuentoPct,
    'activo': activo,
    if (codigoAcceso != null && codigoAcceso!.isNotEmpty) 'codigo_acceso': codigoAcceso,
    if (maxUsosPorCliente != null) 'max_usos_por_cliente': maxUsosPorCliente,
  };
}
```

- [ ] **Step 5: Crear barbero.dart**
```dart
// lib/models/barbero.dart
class Barbero {
  final String id;
  final String nombre;
  final bool activo;

  const Barbero({required this.id, required this.nombre, required this.activo});

  factory Barbero.fromJson(Map<String, dynamic> j) => Barbero(
    id: j['id'] as String,
    nombre: j['nombre'] as String,
    activo: j['activo'] as bool? ?? true,
  );
}
```

- [ ] **Step 6: Crear servicio.dart**
```dart
// lib/models/servicio.dart
class Servicio {
  final String id;
  final String nombre;
  final int duracionMin;
  final double precio;
  final bool activo;

  const Servicio({
    required this.id,
    required this.nombre,
    required this.duracionMin,
    required this.precio,
    required this.activo,
  });

  factory Servicio.fromJson(Map<String, dynamic> j) => Servicio(
    id: j['id'] as String,
    nombre: j['nombre'] as String,
    duracionMin: j['duracion_min'] as int? ?? 30,
    precio: (j['precio'] as num?)?.toDouble() ?? 0.0,
    activo: j['activo'] as bool? ?? true,
  );
}
```

- [ ] **Step 7: Escribir test del modelo Reserva**
```dart
// test/models/reserva_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:barberia_admin/models/reserva.dart';

void main() {
  test('Reserva.fromJson parsea campos correctamente', () {
    final json = {
      'id': 'r1',
      'barberia_id': 'b1',
      'cliente_nombre': 'Juan',
      'fecha_hora': '2026-04-28T15:00:00',
      'estado': 'pendiente',
      'precio_final': 8500.0,
      'barberos': {'nombre': 'Pedro'},
      'servicios': {'nombre': 'Corte', 'duracion_min': 30},
    };
    final r = Reserva.fromJson(json);
    expect(r.id, 'r1');
    expect(r.clienteNombre, 'Juan');
    expect(r.estado, 'pendiente');
    expect(r.precioFinal, 8500.0);
    expect(r.barberoNombre, 'Pedro');
    expect(r.servicioNombre, 'Corte');
  });
}
```

- [ ] **Step 8: Correr tests**
```bash
cd barberia_admin && flutter test test/models/reserva_test.dart
```
Esperado: `All tests passed!`

- [ ] **Step 9: Commit**
```bash
git add barberia_admin/lib/config/ barberia_admin/lib/models/ barberia_admin/test/
git commit -m "feat: config Supabase + modelos Reserva/Cliente/Alianza/Barbero/Servicio"
```

---

## Task 3: Servicios de datos

**Files:**
- Crear: `barberia_admin/lib/services/reservas_service.dart`
- Crear: `barberia_admin/lib/services/clientes_service.dart`
- Crear: `barberia_admin/lib/services/alianzas_service.dart`
- Crear: `barberia_admin/lib/services/barberos_service.dart`
- Crear: `barberia_admin/lib/services/servicios_service.dart`

- [ ] **Step 1: Crear reservas_service.dart**
```dart
// lib/services/reservas_service.dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/reserva.dart';

class ReservasService {
  final _db = Supabase.instance.client;

  Future<List<Reserva>> getByFecha(String barberiaId, DateTime fecha) async {
    final inicio = DateTime(fecha.year, fecha.month, fecha.day);
    final fin = inicio.add(const Duration(days: 1));
    final data = await _db
        .from('reservas')
        .select('*, barberos(nombre), servicios(nombre, duracion_min)')
        .eq('barberia_id', barberiaId)
        .gte('fecha_hora', inicio.toIso8601String())
        .lt('fecha_hora', fin.toIso8601String())
        .order('fecha_hora');
    return (data as List).map((e) => Reserva.fromJson(e)).toList();
  }

  Future<List<Reserva>> getSemana(String barberiaId, DateTime desde) async {
    final fin = desde.add(const Duration(days: 7));
    final data = await _db
        .from('reservas')
        .select('*, barberos(nombre), servicios(nombre, duracion_min)')
        .eq('barberia_id', barberiaId)
        .gte('fecha_hora', desde.toIso8601String())
        .lt('fecha_hora', fin.toIso8601String())
        .order('fecha_hora');
    return (data as List).map((e) => Reserva.fromJson(e)).toList();
  }

  Future<Map<String, dynamic>> getStatsHoy(String barberiaId) async {
    final hoy = DateTime.now();
    final inicio = DateTime(hoy.year, hoy.month, hoy.day);
    final fin = inicio.add(const Duration(days: 1));
    final data = await _db
        .from('reservas')
        .select('estado, precio_final')
        .eq('barberia_id', barberiaId)
        .gte('fecha_hora', inicio.toIso8601String())
        .lt('fecha_hora', fin.toIso8601String());
    final reservas = data as List;
    final total = reservas.length;
    final pendientes = reservas.where((r) => r['estado'] == 'pendiente').length;
    final ingresos = reservas
        .where((r) => r['estado'] == 'completada')
        .fold<double>(0, (s, r) => s + ((r['precio_final'] as num?)?.toDouble() ?? 0));
    return {'total': total, 'pendientes': pendientes, 'ingresos': ingresos};
  }

  Future<void> updateEstado(String reservaId, String estado) async {
    await _db.from('reservas').update({'estado': estado}).eq('id', reservaId);
  }
}
```

- [ ] **Step 2: Crear clientes_service.dart**
```dart
// lib/services/clientes_service.dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/cliente.dart';

class ClientesService {
  final _db = Supabase.instance.client;

  Future<List<Cliente>> getClientes(String barberiaId) async {
    final ahora = DateTime.now();
    final hace30 = ahora.subtract(const Duration(days: 30));
    final hace60 = ahora.subtract(const Duration(days: 60));

    final usuarios = await _db
        .from('users')
        .select('id, nombre, telefono, referral_code')
        .eq('barberia_id', barberiaId)
        .eq('rol', 'cliente') as List;

    final reservas = await _db
        .from('reservas')
        .select('cliente_id, estado, precio_final, fecha_hora, cliente_email')
        .eq('barberia_id', barberiaId)
        .inFilter('estado', ['completada', 'confirmada']) as List;

    final asignaciones = await _db
        .from('alianza_clientes')
        .select('alianza_id, cliente_id') as List;

    // Stats map
    final statsMap = <String, Map<String, dynamic>>{};
    final emailMap = <String, String>{};
    for (final r in reservas) {
      final id = r['cliente_id'] as String?;
      if (id == null) continue;
      if (r['cliente_email'] != null && !emailMap.containsKey(id)) {
        emailMap[id] = r['cliente_email'] as String;
      }
      final ts = DateTime.parse(r['fecha_hora'] as String);
      final precio = (r['precio_final'] as num?)?.toDouble() ?? 0;
      if (!statsMap.containsKey(id)) {
        statsMap[id] = {'visitas': 0, 'gasto': 0.0, 'ultima': ts, 'primera': ts};
      }
      statsMap[id]!['visitas'] = (statsMap[id]!['visitas'] as int) + 1;
      if (r['estado'] == 'completada') {
        statsMap[id]!['gasto'] = (statsMap[id]!['gasto'] as double) + precio;
      }
      if (ts.isAfter(statsMap[id]!['ultima'] as DateTime)) statsMap[id]!['ultima'] = ts;
      if (ts.isBefore(statsMap[id]!['primera'] as DateTime)) statsMap[id]!['primera'] = ts;
    }

    // Asignaciones map
    final asignMap = <String, List<String>>{};
    for (final a in asignaciones) {
      final cid = a['cliente_id'] as String;
      asignMap.putIfAbsent(cid, () => []).add(a['alianza_id'] as String);
    }

    return usuarios.map((u) {
      final id = u['id'] as String;
      final stats = statsMap[id];
      final ultima = stats?['ultima'] as DateTime?;
      String segmento = 'nuevo';
      if (stats != null) {
        final primera = stats['primera'] as DateTime;
        if (primera.isBefore(hace30)) {
          segmento = ultima != null && ultima.isBefore(hace60) ? 'inactivo' : 'frecuente';
        }
      }
      return Cliente(
        id: id,
        nombre: (u['nombre'] as String?) ?? 'Sin nombre',
        email: emailMap[id],
        telefono: u['telefono'] as String?,
        referralCode: u['referral_code'] as String?,
        totalVisitas: stats?['visitas'] as int? ?? 0,
        gastoTotal: stats?['gasto'] as double? ?? 0.0,
        ultimaVisita: ultima,
        segmento: segmento,
        alianzasAsignadas: asignMap[id] ?? [],
      );
    }).toList()
      ..sort((a, b) {
        if (a.ultimaVisita != null && b.ultimaVisita != null) {
          return b.ultimaVisita!.compareTo(a.ultimaVisita!);
        }
        if (a.ultimaVisita != null) return -1;
        if (b.ultimaVisita != null) return 1;
        return a.nombre.compareTo(b.nombre);
      });
  }

  Future<List<Map<String, dynamic>>> getHistorial(String clienteId) async {
    final data = await _db
        .from('reservas')
        .select('fecha_hora, estado, precio_final, servicios(nombre), barberos(nombre)')
        .eq('cliente_id', clienteId)
        .order('fecha_hora', ascending: false)
        .limit(10);
    return (data as List).cast<Map<String, dynamic>>();
  }

  Future<void> asignarAlianza(String clienteId, String alianzaId) async {
    await _db.from('alianza_clientes').upsert({
      'cliente_id': clienteId,
      'alianza_id': alianzaId,
    });
  }

  Future<void> quitarAlianza(String clienteId, String alianzaId) async {
    await _db.from('alianza_clientes')
        .delete()
        .eq('cliente_id', clienteId)
        .eq('alianza_id', alianzaId);
  }
}
```

- [ ] **Step 3: Crear alianzas_service.dart**
```dart
// lib/services/alianzas_service.dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/alianza.dart';

class AlianzasService {
  final _db = Supabase.instance.client;

  Future<List<Alianza>> getAll(String barberiaId) async {
    final data = await _db
        .from('alianzas')
        .select()
        .eq('barberia_id', barberiaId)
        .order('nombre');
    return (data as List).map(Alianza.fromJson).toList();
  }

  Future<void> crear(Alianza a, String barberiaId) async {
    await _db.from('alianzas').insert(a.toInsert(barberiaId));
  }

  Future<void> actualizar(String id, Alianza a) async {
    await _db.from('alianzas').update({
      'nombre': a.nombre,
      'descuento_pct': a.descuentoPct,
      'activo': a.activo,
      'codigo_acceso': a.codigoAcceso,
      'max_usos_por_cliente': a.maxUsosPorCliente,
    }).eq('id', id);
  }

  Future<void> eliminar(String id) async {
    await _db.from('alianzas').delete().eq('id', id);
  }
}
```

- [ ] **Step 4: Crear barberos_service.dart**
```dart
// lib/services/barberos_service.dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/barbero.dart';

class BarberosService {
  final _db = Supabase.instance.client;

  Future<List<Barbero>> getAll(String barberiaId) async {
    final data = await _db
        .from('barberos')
        .select()
        .eq('barberia_id', barberiaId)
        .order('nombre');
    return (data as List).map(Barbero.fromJson).toList();
  }

  Future<void> crear(String barberiaId, String nombre) async {
    await _db.from('barberos').insert({'barberia_id': barberiaId, 'nombre': nombre, 'activo': true});
  }

  Future<void> actualizar(String id, String nombre, bool activo) async {
    await _db.from('barberos').update({'nombre': nombre, 'activo': activo}).eq('id', id);
  }

  Future<void> eliminar(String id) async {
    await _db.from('barberos').delete().eq('id', id);
  }
}
```

- [ ] **Step 5: Crear servicios_service.dart**
```dart
// lib/services/servicios_service.dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/servicio.dart';

class ServiciosService {
  final _db = Supabase.instance.client;

  Future<List<Servicio>> getAll(String barberiaId) async {
    final data = await _db
        .from('servicios')
        .select()
        .eq('barberia_id', barberiaId)
        .order('nombre');
    return (data as List).map(Servicio.fromJson).toList();
  }

  Future<void> crear(String barberiaId, String nombre, int duracion, double precio) async {
    await _db.from('servicios').insert({
      'barberia_id': barberiaId, 'nombre': nombre,
      'duracion_min': duracion, 'precio': precio, 'activo': true,
    });
  }

  Future<void> actualizar(String id, String nombre, int duracion, double precio, bool activo) async {
    await _db.from('servicios').update({
      'nombre': nombre, 'duracion_min': duracion, 'precio': precio, 'activo': activo,
    }).eq('id', id);
  }

  Future<void> eliminar(String id) async {
    await _db.from('servicios').delete().eq('id', id);
  }
}
```

- [ ] **Step 6: Commit**
```bash
git add barberia_admin/lib/services/
git commit -m "feat: servicios de datos Supabase (reservas, clientes, alianzas, barberos, servicios)"
```

---

## Task 4: AuthService + main.dart + LoginScreen

**Files:**
- Crear: `barberia_admin/lib/services/auth_service.dart`
- Crear: `barberia_admin/lib/main.dart` (reemplazar el generado)
- Crear: `barberia_admin/lib/screens/login_screen.dart`

- [ ] **Step 1: Crear auth_service.dart**
```dart
// lib/services/auth_service.dart
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService {
  final _db = Supabase.instance.client;

  Future<String?> signIn(String email, String password) async {
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
      if (e.message.toLowerCase().contains('invalid')) return 'Email o contraseña incorrectos';
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
    if (profile?['barberia_id'] != null) return profile!['barberia_id'] as String;
    // Fallback: primera barbería disponible
    final b = await _db.from('barberias').select('id').limit(1).maybeSingle();
    return b?['id'] as String?;
  }

  Future<void> signOut() => _db.auth.signOut();
  bool get isSignedIn => _db.auth.currentUser != null;
}
```

- [ ] **Step 2: Reemplazar lib/main.dart**
```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/supabase_config.dart';
import 'screens/login_screen.dart';
import 'screens/main_shell.dart';
import 'services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: SupabaseConfig.url,
    anonKey: SupabaseConfig.anonKey,
  );
  runApp(const BarberiaAdminApp());
}

class BarberiaAdminApp extends StatelessWidget {
  const BarberiaAdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Barbería Admin',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF18181B),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFFACC15),
          surface: Color(0xFF27272A),
          onPrimary: Colors.black,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF18181B),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        useMaterial3: true,
      ),
      home: AuthService().isSignedIn ? const MainShell() : const LoginScreen(),
    );
  }
}
```

- [ ] **Step 3: Crear login_screen.dart**
```dart
// lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'main_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _auth = AuthService();
  bool _loading = false;
  String? _error;

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    final error = await _auth.signIn(_email.text.trim(), _password.text);
    if (!mounted) return;
    setState(() => _loading = false);
    if (error != null) {
      setState(() => _error = error);
    } else {
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
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: _inputDeco('Email'),
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

- [ ] **Step 4: Verificar que compila**
```bash
cd barberia_admin && flutter build apk --debug 2>&1 | tail -20
```
Esperado: `BUILD SUCCESSFUL` (o error solo porque falta google-services.json — es normal en este punto).

- [ ] **Step 5: Commit**
```bash
git add barberia_admin/lib/
git commit -m "feat: AuthService + LoginScreen + main.dart"
```

---

## Task 5: MainShell (navegación)

**Files:**
- Crear: `barberia_admin/lib/screens/main_shell.dart`

- [ ] **Step 1: Crear main_shell.dart**
```dart
// lib/screens/main_shell.dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'dashboard_screen.dart';
import 'agenda_screen.dart';
import 'clientes_screen.dart';
import 'alianzas_screen.dart';
import 'config_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, this.initialIndex = 0});
  final int initialIndex;
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  String? _barberiaId;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _loadBarberia();
  }

  Future<void> _loadBarberia() async {
    final id = await AuthService().getBarberiaId();
    if (!mounted) return;
    setState(() { _barberiaId = id; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: Color(0xFFFACC15))));
    }
    if (_barberiaId == null) {
      return Scaffold(
        body: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Text('No se encontró barbería asignada.', style: TextStyle(color: Colors.white70)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                await AuthService().signOut();
                if (mounted) Navigator.of(context).pushReplacementNamed('/login');
              },
              child: const Text('Cerrar sesión'),
            ),
          ]),
        ),
      );
    }

    final screens = [
      DashboardScreen(barberiaId: _barberiaId!),
      AgendaScreen(barberiaId: _barberiaId!),
      ClientesScreen(barberiaId: _barberiaId!),
      AlianzasScreen(barberiaId: _barberiaId!),
      ConfigScreen(barberiaId: _barberiaId!),
    ];

    return Scaffold(
      body: screens[_index],
      bottomNavigationBar: NavigationBar(
        backgroundColor: const Color(0xFF27272A),
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        indicatorColor: const Color(0xFFFACC15).withOpacity(0.2),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.bar_chart_outlined), selectedIcon: Icon(Icons.bar_chart, color: Color(0xFFFACC15)), label: 'Inicio'),
          NavigationDestination(icon: Icon(Icons.calendar_today_outlined), selectedIcon: Icon(Icons.calendar_today, color: Color(0xFFFACC15)), label: 'Agenda'),
          NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people, color: Color(0xFFFACC15)), label: 'Clientes'),
          NavigationDestination(icon: Icon(Icons.card_giftcard_outlined), selectedIcon: Icon(Icons.card_giftcard, color: Color(0xFFFACC15)), label: 'Alianzas'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings, color: Color(0xFFFACC15)), label: 'Config'),
        ],
      ),
    );
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add barberia_admin/lib/screens/main_shell.dart
git commit -m "feat: MainShell con BottomNavigationBar"
```

---

## Task 6: DashboardScreen

**Files:**
- Crear: `barberia_admin/lib/screens/dashboard_screen.dart`

- [ ] **Step 1: Crear dashboard_screen.dart**
```dart
// lib/screens/dashboard_screen.dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/reservas_service.dart';

class DashboardScreen extends StatefulWidget {
  final String barberiaId;
  const DashboardScreen({super.key, required this.barberiaId});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _service = ReservasService();
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    final stats = await _service.getStatsHoy(widget.barberiaId);
    if (!mounted) return;
    setState(() { _stats = stats; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final fecha = DateFormat("EEEE d 'de' MMMM", 'es').format(DateTime.now());
    return Scaffold(
      appBar: AppBar(
        title: const Text('Barbería Admin'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFACC15)))
          : RefreshIndicator(
              color: const Color(0xFFFACC15),
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Text(fecha.toUpperCase(),
                      style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 12, letterSpacing: 1)),
                  const SizedBox(height: 4),
                  const Text('Resumen de hoy',
                      style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 24),
                  Row(children: [
                    _StatCard(label: 'Citas hoy', value: '${_stats?['total'] ?? 0}',
                        icon: Icons.calendar_today, color: const Color(0xFFFACC15)),
                    const SizedBox(width: 12),
                    _StatCard(label: 'Pendientes', value: '${_stats?['pendientes'] ?? 0}',
                        icon: Icons.pending_outlined, color: Colors.orange),
                  ]),
                  const SizedBox(height: 12),
                  _StatCard(
                    label: 'Ingresos del día',
                    value: '\$${NumberFormat('#,###', 'es_CL').format(_stats?['ingresos'] ?? 0)}',
                    icon: Icons.attach_money,
                    color: Colors.greenAccent,
                    wide: true,
                  ),
                ],
              ),
            ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final bool wide;
  const _StatCard({required this.label, required this.value, required this.icon, required this.color, this.wide = false});

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF27272A),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 12),
        Text(value, style: TextStyle(color: color, fontSize: 28, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 13)),
      ]),
    );
    return wide ? Expanded(child: card) : Expanded(child: card);
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add barberia_admin/lib/screens/dashboard_screen.dart
git commit -m "feat: DashboardScreen con stats del día"
```

---

## Task 7: AgendaScreen + ReservaDetailScreen

**Files:**
- Crear: `barberia_admin/lib/screens/agenda_screen.dart`
- Crear: `barberia_admin/lib/screens/reserva_detail_screen.dart`

- [ ] **Step 1: Crear agenda_screen.dart**
```dart
// lib/screens/agenda_screen.dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/reserva.dart';
import '../services/reservas_service.dart';
import 'reserva_detail_screen.dart';

class AgendaScreen extends StatefulWidget {
  final String barberiaId;
  const AgendaScreen({super.key, required this.barberiaId});
  @override
  State<AgendaScreen> createState() => _AgendaScreenState();
}

class _AgendaScreenState extends State<AgendaScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _service = ReservasService();

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  Future<List<Reserva>> _load(DateTime fecha) =>
      _service.getByFecha(widget.barberiaId, fecha);

  @override
  Widget build(BuildContext context) {
    final hoy = DateTime.now();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Agenda'),
        bottom: TabBar(
          controller: _tabs,
          labelColor: const Color(0xFFFACC15),
          unselectedLabelColor: const Color(0xFFA1A1AA),
          indicatorColor: const Color(0xFFFACC15),
          tabs: const [Tab(text: 'Hoy'), Tab(text: 'Mañana'), Tab(text: 'Esta semana')],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _ReservasList(future: _load(hoy), onTap: _abrir),
          _ReservasList(future: _load(hoy.add(const Duration(days: 1))), onTap: _abrir),
          _ReservasSemanales(barberiaId: widget.barberiaId, desde: hoy, onTap: _abrir),
        ],
      ),
    );
  }

  void _abrir(Reserva r) async {
    await Navigator.push(context, MaterialPageRoute(
      builder: (_) => ReservaDetailScreen(reserva: r),
    ));
    setState(() {});
  }
}

class _ReservasList extends StatelessWidget {
  final Future<List<Reserva>> future;
  final void Function(Reserva) onTap;
  const _ReservasList({required this.future, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Reserva>>(
      future: future,
      builder: (ctx, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: Color(0xFFFACC15)));
        }
        final reservas = snap.data ?? [];
        if (reservas.isEmpty) {
          return const Center(child: Text('Sin reservas', style: TextStyle(color: Color(0xFFA1A1AA))));
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: reservas.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, i) => _ReservaCard(reserva: reservas[i], onTap: () => onTap(reservas[i])),
        );
      },
    );
  }
}

class _ReservasSemanales extends StatelessWidget {
  final String barberiaId;
  final DateTime desde;
  final void Function(Reserva) onTap;
  const _ReservasSemanales({required this.barberiaId, required this.desde, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Reserva>>(
      future: ReservasService().getSemana(barberiaId, desde),
      builder: (ctx, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: Color(0xFFFACC15)));
        }
        final reservas = snap.data ?? [];
        if (reservas.isEmpty) {
          return const Center(child: Text('Sin reservas esta semana', style: TextStyle(color: Color(0xFFA1A1AA))));
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: reservas.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, i) => _ReservaCard(reserva: reservas[i], onTap: () => onTap(reservas[i])),
        );
      },
    );
  }
}

class _ReservaCard extends StatelessWidget {
  final Reserva reserva;
  final VoidCallback onTap;
  const _ReservaCard({required this.reserva, required this.onTap});

  Color get _estadoColor {
    switch (reserva.estado) {
      case 'confirmada': return Colors.greenAccent;
      case 'completada': return const Color(0xFFA1A1AA);
      case 'cancelada': return Colors.redAccent;
      default: return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    final hora = DateFormat('HH:mm').format(reserva.fechaHora);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF27272A),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(children: [
          Container(
            width: 48,
            alignment: Alignment.center,
            child: Text(hora, style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.bold, fontSize: 15)),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(reserva.clienteNombre, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
            Text('${reserva.servicioNombre ?? '-'} · ${reserva.barberoNombre ?? '-'}',
                style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 13)),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _estadoColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(reserva.estado, style: TextStyle(color: _estadoColor, fontSize: 12)),
          ),
        ]),
      ),
    );
  }
}
```

- [ ] **Step 2: Crear reserva_detail_screen.dart**
```dart
// lib/screens/reserva_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/reserva.dart';
import '../services/reservas_service.dart';

class ReservaDetailScreen extends StatefulWidget {
  final Reserva reserva;
  const ReservaDetailScreen({super.key, required this.reserva});
  @override
  State<ReservaDetailScreen> createState() => _ReservaDetailScreenState();
}

class _ReservaDetailScreenState extends State<ReservaDetailScreen> {
  late String _estado;
  bool _loading = false;
  final _service = ReservasService();

  @override
  void initState() { super.initState(); _estado = widget.reserva.estado; }

  Future<void> _cambiarEstado(String nuevoEstado) async {
    setState(() => _loading = true);
    await _service.updateEstado(widget.reserva.id, nuevoEstado);
    if (!mounted) return;
    setState(() { _estado = nuevoEstado; _loading = false; });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Reserva $nuevoEstado'), backgroundColor: const Color(0xFF27272A)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.reserva;
    final fmt = DateFormat("EEEE d/MM/yyyy 'a las' HH:mm", 'es');
    return Scaffold(
      appBar: AppBar(title: const Text('Detalle reserva')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _InfoTile('Cliente', r.clienteNombre),
          if (r.clienteTelefono != null) _InfoTile('Teléfono', r.clienteTelefono!),
          if (r.clienteEmail != null) _InfoTile('Email', r.clienteEmail!),
          _InfoTile('Servicio', r.servicioNombre ?? '-'),
          _InfoTile('Barbero', r.barberoNombre ?? '-'),
          _InfoTile('Fecha', fmt.format(r.fechaHora)),
          if (r.duracionMin != null) _InfoTile('Duración', '${r.duracionMin} min'),
          if (r.precioFinal != null) _InfoTile('Precio', '\$${NumberFormat('#,###').format(r.precioFinal)}'),
          _InfoTile('Estado', _estado),
          const SizedBox(height: 32),
          if (_loading)
            const Center(child: CircularProgressIndicator(color: Color(0xFFFACC15)))
          else
            _Botones(estado: _estado, onCambiar: _cambiarEstado),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;
  const _InfoTile(this.label, this.value);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(children: [
      SizedBox(width: 100, child: Text(label, style: const TextStyle(color: Color(0xFFA1A1AA)))),
      Expanded(child: Text(value, style: const TextStyle(color: Colors.white))),
    ]),
  );
}

class _Botones extends StatelessWidget {
  final String estado;
  final void Function(String) onCambiar;
  const _Botones({required this.estado, required this.onCambiar});

  @override
  Widget build(BuildContext context) {
    if (estado == 'pendiente') {
      return Column(children: [
        _Btn('Confirmar', Colors.greenAccent, () => onCambiar('confirmada')),
        const SizedBox(height: 12),
        _Btn('Cancelar', Colors.redAccent, () => onCambiar('cancelada')),
      ]);
    }
    if (estado == 'confirmada') {
      return Column(children: [
        _Btn('Completar', const Color(0xFFFACC15), () => onCambiar('completada')),
        const SizedBox(height: 12),
        _Btn('Cancelar', Colors.redAccent, () => onCambiar('cancelada')),
      ]);
    }
    return Center(
      child: Text('Reserva $estado',
          style: const TextStyle(color: Color(0xFFA1A1AA), fontStyle: FontStyle.italic)),
    );
  }
}

class _Btn extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _Btn(this.label, this.color, this.onTap);
  @override
  Widget build(BuildContext context) => SizedBox(
    width: double.infinity,
    child: ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.black,
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
    ),
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add barberia_admin/lib/screens/agenda_screen.dart barberia_admin/lib/screens/reserva_detail_screen.dart
git commit -m "feat: AgendaScreen + ReservaDetailScreen"
```

---

## Task 8: ClientesScreen + ClienteDetailScreen

**Files:**
- Crear: `barberia_admin/lib/screens/clientes_screen.dart`
- Crear: `barberia_admin/lib/screens/cliente_detail_screen.dart`

- [ ] **Step 1: Crear clientes_screen.dart**
```dart
// lib/screens/clientes_screen.dart
import 'package:flutter/material.dart';
import '../models/cliente.dart';
import '../services/clientes_service.dart';
import 'cliente_detail_screen.dart';

class ClientesScreen extends StatefulWidget {
  final String barberiaId;
  const ClientesScreen({super.key, required this.barberiaId});
  @override
  State<ClientesScreen> createState() => _ClientesScreenState();
}

class _ClientesScreenState extends State<ClientesScreen> {
  final _service = ClientesService();
  List<Cliente> _todos = [];
  List<Cliente> _filtrados = [];
  String _segmento = 'todos';
  String _busqueda = '';
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    final clientes = await _service.getClientes(widget.barberiaId);
    if (!mounted) return;
    setState(() { _todos = clientes; _loading = false; _filtrar(); });
  }

  void _filtrar() {
    setState(() {
      _filtrados = _todos.where((c) {
        final matchSeg = _segmento == 'todos' || c.segmento == _segmento;
        final q = _busqueda.toLowerCase();
        final matchQ = q.isEmpty ||
            c.nombre.toLowerCase().contains(q) ||
            (c.telefono?.contains(q) ?? false);
        return matchSeg && matchQ;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Clientes')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFACC15)))
          : Column(children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Buscar por nombre o teléfono',
                    prefixIcon: const Icon(Icons.search, color: Color(0xFFA1A1AA)),
                    filled: true, fillColor: const Color(0xFF27272A),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                  onChanged: (v) { _busqueda = v; _filtrar(); },
                ),
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(children: ['todos', 'frecuente', 'nuevo', 'inactivo'].map((s) {
                  final sel = _segmento == s;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(s),
                      selected: sel,
                      onSelected: (_) { _segmento = s; _filtrar(); },
                      selectedColor: const Color(0xFFFACC15).withOpacity(0.2),
                      labelStyle: TextStyle(color: sel ? const Color(0xFFFACC15) : const Color(0xFFA1A1AA)),
                    ),
                  );
                }).toList()),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: _filtrados.isEmpty
                    ? const Center(child: Text('Sin clientes', style: TextStyle(color: Color(0xFFA1A1AA))))
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _filtrados.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (_, i) {
                          final c = _filtrados[i];
                          return ListTile(
                            tileColor: const Color(0xFF27272A),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            title: Text(c.nombre, style: const TextStyle(color: Colors.white)),
                            subtitle: Text('${c.totalVisitas} visitas · \$${c.gastoTotal.toStringAsFixed(0)}',
                                style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 12)),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: _segColor(c.segmento).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(c.segmento, style: TextStyle(color: _segColor(c.segmento), fontSize: 11)),
                            ),
                            onTap: () => Navigator.push(context,
                                MaterialPageRoute(builder: (_) => ClienteDetailScreen(
                                  cliente: c, barberiaId: widget.barberiaId))),
                          );
                        },
                      ),
              ),
            ]),
    );
  }

  Color _segColor(String s) {
    switch (s) {
      case 'frecuente': return Colors.greenAccent;
      case 'inactivo': return Colors.redAccent;
      default: return const Color(0xFFFACC15);
    }
  }
}
```

- [ ] **Step 2: Crear cliente_detail_screen.dart**
```dart
// lib/screens/cliente_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/cliente.dart';
import '../models/alianza.dart';
import '../services/clientes_service.dart';
import '../services/alianzas_service.dart';

class ClienteDetailScreen extends StatefulWidget {
  final Cliente cliente;
  final String barberiaId;
  const ClienteDetailScreen({super.key, required this.cliente, required this.barberiaId});
  @override
  State<ClienteDetailScreen> createState() => _ClienteDetailScreenState();
}

class _ClienteDetailScreenState extends State<ClienteDetailScreen> {
  final _cService = ClientesService();
  final _aService = AlianzasService();
  List<Alianza> _alianzas = [];
  List<Map<String, dynamic>> _historial = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final results = await Future.wait([
      _aService.getAll(widget.barberiaId),
      _cService.getHistorial(widget.cliente.id),
    ]);
    if (!mounted) return;
    setState(() {
      _alianzas = results[0] as List<Alianza>;
      _historial = results[1] as List<Map<String, dynamic>>;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.cliente;
    return Scaffold(
      appBar: AppBar(title: Text(c.nombre)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (c.telefono != null) _InfoRow('Teléfono', c.telefono!),
          if (c.email != null) _InfoRow('Email', c.email!),
          if (c.referralCode != null && c.referralCode!.isNotEmpty)
            _InfoRow('Código referido', c.referralCode!),
          const SizedBox(height: 16),
          Row(children: [
            _MiniStat('Visitas', '${c.totalVisitas}'),
            const SizedBox(width: 12),
            _MiniStat('Gasto total', '\$${NumberFormat('#,###').format(c.gastoTotal)}'),
            const SizedBox(width: 12),
            _MiniStat('Segmento', c.segmento),
          ]),
          const SizedBox(height: 24),
          const Text('Alianzas asignadas', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (_alianzas.isEmpty)
            const Text('Cargando...', style: TextStyle(color: Color(0xFFA1A1AA)))
          else
            Wrap(
              spacing: 8, runSpacing: 8,
              children: _alianzas.map((a) {
                final asignada = c.alianzasAsignadas.contains(a.id);
                return FilterChip(
                  label: Text('${a.nombre} ${a.descuentoPct != null ? "(${a.descuentoPct}%)" : ""}'),
                  selected: asignada,
                  onSelected: (v) async {
                    if (v) {
                      await _cService.asignarAlianza(c.id, a.id);
                    } else {
                      await _cService.quitarAlianza(c.id, a.id);
                    }
                    if (mounted) setState(() {
                      if (v) c.alianzasAsignadas.add(a.id);
                      else c.alianzasAsignadas.remove(a.id);
                    });
                  },
                  selectedColor: const Color(0xFFFACC15).withOpacity(0.2),
                  labelStyle: TextStyle(color: asignada ? const Color(0xFFFACC15) : const Color(0xFFA1A1AA), fontSize: 12),
                );
              }).toList(),
            ),
          const SizedBox(height: 24),
          const Text('Últimas visitas', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (_historial.isEmpty)
            const Text('Sin historial', style: TextStyle(color: Color(0xFFA1A1AA)))
          else
            ..._historial.map((h) {
              final fecha = DateFormat('dd/MM/yyyy HH:mm').format(
                  DateTime.parse(h['fecha_hora'] as String).toLocal());
              final servicio = (h['servicios'] as Map?)?['nombre'] as String? ?? '-';
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF27272A),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(servicio, style: const TextStyle(color: Colors.white)),
                      Text(fecha, style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 12)),
                    ])),
                    Text(h['estado'] as String? ?? '', style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 12)),
                  ]),
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(children: [
      SizedBox(width: 110, child: Text(label, style: const TextStyle(color: Color(0xFFA1A1AA)))),
      Expanded(child: Text(value, style: const TextStyle(color: Colors.white))),
    ]),
  );
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  const _MiniStat(this.label, this.value);
  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: const Color(0xFF27272A), borderRadius: BorderRadius.circular(10)),
      child: Column(children: [
        Text(value, style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 11)),
      ]),
    ),
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add barberia_admin/lib/screens/clientes_screen.dart barberia_admin/lib/screens/cliente_detail_screen.dart
git commit -m "feat: ClientesScreen + ClienteDetailScreen"
```

---

## Task 9: AlianzasScreen + AlianzaFormScreen

**Files:**
- Crear: `barberia_admin/lib/screens/alianzas_screen.dart`
- Crear: `barberia_admin/lib/screens/alianza_form_screen.dart`

- [ ] **Step 1: Crear alianzas_screen.dart**
```dart
// lib/screens/alianzas_screen.dart
import 'package:flutter/material.dart';
import '../models/alianza.dart';
import '../services/alianzas_service.dart';
import 'alianza_form_screen.dart';

class AlianzasScreen extends StatefulWidget {
  final String barberiaId;
  const AlianzasScreen({super.key, required this.barberiaId});
  @override
  State<AlianzasScreen> createState() => _AlianzasScreenState();
}

class _AlianzasScreenState extends State<AlianzasScreen> {
  final _service = AlianzasService();
  List<Alianza> _alianzas = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await _service.getAll(widget.barberiaId);
    if (!mounted) return;
    setState(() { _alianzas = data; _loading = false; });
  }

  Future<void> _eliminar(Alianza a) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF27272A),
        title: const Text('¿Eliminar alianza?', style: TextStyle(color: Colors.white)),
        content: Text('Se eliminará "${a.nombre}".', style: const TextStyle(color: Color(0xFFA1A1AA))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Eliminar', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    if (confirm == true) {
      await _service.eliminar(a.id);
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Alianzas')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFFACC15),
        foregroundColor: Colors.black,
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(
            builder: (_) => AlianzaFormScreen(barberiaId: widget.barberiaId),
          ));
          _load();
        },
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFACC15)))
          : _alianzas.isEmpty
              ? const Center(child: Text('Sin alianzas. Presiona + para crear.', style: TextStyle(color: Color(0xFFA1A1AA))))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _alianzas.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final a = _alianzas[i];
                    return ListTile(
                      tileColor: const Color(0xFF27272A),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      title: Text(a.nombre, style: const TextStyle(color: Colors.white)),
                      subtitle: Text(
                        '${a.descuentoPct != null ? "${a.descuentoPct}% descuento" : "Sin descuento"} · ${a.activo ? "Activa" : "Inactiva"}',
                        style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 12),
                      ),
                      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                        IconButton(
                          icon: const Icon(Icons.edit_outlined, color: Color(0xFFA1A1AA)),
                          onPressed: () async {
                            await Navigator.push(context, MaterialPageRoute(
                              builder: (_) => AlianzaFormScreen(barberiaId: widget.barberiaId, alianza: a),
                            ));
                            _load();
                          },
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                          onPressed: () => _eliminar(a),
                        ),
                      ]),
                    );
                  },
                ),
    );
  }
}
```

- [ ] **Step 2: Crear alianza_form_screen.dart**
```dart
// lib/screens/alianza_form_screen.dart
import 'package:flutter/material.dart';
import '../models/alianza.dart';
import '../services/alianzas_service.dart';

class AlianzaFormScreen extends StatefulWidget {
  final String barberiaId;
  final Alianza? alianza;
  const AlianzaFormScreen({super.key, required this.barberiaId, this.alianza});
  @override
  State<AlianzaFormScreen> createState() => _AlianzaFormScreenState();
}

class _AlianzaFormScreenState extends State<AlianzaFormScreen> {
  final _nombre = TextEditingController();
  final _descuento = TextEditingController();
  final _codigo = TextEditingController();
  final _maxUsos = TextEditingController();
  bool _activo = true;
  bool _loading = false;
  final _service = AlianzasService();

  @override
  void initState() {
    super.initState();
    if (widget.alianza != null) {
      final a = widget.alianza!;
      _nombre.text = a.nombre;
      _descuento.text = a.descuentoPct?.toString() ?? '';
      _codigo.text = a.codigoAcceso ?? '';
      _maxUsos.text = a.maxUsosPorCliente?.toString() ?? '';
      _activo = a.activo;
    }
  }

  Future<void> _guardar() async {
    if (_nombre.text.trim().isEmpty) return;
    setState(() => _loading = true);
    final a = Alianza(
      id: widget.alianza?.id ?? '',
      nombre: _nombre.text.trim(),
      descuentoPct: int.tryParse(_descuento.text),
      activo: _activo,
      codigoAcceso: _codigo.text.trim().isEmpty ? null : _codigo.text.trim(),
      maxUsosPorCliente: int.tryParse(_maxUsos.text),
    );
    if (widget.alianza == null) {
      await _service.crear(a, widget.barberiaId);
    } else {
      await _service.actualizar(widget.alianza!.id, a);
    }
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final esNueva = widget.alianza == null;
    return Scaffold(
      appBar: AppBar(title: Text(esNueva ? 'Nueva alianza' : 'Editar alianza')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _Campo(_nombre, 'Nombre de la alianza'),
          const SizedBox(height: 12),
          _Campo(_descuento, 'Descuento %', tipo: TextInputType.number),
          const SizedBox(height: 12),
          _Campo(_codigo, 'Código de acceso (opcional)'),
          const SizedBox(height: 12),
          _Campo(_maxUsos, 'Máx. usos por cliente (opcional)', tipo: TextInputType.number),
          const SizedBox(height: 12),
          SwitchListTile(
            title: const Text('Activa', style: TextStyle(color: Colors.white)),
            value: _activo,
            activeColor: const Color(0xFFFACC15),
            onChanged: (v) => setState(() => _activo = v),
            tileColor: const Color(0xFF27272A),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
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
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : Text(esNueva ? 'Crear alianza' : 'Guardar cambios',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}

Widget _Campo(TextEditingController c, String hint, {TextInputType tipo = TextInputType.text}) =>
    TextField(
      controller: c,
      keyboardType: tipo,
      decoration: InputDecoration(
        hintText: hint,
        filled: true, fillColor: const Color(0xFF27272A),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFFACC15)),
        ),
      ),
    );
```

- [ ] **Step 3: Commit**
```bash
git add barberia_admin/lib/screens/alianzas_screen.dart barberia_admin/lib/screens/alianza_form_screen.dart
git commit -m "feat: AlianzasScreen + AlianzaFormScreen"
```

---

## Task 10: BarberosScreen + BarberoFormScreen

**Files:**
- Crear: `barberia_admin/lib/screens/barberos_screen.dart`
- Crear: `barberia_admin/lib/screens/barbero_form_screen.dart`

- [ ] **Step 1: Crear barberos_screen.dart**
```dart
// lib/screens/barberos_screen.dart
import 'package:flutter/material.dart';
import '../models/barbero.dart';
import '../services/barberos_service.dart';
import 'barbero_form_screen.dart';

class BarberosScreen extends StatefulWidget {
  final String barberiaId;
  const BarberosScreen({super.key, required this.barberiaId});
  @override
  State<BarberosScreen> createState() => _BarberosScreenState();
}

class _BarberosScreenState extends State<BarberosScreen> {
  final _service = BarberosService();
  List<Barbero> _barberos = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await _service.getAll(widget.barberiaId);
    if (!mounted) return;
    setState(() { _barberos = data; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Barberos')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFFACC15), foregroundColor: Colors.black,
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(
            builder: (_) => BarberoFormScreen(barberiaId: widget.barberiaId)));
          _load();
        },
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFACC15)))
          : _barberos.isEmpty
              ? const Center(child: Text('Sin barberos. Presiona + para agregar.', style: TextStyle(color: Color(0xFFA1A1AA))))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _barberos.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final b = _barberos[i];
                    return ListTile(
                      tileColor: const Color(0xFF27272A),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      leading: const CircleAvatar(
                        backgroundColor: Color(0xFF3F3F46),
                        child: Icon(Icons.person, color: Color(0xFFA1A1AA)),
                      ),
                      title: Text(b.nombre, style: const TextStyle(color: Colors.white)),
                      subtitle: Text(b.activo ? 'Activo' : 'Inactivo',
                          style: TextStyle(color: b.activo ? Colors.greenAccent : Colors.redAccent, fontSize: 12)),
                      trailing: IconButton(
                        icon: const Icon(Icons.edit_outlined, color: Color(0xFFA1A1AA)),
                        onPressed: () async {
                          await Navigator.push(context, MaterialPageRoute(
                            builder: (_) => BarberoFormScreen(barberiaId: widget.barberiaId, barbero: b)));
                          _load();
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
```

- [ ] **Step 2: Crear barbero_form_screen.dart**
```dart
// lib/screens/barbero_form_screen.dart
import 'package:flutter/material.dart';
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
  bool _activo = true;
  bool _loading = false;
  final _service = BarberosService();

  @override
  void initState() {
    super.initState();
    if (widget.barbero != null) {
      _nombre.text = widget.barbero!.nombre;
      _activo = widget.barbero!.activo;
    }
  }

  Future<void> _guardar() async {
    if (_nombre.text.trim().isEmpty) return;
    setState(() => _loading = true);
    if (widget.barbero == null) {
      await _service.crear(widget.barberiaId, _nombre.text.trim());
    } else {
      await _service.actualizar(widget.barbero!.id, _nombre.text.trim(), _activo);
    }
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.barbero == null ? 'Nuevo barbero' : 'Editar barbero')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          TextField(
            controller: _nombre,
            decoration: InputDecoration(
              hintText: 'Nombre del barbero',
              filled: true, fillColor: const Color(0xFF27272A),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFFACC15))),
            ),
          ),
          if (widget.barbero != null) ...[
            const SizedBox(height: 12),
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
                backgroundColor: const Color(0xFFFACC15), foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(widget.barbero == null ? 'Agregar barbero' : 'Guardar',
                  style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ]),
      ),
    );
  }
}
```

- [ ] **Step 3: Commit**
```bash
git add barberia_admin/lib/screens/barberos_screen.dart barberia_admin/lib/screens/barbero_form_screen.dart
git commit -m "feat: BarberosScreen + BarberoFormScreen"
```

---

## Task 11: ServiciosScreen + ServicioFormScreen

**Files:**
- Crear: `barberia_admin/lib/screens/servicios_screen.dart`
- Crear: `barberia_admin/lib/screens/servicio_form_screen.dart`

- [ ] **Step 1: Crear servicios_screen.dart**
```dart
// lib/screens/servicios_screen.dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/servicio.dart';
import '../services/servicios_service.dart';
import 'servicio_form_screen.dart';

class ServiciosScreen extends StatefulWidget {
  final String barberiaId;
  const ServiciosScreen({super.key, required this.barberiaId});
  @override
  State<ServiciosScreen> createState() => _ServiciosScreenState();
}

class _ServiciosScreenState extends State<ServiciosScreen> {
  final _service = ServiciosService();
  List<Servicio> _servicios = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await _service.getAll(widget.barberiaId);
    if (!mounted) return;
    setState(() { _servicios = data; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Servicios')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFFACC15), foregroundColor: Colors.black,
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(
            builder: (_) => ServicioFormScreen(barberiaId: widget.barberiaId)));
          _load();
        },
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFACC15)))
          : _servicios.isEmpty
              ? const Center(child: Text('Sin servicios. Presiona + para agregar.', style: TextStyle(color: Color(0xFFA1A1AA))))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _servicios.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final s = _servicios[i];
                    return ListTile(
                      tileColor: const Color(0xFF27272A),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      title: Text(s.nombre, style: const TextStyle(color: Colors.white)),
                      subtitle: Text('${s.duracionMin} min · \$${NumberFormat('#,###').format(s.precio)}',
                          style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 12)),
                      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                        if (!s.activo)
                          const Text('Inactivo', style: TextStyle(color: Colors.redAccent, fontSize: 11)),
                        IconButton(
                          icon: const Icon(Icons.edit_outlined, color: Color(0xFFA1A1AA)),
                          onPressed: () async {
                            await Navigator.push(context, MaterialPageRoute(
                              builder: (_) => ServicioFormScreen(barberiaId: widget.barberiaId, servicio: s)));
                            _load();
                          },
                        ),
                      ]),
                    );
                  },
                ),
    );
  }
}
```

- [ ] **Step 2: Crear servicio_form_screen.dart**
```dart
// lib/screens/servicio_form_screen.dart
import 'package:flutter/material.dart';
import '../models/servicio.dart';
import '../services/servicios_service.dart';

class ServicioFormScreen extends StatefulWidget {
  final String barberiaId;
  final Servicio? servicio;
  const ServicioFormScreen({super.key, required this.barberiaId, this.servicio});
  @override
  State<ServicioFormScreen> createState() => _ServicioFormScreenState();
}

class _ServicioFormScreenState extends State<ServicioFormScreen> {
  final _nombre = TextEditingController();
  final _duracion = TextEditingController();
  final _precio = TextEditingController();
  bool _activo = true;
  bool _loading = false;
  final _service = ServiciosService();

  @override
  void initState() {
    super.initState();
    if (widget.servicio != null) {
      final s = widget.servicio!;
      _nombre.text = s.nombre;
      _duracion.text = s.duracionMin.toString();
      _precio.text = s.precio.toStringAsFixed(0);
      _activo = s.activo;
    }
  }

  Future<void> _guardar() async {
    if (_nombre.text.trim().isEmpty) return;
    final dur = int.tryParse(_duracion.text) ?? 30;
    final precio = double.tryParse(_precio.text) ?? 0;
    setState(() => _loading = true);
    if (widget.servicio == null) {
      await _service.crear(widget.barberiaId, _nombre.text.trim(), dur, precio);
    } else {
      await _service.actualizar(widget.servicio!.id, _nombre.text.trim(), dur, precio, _activo);
    }
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.servicio == null ? 'Nuevo servicio' : 'Editar servicio')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _CampoTF(_nombre, 'Nombre del servicio'),
          const SizedBox(height: 12),
          _CampoTF(_duracion, 'Duración (minutos)', tipo: TextInputType.number),
          const SizedBox(height: 12),
          _CampoTF(_precio, 'Precio (\$)', tipo: TextInputType.number),
          if (widget.servicio != null) ...[
            const SizedBox(height: 12),
            SwitchListTile(
              title: const Text('Activo', style: TextStyle(color: Colors.white)),
              value: _activo, activeColor: const Color(0xFFFACC15),
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
                backgroundColor: const Color(0xFFFACC15), foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(widget.servicio == null ? 'Crear servicio' : 'Guardar',
                  style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}

Widget _CampoTF(TextEditingController c, String hint, {TextInputType tipo = TextInputType.text}) =>
    TextField(
      controller: c, keyboardType: tipo,
      decoration: InputDecoration(
        hintText: hint, filled: true, fillColor: const Color(0xFF27272A),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFFACC15))),
      ),
    );
```

- [ ] **Step 3: Commit**
```bash
git add barberia_admin/lib/screens/servicios_screen.dart barberia_admin/lib/screens/servicio_form_screen.dart
git commit -m "feat: ServiciosScreen + ServicioFormScreen"
```

---

## Task 12: ConfigScreen + agregar BarberosScreen/ServiciosScreen a MainShell

**Files:**
- Crear: `barberia_admin/lib/screens/config_screen.dart`
- Modificar: `barberia_admin/lib/screens/main_shell.dart` (agregar navegación a Barberos y Servicios)

- [ ] **Step 1: Crear config_screen.dart**
```dart
// lib/screens/config_screen.dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/auth_service.dart';
import '../services/barberos_service.dart';
import '../services/servicios_service.dart';
import 'barberos_screen.dart';
import 'servicios_screen.dart';
import 'login_screen.dart';

class ConfigScreen extends StatefulWidget {
  final String barberiaId;
  const ConfigScreen({super.key, required this.barberiaId});
  @override
  State<ConfigScreen> createState() => _ConfigScreenState();
}

class _ConfigScreenState extends State<ConfigScreen> {
  String? _nombre;
  String? _slug;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final data = await Supabase.instance.client
        .from('barberias').select('nombre, slug')
        .eq('id', widget.barberiaId).maybeSingle();
    if (!mounted || data == null) return;
    setState(() { _nombre = data['nombre'] as String?; _slug = data['slug'] as String?; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Configuración')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (_nombre != null) _InfoTile('Barbería', _nombre!),
          if (_slug != null) _InfoTile('Slug / URL', _slug!),
          const SizedBox(height: 24),
          const Text('Gestión', style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 12, letterSpacing: 1)),
          const SizedBox(height: 8),
          _NavTile(Icons.content_cut, 'Barberos', () => Navigator.push(context,
              MaterialPageRoute(builder: (_) => BarberosScreen(barberiaId: widget.barberiaId)))),
          const SizedBox(height: 8),
          _NavTile(Icons.list_alt, 'Servicios', () => Navigator.push(context,
              MaterialPageRoute(builder: (_) => ServiciosScreen(barberiaId: widget.barberiaId)))),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () async {
                await AuthService().signOut();
                if (mounted) Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);
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

- [ ] **Step 2: Commit**
```bash
git add barberia_admin/lib/screens/config_screen.dart
git commit -m "feat: ConfigScreen con acceso a Barberos y Servicios"
```

---

## Task 13: Push service + Firebase en main.dart

**PREREQUISITO:** El archivo `barberia_admin/android/app/google-services.json` debe existir antes de este task (ver sección Prerequisito al inicio del plan).

**Files:**
- Crear: `barberia_admin/lib/services/push_service.dart`
- Modificar: `barberia_admin/lib/main.dart`

- [ ] **Step 1: Crear push_service.dart**
```dart
// lib/services/push_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final _localNotif = FlutterLocalNotificationsPlugin();

Future<void> initLocalNotifications() async {
  const android = AndroidInitializationSettings('@mipmap/ic_launcher');
  await _localNotif.initialize(
    const InitializationSettings(android: android),
  );
  await _localNotif.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(const AndroidNotificationChannel(
    'barberia_reservas',
    'Reservas',
    description: 'Notificaciones de nuevas reservas',
    importance: Importance.max,
  ));
}

Future<void> showLocalNotification(String title, String body) async {
  await _localNotif.show(
    DateTime.now().millisecondsSinceEpoch ~/ 1000,
    title, body,
    const NotificationDetails(
      android: AndroidNotificationDetails(
        'barberia_reservas', 'Reservas',
        importance: Importance.max, priority: Priority.high,
      ),
    ),
  );
}

class PushService {
  final _fcm = FirebaseMessaging.instance;

  Future<void> init() async {
    await _fcm.requestPermission(alert: true, badge: true, sound: true);

    // Foreground messages
    FirebaseMessaging.onMessage.listen((msg) {
      final title = msg.notification?.title ?? 'Barbería Admin';
      final body = msg.notification?.body ?? '';
      showLocalNotification(title, body);
    });

    // Guardar token en barberias
    final token = await _fcm.getToken();
    if (token != null) await _guardarToken(token);
    _fcm.onTokenRefresh.listen(_guardarToken);
  }

  Future<void> _guardarToken(String token) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    final profile = await Supabase.instance.client
        .from('users').select('barberia_id').eq('id', user.id).maybeSingle();
    final barberiaId = profile?['barberia_id'] as String?;
    if (barberiaId == null) return;
    await Supabase.instance.client
        .from('barberias')
        .update({'fcm_token_admin': token})
        .eq('id', barberiaId);
  }
}
```

- [ ] **Step 2: Actualizar main.dart con Firebase**

Reemplazar `barberia_admin/lib/main.dart` con:
```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'config/supabase_config.dart';
import 'screens/login_screen.dart';
import 'screens/main_shell.dart';
import 'services/auth_service.dart';
import 'services/push_service.dart';

@pragma('vm:entry-point')
Future<void> _bgHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_bgHandler);
  await Supabase.initialize(
    url: SupabaseConfig.url,
    anonKey: SupabaseConfig.anonKey,
  );
  await initLocalNotifications();
  if (AuthService().isSignedIn) {
    await PushService().init();
  }
  runApp(const BarberiaAdminApp());
}

class BarberiaAdminApp extends StatelessWidget {
  const BarberiaAdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Barbería Admin',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF18181B),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFFACC15),
          surface: Color(0xFF27272A),
          onPrimary: Colors.black,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF18181B),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        useMaterial3: true,
      ),
      home: AuthService().isSignedIn ? const MainShell() : const LoginScreen(),
    );
  }
}
```

- [ ] **Step 3: Actualizar LoginScreen para iniciar push al hacer login**

En `lib/screens/login_screen.dart`, dentro del bloque `if (error == null)`, agregar antes de la navegación:
```dart
await PushService().init();
```

- [ ] **Step 4: Build de prueba**
```bash
cd barberia_admin && flutter build apk --debug 2>&1 | tail -20
```
Esperado: `BUILD SUCCESSFUL`. Si falla por `google-services.json` → completar el Prerequisito primero.

- [ ] **Step 5: Commit**
```bash
git add barberia_admin/lib/
git commit -m "feat: PushService FCM + Firebase init en main.dart"
```

---

## Task 14: Migración DB + Edge Function notify-admin

**Files:**
- Crear: `supabase/migrations/20260428100000_fcm_token_admin.sql`
- Crear: `supabase/functions/notify-admin/index.ts`

- [ ] **Step 1: Crear migración**

Crear `supabase/migrations/20260428100000_fcm_token_admin.sql`:
```sql
ALTER TABLE barberias ADD COLUMN IF NOT EXISTS fcm_token_admin TEXT;
```

- [ ] **Step 2: Aplicar migración en Supabase Dashboard**

Ir a Supabase Dashboard → SQL Editor → pegar y ejecutar:
```sql
ALTER TABLE barberias ADD COLUMN IF NOT EXISTS fcm_token_admin TEXT;
```

- [ ] **Step 3: Crear Edge Function notify-admin**

Crear `supabase/functions/notify-admin/index.ts`:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    barberia_id: string
    cliente_nombre: string
    fecha_hora: string
  }
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()
  if (payload.type !== 'INSERT' || payload.table !== 'reservas') {
    return new Response('ok', { status: 200 })
  }

  const { record } = payload
  const { data: barberia } = await supabase
    .from('barberias')
    .select('fcm_token_admin')
    .eq('id', record.barberia_id)
    .maybeSingle()

  const token = barberia?.fcm_token_admin as string | undefined
  if (!token) return new Response('no token', { status: 200 })

  const fcmKey = Deno.env.get('FCM_SERVER_KEY')
  if (!fcmKey) return new Response('no fcm key', { status: 200 })

  const fecha = new Date(record.fecha_hora).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })

  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${fcmKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      notification: {
        title: '📅 Nueva reserva',
        body: `${record.cliente_nombre} — ${fecha}`,
      },
      data: { reserva_id: record.id },
    }),
  })

  return new Response(JSON.stringify({ ok: res.ok }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 4: Desplegar Edge Function**
```bash
cd C:/Users/sebas/barberia-saas
npx supabase functions deploy notify-admin --project-ref rcdcgonvmwzthdumpwga
```

- [ ] **Step 5: Crear Database Webhook en Supabase Dashboard**

Supabase Dashboard → Database → Webhooks → Create webhook:
- Name: `notify-admin-new-reserva`
- Table: `reservas`
- Events: ✅ Insert
- Type: Supabase Edge Functions
- Edge function: `notify-admin`
- HTTP method: POST

- [ ] **Step 6: Commit**
```bash
git add supabase/migrations/20260428100000_fcm_token_admin.sql supabase/functions/notify-admin/
git commit -m "feat: migración fcm_token_admin + Edge Function notify-admin"
```

---

## Task 15: Build APK final y prueba en dispositivo

- [ ] **Step 1: Verificar que anonKey está configurado**

En `barberia_admin/lib/config/supabase_config.dart`, confirmar que `anonKey` tiene el valor real (no `REEMPLAZAR_CON_ANON_KEY`). Obtenerlo de: Supabase Dashboard → Settings → API → anon public.

- [ ] **Step 2: Build APK release**
```bash
cd C:/Users/sebas/barberia-saas/barberia_admin
flutter build apk --release 2>&1 | tail -20
```
Esperado: `BUILD SUCCESSFUL` y ruta del APK en `build/app/outputs/flutter-apk/app-release.apk`.

- [ ] **Step 3: Instalar en dispositivo**
```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

- [ ] **Step 4: Verificar flujo completo**
  - Login con `seba.v.a1989@gmail.com` / `Admin2026!`
  - Dashboard muestra stats del día
  - Agenda muestra reservas (pestañas Hoy / Mañana / Esta semana)
  - Clientes lista los clientes de la barbería
  - Alianzas permite crear y editar
  - Config muestra nombre de la barbería

- [ ] **Step 5: Verificar push notification**
  - Crear una reserva desde la web `barberia-saas-gamma.vercel.app/barberia-demo/reservar`
  - Confirmar que llega notificación push al dispositivo con la app cerrada

- [ ] **Step 6: Commit final**
```bash
git add barberia_admin/
git commit -m "feat: APK admin barbería — build release listo"
```
