class Barbero {
  final String id;
  final String nombre;
  final bool activo;

  const Barbero({required this.id, required this.nombre, required this.activo});

  factory Barbero.fromJson(Map<String, dynamic> j) => Barbero(
        id: j['id'] as String,
        nombre: j['nombre'] as String,
        activo: j['activo'] as bool? ?? true,
      );
}
