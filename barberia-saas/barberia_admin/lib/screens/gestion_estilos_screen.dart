import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/estilo_corte.dart';
import '../services/estilos_service.dart';

class GestionEstilosScreen extends StatefulWidget {
  final String barberiaId;
  const GestionEstilosScreen({super.key, required this.barberiaId});

  @override
  State<GestionEstilosScreen> createState() => _GestionEstilosScreenState();
}

class _GestionEstilosScreenState extends State<GestionEstilosScreen> {
  final _service = EstilosService();
  final _picker = ImagePicker();
  List<EstiloCorte> _predefinidos = [];
  List<EstiloCorte> _propios = [];
  bool _loading = true;
  String? _subiendoId;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    final todos = await _service.getEstilos(widget.barberiaId);
    if (!mounted) return;
    setState(() {
      _predefinidos = todos.where((e) => e.esPredefinido).toList();
      _propios = todos.where((e) => !e.esPredefinido).toList();
      _loading = false;
    });
  }

  Future<void> _subirFoto(EstiloCorte estilo) async {
    final xfile = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      maxHeight: 800,
      imageQuality: 85,
    );
    if (xfile == null || !mounted) return;

    setState(() => _subiendoId = estilo.id);
    try {
      final bytes = await xfile.readAsBytes();
      await _service.subirFotoReferencia(estiloId: estilo.id, imageBytes: bytes);
      if (!mounted) return;
      await _cargar();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al subir: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _subiendoId = null);
    }
  }

  void _mostrarAgregarEstilo() {
    final nombreCtrl = TextEditingController();
    final descCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF18181B),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            20, 16, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
                color: Colors.white24, borderRadius: BorderRadius.circular(2)),
          ),
          const SizedBox(height: 16),
          const Text('Agregar estilo propio',
              style: TextStyle(
                  color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          TextField(
            controller: nombreCtrl,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              hintText: 'Nombre del estilo (ej. Degradé con líneas)',
              hintStyle: TextStyle(color: Colors.white38),
              filled: true,
              fillColor: Color(0xFF27272A),
              border: OutlineInputBorder(borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: descCtrl,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              hintText: 'Descripción breve (opcional)',
              hintStyle: TextStyle(color: Colors.white38),
              filled: true,
              fillColor: Color(0xFF27272A),
              border: OutlineInputBorder(borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                if (nombreCtrl.text.trim().isEmpty) return;
                Navigator.pop(ctx);
                await _service.agregarEstilo(
                  barberiaId: widget.barberiaId,
                  nombre: nombreCtrl.text.trim(),
                  descripcion:
                      descCtrl.text.trim().isEmpty ? null : descCtrl.text.trim(),
                );
                _cargar();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFACC15),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Agregar',
                  style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ]),
      ),
    );
  }

  Future<void> _eliminar(EstiloCorte estilo) async {
    await _service.eliminarEstilo(estilo.id);
    _cargar();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        title: const Text('Gestión de Estilos'),
        backgroundColor: const Color(0xFF18181B),
        foregroundColor: Colors.white,
        actions: [
          TextButton.icon(
            onPressed: _mostrarAgregarEstilo,
            icon: const Icon(Icons.add, color: Color(0xFFFACC15)),
            label: const Text('Agregar',
                style: TextStyle(color: Color(0xFFFACC15))),
          ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFFACC15)))
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const Text('ESTILOS BASE (predefinidos)',
                    style: TextStyle(
                        color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                ..._predefinidos.map((e) => _EstiloTile(
                      estilo: e,
                      subiendoFoto: _subiendoId == e.id,
                      onDelete: null,
                      onFoto: () => _subirFoto(e),
                    )),
                const SizedBox(height: 24),
                const Text('MIS ESTILOS',
                    style: TextStyle(
                        color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                if (_propios.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text('No tienes estilos propios aún.',
                        style: TextStyle(color: Colors.white38, fontSize: 13)),
                  )
                else
                  ..._propios.map((e) => _EstiloTile(
                        estilo: e,
                        subiendoFoto: _subiendoId == e.id,
                        onDelete: () => _eliminar(e),
                        onFoto: () => _subirFoto(e),
                      )),
              ],
            ),
    );
  }
}

class _EstiloTile extends StatelessWidget {
  final EstiloCorte estilo;
  final bool subiendoFoto;
  final VoidCallback? onDelete;
  final VoidCallback onFoto;

  const _EstiloTile({
    required this.estilo,
    required this.subiendoFoto,
    required this.onDelete,
    required this.onFoto,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: estilo.fotoReferenciaUrl != null ? () => _verFoto(context) : null,
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFF27272A),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(children: [
            // Miniatura
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: estilo.fotoReferenciaUrl != null
                      ? Image.network(
                          estilo.fotoReferenciaUrl!,
                          width: 64,
                          height: 64,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _placeholder(),
                        )
                      : _placeholder(),
                ),
                // Botón de cámara encima
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: GestureDetector(
                    onTap: subiendoFoto ? null : onFoto,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFACC15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: subiendoFoto
                          ? const SizedBox(
                              width: 12,
                              height: 12,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.black),
                            )
                          : const Icon(Icons.camera_alt,
                              color: Colors.black, size: 12),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            // Nombre + descripción
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(estilo.nombre,
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w600)),
                  if (estilo.descripcion != null)
                    Text(estilo.descripcion!,
                        style:
                            const TextStyle(color: Colors.white38, fontSize: 12)),
                  if (estilo.fotoReferenciaUrl == null)
                    const Text('Toca 📷 para agregar foto',
                        style:
                            TextStyle(color: Color(0xFFFACC15), fontSize: 11)),
                ],
              ),
            ),
            if (onDelete != null)
              IconButton(
                icon:
                    const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                onPressed: onDelete,
              )
            else
              const Icon(Icons.lock_outline, color: Colors.white24, size: 16),
          ]),
        ),
      );

  Widget _placeholder() => Container(
        width: 64,
        height: 64,
        color: const Color(0xFF3F3F46),
        child: const Icon(Icons.content_cut, color: Color(0xFF71717A), size: 24),
      );

  void _verFoto(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Image.network(
            estilo.fotoReferenciaUrl!,
            fit: BoxFit.contain,
          ),
        ),
      ),
    );
  }
}
