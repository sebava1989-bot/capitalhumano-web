class Barbero {
  final String id;
  final String nombre;
  final bool activo;
  final String? descripcion;
  final String? fotoUrl;

  const Barbero({
    required this.id,
    required this.nombre,
    required this.activo,
    this.descripcion,
    this.fotoUrl,
  });

  factory Barbero.fromJson(Map<String, dynamic> j) => Barbero(
    id: j['id'] as String,
    nombre: j['nombre'] as String,
    activo: j['activo'] as bool? ?? true,
    descripcion: j['descripcion'] as String?,
    fotoUrl: j['foto_url'] as String?,
  );
}
