import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
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
  bool _loadingEstilos = true;
  bool _generando = false;

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
    });
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
      setState(() => _resultadoBase64 = resultado);
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
                Row(children: [
                  Expanded(
                    child: _ImagenCard(
                      label: 'ANTES',
                      child: Image.memory(_fotoBytes!, fit: BoxFit.cover),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _ImagenCard(
                      label: 'DESPUÉS',
                      child: Image.memory(
                        base64Decode(_resultadoBase64!),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ]),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () => setState(() {
                      _resultadoBase64 = null;
                      _estiloSeleccionado = null;
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
                    _estiloSeleccionado = null;
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
                    return GestureDetector(
                      onTap: () =>
                          setState(() => _estiloSeleccionado = e),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: seleccionado
                              ? const Color(0xFFFACC15)
                                  .withValues(alpha: 0.15)
                              : const Color(0xFF27272A),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: seleccionado
                                ? const Color(0xFFFACC15)
                                : const Color(0xFF3F3F46),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
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
                            if (e.descripcion != null)
                              Text(
                                e.descripcion!,
                                style: const TextStyle(
                                    color: Colors.white38,
                                    fontSize: 11),
                              ),
                            if (!e.esPredefinido)
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
