import 'package:supabase_flutter/supabase_flutter.dart';

class BarberoResumen {
  final String id;
  final String nombre;
  final int citasSemana;
  final double ingresosSemana;
  final int citasMes;
  final double ingresosMes;

  const BarberoResumen({
    required this.id,
    required this.nombre,
    required this.citasSemana,
    required this.ingresosSemana,
    required this.citasMes,
    required this.ingresosMes,
  });

  double get promedioPorCitaMes => citasMes > 0 ? ingresosMes / citasMes : 0;
}

class ResumenService {
  final _db = Supabase.instance.client;

  Future<List<BarberoResumen>> getResumen(String barberiaId) async {
    final now = DateTime.now();
    final lunes = now.subtract(Duration(days: now.weekday - 1));
    final semanaStart = DateTime(lunes.year, lunes.month, lunes.day);
    final semanaEnd = semanaStart.add(const Duration(days: 7));
    final mesStart = DateTime(now.year, now.month, 1);
    final mesEnd = DateTime(now.year, now.month + 1, 1);

    final barberos = await _db
        .from('barberos')
        .select('id, nombre')
        .eq('barberia_id', barberiaId)
        .eq('activo', true)
        .order('nombre');

    final semana = await _db
        .from('reservas')
        .select('barbero_id, precio_final')
        .eq('barberia_id', barberiaId)
        .eq('estado', 'completada')
        .gte('fecha_hora', semanaStart.toIso8601String())
        .lt('fecha_hora', semanaEnd.toIso8601String());

    final mes = await _db
        .from('reservas')
        .select('barbero_id, precio_final')
        .eq('barberia_id', barberiaId)
        .eq('estado', 'completada')
        .gte('fecha_hora', mesStart.toIso8601String())
        .lt('fecha_hora', mesEnd.toIso8601String());

    final semMap = <String, Map<String, dynamic>>{};
    for (final r in semana as List) {
      final id = r['barbero_id'] as String? ?? '';
      semMap.putIfAbsent(id, () => {'citas': 0, 'ingresos': 0.0});
      semMap[id]!['citas'] = (semMap[id]!['citas'] as int) + 1;
      semMap[id]!['ingresos'] =
          (semMap[id]!['ingresos'] as double) + ((r['precio_final'] as num?)?.toDouble() ?? 0);
    }

    final mesMap = <String, Map<String, dynamic>>{};
    for (final r in mes as List) {
      final id = r['barbero_id'] as String? ?? '';
      mesMap.putIfAbsent(id, () => {'citas': 0, 'ingresos': 0.0});
      mesMap[id]!['citas'] = (mesMap[id]!['citas'] as int) + 1;
      mesMap[id]!['ingresos'] =
          (mesMap[id]!['ingresos'] as double) + ((r['precio_final'] as num?)?.toDouble() ?? 0);
    }

    return (barberos as List).map((b) {
      final bid = b['id'] as String;
      return BarberoResumen(
        id: bid,
        nombre: b['nombre'] as String,
        citasSemana: semMap[bid]?['citas'] as int? ?? 0,
        ingresosSemana: semMap[bid]?['ingresos'] as double? ?? 0,
        citasMes: mesMap[bid]?['citas'] as int? ?? 0,
        ingresosMes: mesMap[bid]?['ingresos'] as double? ?? 0,
      );
    }).toList();
  }
}
