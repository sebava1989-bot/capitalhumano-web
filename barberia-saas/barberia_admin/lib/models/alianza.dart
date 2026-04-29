class Alianza {
  final String id;
  final String nombre;
  final int? descuentoPct;
  final bool activo;
  final String? codigoAcceso;
  final int? maxUsosPorCliente;

  const Alianza({
    required this.id,
    required this.nombre,
    this.descuentoPct,
    required this.activo,
    this.codigoAcceso,
    this.maxUsosPorCliente,
  });

  factory Alianza.fromJson(Map<String, dynamic> j) => Alianza(
        id: j['id'] as String,
        nombre: j['nombre'] as String,
        descuentoPct: j['descuento_pct'] as int?,
        activo: j['activo'] as bool? ?? true,
        codigoAcceso: j['codigo_acceso'] as String?,
        maxUsosPorCliente: j['max_usos_por_cliente'] as int?,
      );

  Map<String, dynamic> toInsert(String barberiaId) => {
        'barberia_id': barberiaId,
        'nombre': nombre,
        if (descuentoPct != null) 'descuento_pct': descuentoPct,
        'activo': activo,
        if (codigoAcceso != null && codigoAcceso!.isNotEmpty)
          'codigo_acceso': codigoAcceso,
        if (maxUsosPorCliente != null) 'max_usos_por_cliente': maxUsosPorCliente,
      };
}
