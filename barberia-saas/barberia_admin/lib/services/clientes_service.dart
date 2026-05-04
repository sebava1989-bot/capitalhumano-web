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
        statsMap[id] = {
          'visitas': 0,
          'gasto': 0.0,
          'ultima': ts,
          'primera': ts
        };
      }
      statsMap[id]!['visitas'] = (statsMap[id]!['visitas'] as int) + 1;
      if (r['estado'] == 'completada') {
        statsMap[id]!['gasto'] =
            (statsMap[id]!['gasto'] as double) + precio;
      }
      if (ts.isAfter(statsMap[id]!['ultima'] as DateTime)) {
        statsMap[id]!['ultima'] = ts;
      }
      if (ts.isBefore(statsMap[id]!['primera'] as DateTime)) {
        statsMap[id]!['primera'] = ts;
      }
    }

    final asignMap = <String, List<String>>{};
    for (final a in asignaciones) {
      final cid = a['cliente_id'] as String;
      asignMap.putIfAbsent(cid, () => []).add(a['alianza_id'] as String);
    }

    final clientes = usuarios.map((u) {
      final id = u['id'] as String;
      final stats = statsMap[id];
      final ultima = stats?['ultima'] as DateTime?;
      String segmento = 'nuevo';
      if (stats != null) {
        final primera = stats['primera'] as DateTime;
        if (primera.isBefore(hace30)) {
          segmento = ultima != null && ultima.isBefore(hace60)
              ? 'inactivo'
              : 'frecuente';
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
    }).toList();

    clientes.sort((a, b) {
      if (a.ultimaVisita != null && b.ultimaVisita != null) {
        return b.ultimaVisita!.compareTo(a.ultimaVisita!);
      }
      if (a.ultimaVisita != null) return -1;
      if (b.ultimaVisita != null) return 1;
      return a.nombre.compareTo(b.nombre);
    });

    return clientes;
  }

  Future<List<Map<String, dynamic>>> getHistorial(String clienteId) async {
    final data = await _db
        .from('reservas')
        .select(
            'fecha_hora, estado, precio_final, servicios(nombre), barberos(nombre)')
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
    await _db
        .from('alianza_clientes')
        .delete()
        .eq('cliente_id', clienteId)
        .eq('alianza_id', alianzaId);
  }
}
