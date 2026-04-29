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
