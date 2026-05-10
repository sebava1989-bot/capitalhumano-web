import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';
import '../models/estilo_corte.dart';
import '../services/estilos_service.dart';

class PruebaEstiloScreen extends StatefulWidget {
  final String barberiaId;
  final String barberiaSlug;
  final VoidCallback? onGestionarEstilos;

  const PruebaEstiloScreen({
    super.key,
    required this.barberiaId,
    required this.barberiaSlug,
    this.onGestionarEstilos,
  });

  @override
  State<PruebaEstiloScreen> createState() => _PruebaEstiloScreenState();
}

class _PruebaEstiloScreenState extends State<PruebaEstiloScreen> {
  final _service = EstilosService();
  final _picker = ImagePicker();

  List<EstiloCorte> _estilos = [];
  Uint8List? _fotoBytes;
  EstiloCorte? _estiloSeleccionado;
  String? _resultadoBase64;
  Uint8List? _resultadoConGrain;
  bool _loadingEstilos = true;
  bool _generando = false;
  bool _analizando = false;
  Map<String, dynamic>? _analisis;

  @override
  void initState() {
    super.initState();
    _cargarEstilos();
  }

  Future<void> _cargarEstilos() async {
    final estilos = await _service.getEstilos(widget.barberiaId);
    if (!mounted) return;
    setState(() {
      _estilos = estilos;
      _loadingEstilos = false;
    });
  }

  Future<void> _tomarFoto(ImageSource source) async {
    final xfile = await _picker.pickImage(
      source: source,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );
    if (xfile == null) return;
    final bytes = await xfile.readAsBytes();
    setState(() {
      _fotoBytes = bytes;
      _resultadoBase64 = null;
      _resultadoConGrain = null;
      _analisis = null;
    });
  }

