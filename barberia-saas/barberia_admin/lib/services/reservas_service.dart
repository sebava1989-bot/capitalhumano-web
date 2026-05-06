import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/reserva.dart';

class CompletarReservaResult {
  final bool ok;
  final String? errorCodigo;
  final bool descuentoAplicado;
  final int? descuentoPct;

  const CompletarReservaResult({
    required this.ok,
    this.errorCodigo,
    this.descuentoAplicado = false,
    this.descuentoPct,
  });
}

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

  Future<List<Map<String, String>>> getBarberos(String barberiaId) async {
    final data = await _db
        .from('barberos')
        .select('id, nombre')
        .eq('barberia_id', barberiaId)
        .eq('activo', true)
        .order('nombre');
    return (data as List)
        .map((e) => {'id': e['id'] as String, 'nombre': e['nombre'] as String})
        .toList();
  }

  Future<void> reasignarBarbero(String reservaId, String nuevoBarberoId) async {
    await _db.from('reservas').update({'barbero_id': nuevoBarberoId}).eq('id', reservaId);
  }

  /// Marca la reserva como completada. Si tenía ref_code al momento de reservar,
  /// crea el premio pendiente para el referidor (se confirma cuando el cliente valora).
  Future<CompletarReservaResult> completarReserva(String reservaId) async {
    // 1. Cargar reserva con ref_code que se guardó al momento de reservar online
    final reservaData = await _db
        .from('reservas')
        .select('id, cliente_id, barberia_id, ref_code')
        .eq('id', reservaId)
        .maybeSingle();
    if (reservaData == null) {
      return const CompletarReservaResult(ok: false, errorCodigo: 'Reserva no encontrada');
    }
    final clienteId = reservaData['cliente_id'] as String?;
    final barberiaId = reservaData['barberia_id'] as String;
    final refCode = reservaData['ref_code'] as String?;

    // 2. Marcar como completada
    await _db.from('reservas').update({'estado': 'completada'}).eq('id', reservaId);

    // 3. Si vino por referido y es la primera cita completada → crear premio para el referidor
    if (refCode != null && refCode.isNotEmpty && clienteId != null) {
      final completadasData = await _db
          .from('reservas')
          .select('id')
          .eq('cliente_id', clienteId)
          .eq('barberia_id', barberiaId)
          .eq('estado', 'completada');
      final totalCompletadas = (completadasData as List).length;

      if (totalCompletadas == 1) {
        // SECURITY DEFINER fn necesaria: RLS de users solo permite ver
        // al propio usuario o usuarios de la misma barbería. Los clientes
        // referidores tienen barberia_id=null y no serían visibles de otro modo.
        final referidorId = await _db.rpc(
          'get_user_id_by_referral_code',
          params: {'p_ref_code': refCode, 'p_exclude_id': clienteId},
        ) as String?;

        if (referidorId != null) {
          final referidorData = {'id': referidorId};
          final barberiaData = await _db
              .from('barberias')
              .select('referidor_premio_pct')
              .eq('id', barberiaId)
              .maybeSingle();
          final premioPct = barberiaData?['referidor_premio_pct'] as int? ?? 10;

          await _db.from('referido_premios').insert({
            'barberia_id': barberiaId,
            'referidor_id': referidorId,
            'referido_id': clienteId,
            'descuento_pct': premioPct,
            'canjeado': false,
            'confirmado': true,
          });

          // Notificar al referidor que ganó su premio
          await _db.functions.invoke('send-push', body: {
            'userId': referidorData['id'],
            'title': '🎁 ¡Ganaste un descuento!',
            'body': 'Tu referido completó su primera cita. Tienes un $premioPct% de descuento disponible.',
          });
        }
      }
    }

    return const CompletarReservaResult(ok: true);
  }
}
