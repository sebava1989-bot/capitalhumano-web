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
    await _db.from('barberos').insert(
        {'barberia_id': barberiaId, 'nombre': nombre, 'activo': true});
  }

  Future<void> actualizar(String id, String nombre, bool activo) async {
    await _db
        .from('barberos')
        .update({'nombre': nombre, 'activo': activo}).eq('id', id);
  }

  Future<void> eliminar(String id) async {
    await _db.from('barberos').delete().eq('id', id);
  }
}