  Future<void> _analizarRostro() async {
    if (_fotoBytes == null) return;
    setState(() => _analizando = true);
    try {
      final resultado = await _service.analizarRostro(
        slug: widget.barberiaSlug,
        fotoBytes: _fotoBytes!,
      );
      if (!mounted) return;
      setState(() => _analisis = resultado);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al analizar: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _analizando = false);
    }
  }

  Uint8List _aplicarGrain(Uint8List pngBytes, {int intensidad = 18}) {
    final imagen = img.decodeImage(pngBytes);
    if (imagen == null) return pngBytes;
    final rand = Random();
    for (int y = 0; y < imagen.height; y++) {
      for (int x = 0; x < imagen.width; x++) {
        final pixel = imagen.getPixel(x, y);
        final ruido = (rand.nextInt(intensidad * 2 + 1) - intensidad).toDouble();
        final r = (pixel.r + ruido).clamp(0, 255).toInt();
        final g = (pixel.g + ruido).clamp(0, 255).toInt();
        final b = (pixel.b + ruido).clamp(0, 255).toInt();
        imagen.setPixelRgba(x, y, r, g, b, pixel.a.toInt());
      }
    }
    return Uint8List.fromList(img.encodePng(imagen));
  }

  Future<void> _generar() async {
    if (_fotoBytes == null || _estiloSeleccionado == null) return;
    setState(() => _generando = true);
    try {
      final resultado = await _service.generarTransformacion(
        slug: widget.barberiaSlug,
        fotoBytes: _fotoBytes!,
        estilo: _estiloSeleccionado!,
      );
      if (!mounted) return;
      final rawBytes = base64Decode(resultado);
      final conGrain = _aplicarGrain(rawBytes);
      setState(() {
        _resultadoBase64 = resultado;
        _resultadoConGrain = conGrain;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error al generar: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _generando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        title: const Text('Prueba de Estilo'),
        backgroundColor: const Color(0xFF18181B),
        foregroundColor: Colors.white,
        actions: [
          if (widget.onGestionarEstilos != null)
            IconButton(
              icon: const Icon(Icons.tune),
              tooltip: 'Gestionar estilos',
              onPressed: widget.onGestionarEstilos,
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_fotoBytes == null) ...[
              const Text(
                'FOTO DEL CLIENTE',
                style: TextStyle(
                    color: Colors.white38, fontSize: 11, letterSpacing: 1.5),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF27272A),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFACC15).withValues(alpha: 0.3)),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.tips_and_updates_outlined, color: Color(0xFFFACC15), size: 18),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Para mejor resultado: selfie de frente, cabello bien visible, fondo simple y buena luz.',
                        style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(
                  child: _FotoButton(
                    icon: Icons.camera_alt,
                    label: 'Cámara',
                    onTap: () => _tomarFoto(ImageSource.camera),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _FotoButton(
                    icon: Icons.photo_library,
                    label: 'Galería',
                    onTap: () => _tomarFoto(ImageSource.gallery),
                  ),
                ),
              ]),
            ] else ...[
              if (_resultadoBase64 != null) ...[
                const Text(
                  'RESULTADO',
                  style: TextStyle(
                      color: Colors.white38, fontSize: 11, letterSpacing: 1.5),
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.memory(
                    _resultadoConGrain ?? base64Decode(_resultadoBase64!),
                    width: double.infinity,
                    height: 340,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'FOTO ORIGINAL',
                  style: TextStyle(
                      color: Colors.white38, fontSize: 11, letterSpacing: 1.5),
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.memory(
                    _fotoBytes!,
                    width: double.infinity,
                    height: 160,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () => setState(() {
                      _resultadoBase64 = null;
                      _resultadoConGrain = null;
                      _estiloSeleccionado = null;
                      _analisis = null;
                    }),
                    child: const Text(
                      'Probar otro estilo',
                      style: TextStyle(color: Color(0xFFFACC15)),
                    ),
                  ),
                ),
              ] else ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Image.memory(
                    _fotoBytes!,
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => setState(() {
                    _fotoBytes = null;
                    _resultadoBase64 = null;
                    _resultadoConGrain = null;
                    _estiloSeleccionado = null;
                    _analisis = null;
                  }),
                  child: const Text(
                    'Cambiar foto',
                    style:
                        TextStyle(color: Colors.white38, fontSize: 12),
                  ),
                ),
              ],
            ],

            if (_fotoBytes != null && _resultadoBase64 == null) ...[
              const SizedBox(height: 20),
              // Botón analizar tipo de cabeza
              if (_analisis == null) ...[
                if (_analizando)
                  const Center(
                    child: Column(
                      children: [
                        CircularProgressIndicator(color: Color(0xFFFACC15)),
                        SizedBox(height: 8),
                        Text('Analizando tipo de cabeza...',
                            style: TextStyle(color: Colors.white38, fontSize: 12)),
                      ],
                    ),
                  )
                else
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.face_retouching_natural,
                          color: Color(0xFFFACC15), size: 20),
                      label: const Text('Analizar tipo de cabeza',
                          style: TextStyle(
                              color: Color(0xFFFACC15),
                              fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFFFACC15)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _analizarRostro,
                    ),
                  ),
                const SizedBox(height: 20),
              ] else ...[
                _AnalisisCard(analisis: _analisis!),
                const SizedBox(height: 16),
              ],
              const Text(
                'ELIGE EL ESTILO',
                style: TextStyle(
                    color: Colors.white38, fontSize: 11, letterSpacing: 1.5),
              ),
              const SizedBox(height: 10),
              if (_loadingEstilos)
                const Center(
                  child: CircularProgressIndicator(
                      color: Color(0xFFFACC15)),
                )
              else
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _estilos.map((e) {
                    final seleccionado = _estiloSeleccionado?.id == e.id;
                    final recomendados = (_analisis?['estilosRecomendados'] as List?)
                        ?.cast<String>() ?? [];
                    final esRecomendado = recomendados.contains(e.nombre);
                    return GestureDetector(
                      onTap: () =>
                          setState(() => _estiloSeleccionado = e),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: seleccionado
                              ? const Color(0xFFFACC15).withValues(alpha: 0.15)
                              : esRecomendado
                                  ? const Color(0xFF22C55E).withValues(alpha: 0.08)
                                  : const Color(0xFF27272A),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: seleccionado
                                ? const Color(0xFFFACC15)
                                : esRecomendado
                                    ? const Color(0xFF22C55E)
                                    : const Color(0xFF3F3F46),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  e.nombre,
                                  style: TextStyle(
                                    color: seleccionado
                                        ? const Color(0xFFFACC15)
                                        : Colors.white,
                                    fontWeight: seleccionado
                                        ? FontWeight.bold
                                        : FontWeight.normal,
                                    fontSize: 13,
                                  ),
                                ),
                                if (esRecomendado && !seleccionado) ...[
                                  const SizedBox(width: 6),
                                  const Icon(Icons.star,
                                      color: Color(0xFF22C55E), size: 12),
                                ],
                              ],
                            ),
                            if (e.descripcion != null)
                              Text(
                                e.descripcion!,
                                style: const TextStyle(
                                    color: Colors.white38,
                                    fontSize: 11),
                              ),
                            if (esRecomendado)
                              const Text(
                                'Recomendado',
                                style: TextStyle(
                                    color: Color(0xFF22C55E),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold),
                              )
                            else if (!e.esPredefinido)
                              const Text(
                                'Propio',
                                style: TextStyle(
                                    color: Color(0xFFFACC15),
                                    fontSize: 10),
                              ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (_estiloSeleccionado != null && !_generando)
                      ? _generar
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFACC15),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _generando
                      ? const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.black),
                            ),
                            SizedBox(width: 10),
                            Text(
                              'Generando tu look...',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold),
                            ),
                          ],
                        )
                      : const Text(
                          'Generar',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _FotoButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _FotoButton(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 20),
          decoration: BoxDecoration(
            color: const Color(0xFF27272A),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF3F3F46)),
          ),
          child: Column(children: [
            Icon(icon, color: const Color(0xFFFACC15), size: 32),
            const SizedBox(height: 8),
            Text(label,
                style:
                    const TextStyle(color: Colors.white, fontSize: 13)),
          ]),
        ),
      );
}

