class EstiloCorte {
  final String id;
  final String? barberiaId;
  final String nombre;
  final String? descripcion;
  final String? fotoReferenciaUrl;
  final String promptIa;
  final bool esPredefinido;
  final int orden;
  final bool activo;

  const EstiloCorte({
    required this.id,
    this.barberiaId,
    required this.nombre,
    this.descripcion,
    this.fotoReferenciaUrl,
    required this.promptIa,
    required this.esPredefinido,
    required this.orden,
    required this.activo,
  });

  factory EstiloCorte.fromJson(Map<String, dynamic> j) => EstiloCorte(
        id: j['id'] as String,
        barberiaId: j['barberia_id'] as String?,
        nombre: j['nombre'] as String,
        descripcion: j['descripcion'] as String?,
        fotoReferenciaUrl: j['foto_referencia_url'] as String?,
        promptIa: j['prompt_ia'] as String,
        esPredefinido: j['es_predefinido'] as bool? ?? false,
        orden: j['orden'] as int? ?? 0,
        activo: j['activo'] as bool? ?? true,
      );

  Map<String, dynamic> toJson() => {
        if (barberiaId != null) 'barberia_id': barberiaId,
        'nombre': nombre,
        if (descripcion != null) 'descripcion': descripcion,
        if (fotoReferenciaUrl != null) 'foto_referencia_url': fotoReferenciaUrl,
        'prompt_ia': promptIa,
        'es_predefinido': esPredefinido,
        'orden': orden,
        'activo': activo,
      };
}
