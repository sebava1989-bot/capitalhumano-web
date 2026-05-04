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

  /// Marca la reserva como completada y aplica descuento de referido si corresponde.
  Future<CompletarReservaResult> completarReserva(
      String reservaId, String? codigoReferido) async {
    // 1. Cargar reserva
    final reservaData = await _db
        .from('reservas')
        .select('id, precio, cliente_id, barberia_id, estado, descuento, precio_final')
        .eq('id', reservaId)
        .maybeSingle();
    if (reservaData == null) {
      return const CompletarReservaResult(ok: false, errorCodigo: 'Reserva no encontrada');
    }
    final precio = (reservaData['precio'] as num).toDouble();
    final clienteId = reservaData['cliente_id'] as String;
    final barberiaId = reservaData['barberia_id'] as String;
    final descuentoActual = (reservaData['descuento'] as num?)?.toDouble() ?? 0;
    final precioFinalActual = (reservaData['precio_final'] as num).toDouble();

    String? errorCodigo;
    bool descuentoAplicado = false;
    int? descuentoPct;

    if (codigoReferido != null && codigoReferido.trim().isNotEmpty) {
      // 2. Obtener config de campaña
      final barberiaData = await _db
          .from('barberias')
          .select(
            'referido_activo, referido_descuento_referido_pct, referidor_premio_pct',
          )
          .eq('id', barberiaId)
          .maybeSingle();

      final activo = barberiaData?['referido_activo'] as bool? ?? true;

      if (activo) {
        // 3. Validar que el código existe y no es el propio cliente
        final referidorData = await _db
            .from('users')
            .select('id')
            .eq('referral_code', codigoReferido.trim())
            .neq('id', clienteId)
            .maybeSingle();

        if (referidorData == null) {
          errorCodigo = 'Código de referido inválido';
        } else {
          final referidorId = referidorData['id'] as String;

          // 4. Verificar que es la primera reserva completada del cliente
          final completadasData = await _db
              .from('reservas')
              .select('id')
              .eq('cliente_id', clienteId)
              .eq('estado', 'completada');
          final completadasPrevias = (completadasData as List).length;

          if (completadasPrevias > 0) {
            errorCodigo = 'El cliente ya tiene cortes previos completados';
          } else {
            final dctoReferidoPct =
                barberiaData?['referido_descuento_referido_pct'] as int? ?? 10;
            final premioPct =
                barberiaData?['referidor_premio_pct'] as int? ?? 10;

            // 5. Aplicar descuento retroactivo
            final montoDescuento = (precio * dctoReferidoPct / 100).round();
            await _db.from('reservas').update({
              'descuento': descuentoActual + montoDescuento,
              'precio_final': precioFinalActual - montoDescuento,
            }).eq('id', reservaId);

            // 6. Generar premio para el referidor
            await _db.from('referido_premios').insert({
              'barberia_id': barberiaId,
              'referidor_id': referidorId,
              'referido_id': clienteId,
              'descuento_pct': premioPct,
            });

            descuentoAplicado = true;
            descuentoPct = dctoReferidoPct;
          }
        }
      }
    }

    // 7. Marcar como completada
    await _db.from('reservas').update({'estado': 'completada'}).eq('id', reservaId);

    return CompletarReservaResult(
      ok: true,
      errorCodigo: errorCodigo,
      descuentoAplicado: descuentoAplicado,
      descuentoPct: descuentoPct,
    );
  }
}