class _AnalisisCard extends StatelessWidget {
  final Map<String, dynamic> analisis;
  const _AnalisisCard({required this.analisis});

  static const _iconos = {
    'oval': '🥚',
    'redondo': '⭕',
    'cuadrado': '⬛',
    'corazón': '❤️',
    'diamante': '💎',
    'alargado': '📏',
  };

  @override
  Widget build(BuildContext context) {
    final tipo = analisis['tipoRostro'] as String? ?? '';
    final descripcion = analisis['descripcionRostro'] as String? ?? '';
    final razon = analisis['razon'] as String? ?? '';
    final icono = _iconos[tipo.toLowerCase()] ?? '👤';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF052e16),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Text(icono, style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Text(
              'Rostro ${tipo[0].toUpperCase()}${tipo.substring(1)}',
              style: const TextStyle(
                  color: Color(0xFF22C55E),
                  fontWeight: FontWeight.bold,
                  fontSize: 15),
            ),
          ]),
          if (descripcion.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(descripcion,
                style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 12)),
          ],
          if (razon.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(razon,
                style: const TextStyle(color: Colors.white70, fontSize: 12)),
          ],
          const SizedBox(height: 6),
          const Text('Los estilos recomendados están marcados con ★',
              style: TextStyle(color: Color(0xFF22C55E), fontSize: 11)),
        ],
      ),
    );
  }
}

class _ImagenCard extends StatelessWidget {
  final String label;
  final Widget child;
  const _ImagenCard({required this.label, required this.child});

  @override
  Widget build(BuildContext context) => Column(children: [
        Text(
          label,
          style: const TextStyle(
              color: Colors.white38, fontSize: 10, letterSpacing: 1.5),
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(height: 180, child: child),
        ),
      ]);
}
