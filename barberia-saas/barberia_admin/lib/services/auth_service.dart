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
