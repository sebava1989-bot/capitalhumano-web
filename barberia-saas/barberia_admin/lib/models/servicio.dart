class Servicio {
  final String id;
  final String nombre;
  final int duracionMin;
  final double precio;
  final bool activo;

  const Servicio({
    required this.id,
    required this.nombre,
    required this.duracionMin,
    required this.precio,
    required this.activo,
  });

  factory Servicio.fromJson(Map<String, dynamic> j) => Servicio(
        id: j['id'] as String,
        nombre: j['nombre'] as String,
        duracionMin: j['duracion_min'] as int? ?? 30,
        precio: (j['precio'] as num?)?.toDouble() ?? 0.0,
        activo: j['activo'] as bool? ?? true,
      );
}
