import 'package:supabase_flutter/supabase_flutter.dart';

class CampanaReferidosConfig {
  final bool activo;
  final int descuentoReferidoPct;
  final int premioReferidorPct;
  final bool acumulable;
  final int maxPctPorServicio;

  const CampanaReferidosConfig({
    required this.activo,
    required this.descuentoReferidoPct,
    required this.premioReferidorPct,
    required this.acumulable,
    required this.maxPctPorServicio,
  });

  factory CampanaReferidosConfig.fromJson(Map<String, dynamic> j) =>
      CampanaReferidosConfig(
        activo: j['referido_activo'] as bool? ?? true,
        descuentoReferidoPct: j['referido_descuento_referido_pct'] as int? ?? 10,
        premioReferidorPct: j['referidor_premio_pct'] as int? ?? 10,
        acumulable: j['referido_acumulable'] as bool? ?? true,
        maxPctPorServicio: j['referido_max_pct_por_servicio'] as int? ?? 50,
      );
}

class CampanaReferidosService {
  final _db = Supabase.instance.client;

  Future<CampanaReferidosConfig?> getConfig(String barberiaId) async {
    final data = await _db
        .from('barberias')
        .select(
          'referido_activo, referido_descuento_referido_pct, '
          'referidor_premio_pct, referido_acumulable, referido_max_pct_por_servicio',
        )
        .eq('id', barberiaId)
        .maybeSingle();
    if (data == null) return null;
    return CampanaReferidosConfig.fromJson(data as Map<String, dynamic>);
  }

  Future<void> guardarConfig(String barberiaId, CampanaReferidosConfig c) async {
    await _db.from('barberias').update({
      'referido_activo': c.activo,
      'referido_descuento_referido_pct': c.descuentoReferidoPct,
      'referidor_premio_pct': c.premioReferidorPct,
      'referido_acumulable': c.acumulable,
      'referido_max_pct_por_servicio': c.maxPctPorServicio,
    }).eq('id', barberiaId);
  }
}
