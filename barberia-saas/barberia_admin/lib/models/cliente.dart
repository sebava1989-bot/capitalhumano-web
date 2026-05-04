class Cliente {
  final String id;
  final String nombre;
  final String? email;
  final String? telefono;
  final String? referralCode;
  final int totalVisitas;
  final double gastoTotal;
  final DateTime? ultimaVisita;
  final String segmento;
  final List<String> alianzasAsignadas;

  Cliente({
    required this.id,
    required this.nombre,
    this.email,
    this.telefono,
    this.referralCode,
    required this.totalVisitas,
    required this.gastoTotal,
    this.ultimaVisita,
    required this.segmento,
    required this.alianzasAsignadas,
  });
}
