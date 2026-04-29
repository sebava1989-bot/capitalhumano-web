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
    final inicio = DateTime(desde.year, desde.month, desde.day);
    final fin = inicio.add(const Duration(days: 7));
    final data = await _db
        .from('reservas')
        .select('*, barberos(nombre), servicios(nombre, duracion_min)')
        .eq('barberia_id', barberiaId)
        .gte('fecha_hora', inicio.toIso8601String())
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
    final pendientes =
        reservas.where((r) => r['estado'] == 'pendiente').length;
    final ingresos = reservas
        .where((r) => r['estado'] == 'completada')
        .fold<double>(
            0, (s, r) => s + ((r['precio_final'] as num?)?.toDouble() ?? 0));
    return {'total': total, 'pendientes': pendientes, 'ingresos': ingresos};
  }

  Future<void> updateEstado(String reservaId, String estado) async {
    await _db.from('reservas').update({'estado': estado}).eq('id', reservaId);
  }
}
