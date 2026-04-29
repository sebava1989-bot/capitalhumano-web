class Reserva {
  final String id;
  final String barberiaId;
  final String? clienteId;
  final String? barberoId;
  final String? servicioId;
  final String clienteNombre;
  final String? clienteEmail;
  final String? clienteTelefono;
  final DateTime fechaHora;
  final String estado;
  final double? precioFinal;
  final String? barberoNombre;
  final String? servicioNombre;
  final int? duracionMin;

  const Reserva({
    required this.id,
    required this.barberiaId,
    this.clienteId,
    this.barberoId,
    this.servicioId,
    required this.clienteNombre,
    this.clienteEmail,
    this.clienteTelefono,
    required this.fechaHora,
    required this.estado,
    this.precioFinal,
    this.barberoNombre,
    this.servicioNombre,
    this.duracionMin,
  });

  factory Reserva.fromJson(Map<String, dynamic> j) => Reserva(
        id: j['id'] as String,
        barberiaId: j['barberia_id'] as String,
        clienteId: j['cliente_id'] as String?,
        barberoId: j['barbero_id'] as String?,
        servicioId: j['servicio_id'] as String?,
        clienteNombre: (j['cliente_nombre'] as String?) ?? 'Sin nombre',
        clienteEmail: j['cliente_email'] as String?,
        clienteTelefono: j['cliente_telefono'] as String?,
        fechaHora: DateTime.parse(j['fecha_hora'] as String).toLocal(),
        estado: j['estado'] as String,
        precioFinal: (j['precio_final'] as num?)?.toDouble(),
        barberoNombre: (j['barberos'] as Map?)?['nombre'] as String?,
        servicioNombre: (j['servicios'] as Map?)?['nombre'] as String?,
        duracionMin: (j['servicios'] as Map?)?['duracion_min'] as int?,
      );
}
