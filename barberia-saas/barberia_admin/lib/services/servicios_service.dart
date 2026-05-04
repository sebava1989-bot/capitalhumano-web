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

  Future<void> crear(
      String barberiaId, String nombre, int duracion, double precio) async {
    await _db.from('servicios').insert({
      'barberia_id': barberiaId,
      'nombre': nombre,
      'duracion_min': duracion,
      'precio': precio,
      'activo': true,
    });
  }

  Future<void> actualizar(String id, String nombre, int duracion,
      double precio, bool activo) async {
    await _db.from('servicios').update({
      'nombre': nombre,
      'duracion_min': duracion,
      'precio': precio,
      'activo': activo,
    }).eq('id', id);
  }

  Future<void> eliminar(String id) async {
    await _db.from('servicios').delete().eq('id', id);
  }
}
