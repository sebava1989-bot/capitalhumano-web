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
