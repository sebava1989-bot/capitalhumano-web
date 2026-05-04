import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/barbero.dart';
import '../services/barberos_service.dart';

class BarberoFormScreen extends StatefulWidget {
  final String barberiaId;
  final Barbero? barbero;
  const BarberoFormScreen({super.key, required this.barberiaId, this.barbero});
  @override
  State<BarberoFormScreen> createState() => _BarberoFormScreenState();
}

class _BarberoFormScreenState extends State<BarberoFormScreen> {
  final _nombre = TextEditingController();
  final _descripcion = TextEditingController();
  bool _activo = true;
  bool _loading = false;
  String? _fotoUrl;
  Uint8List? _fotoBytes;
  final _service = BarberosService();

  @override
  void initState() {
    super.initState();
    if (widget.barbero != null) {
      _nombre.text = widget.barbero!.nombre;
      _descripcion.text = widget.barbero!.descripcion ?? '';
      _activo = widget.barbero!.activo;
      _fotoUrl = widget.barbero!.fotoUrl;
    }
  }

  Future<void> _pickFoto() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, maxWidth: 800, imageQuality: 80);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    setState(() => _fotoBytes = bytes);
  }

  Future<String?> _uploadFoto() async {
    if (_fotoBytes == null) return _fotoUrl;
    final db = Supabase.instance.client;
    final path = '${widget.barberiaId}/${DateTime.now().millisecondsSinceEpoch}.jpg';
    await db.storage.from('barberos').uploadBinary(
      path,
      _fotoBytes!,
      fileOptions: const FileOptions(contentType: 'image/jpeg', upsert: true),
    );
    return db.storage.from('barberos').getPublicUrl(path);
  }

  Future<void> _guardar() async {
    if (_nombre.text.trim().isEmpty) return;
    setState(() => _loading = true);
    try {
      final url = await _uploadFoto();
      if (widget.barbero == null) {
        await _service.crear(
          widget.barberiaId,
          _nombre.text.trim(),
          descripcion: _descripcion.text.trim(),
          fotoUrl: url,
        );
      } else {
        await _service.actualizar(
          widget.barbero!.id,
          _nombre.text.trim(),
          _activo,
          descripcion: _descripcion.text.trim(),
          fotoUrl: url,
        );
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.barbero == null ? 'Nuevo barbero' : 'Editar barbero')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: ListView(children: [
          Center(
            child: GestureDetector(
              onTap: _pickFoto,
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 48,
                    backgroundColor: const Color(0xFF27272A),
                    backgroundImage: _fotoBytes != null
                        ? MemoryImage(_fotoBytes!)
                        : (_fotoUrl != null ? NetworkImage(_fotoUrl!) as ImageProvider : null),
                    child: (_fotoBytes == null && _fotoUrl == null)
                        ? Text(
                            _nombre.text.isNotEmpty ? _nombre.text[0].toUpperCase() : '?',
                            style: const TextStyle(fontSize: 36, color: Colors.white70),
                          )
                        : null,
                  ),
                  Positioned(
                    bottom: 0, right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: Color(0xFFFACC15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.camera_alt, size: 16, color: Colors.black),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _nombre,
            decoration: _inputDeco('Nombre del barbero'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _descripcion,
            maxLines: 3,
            maxLength: 200,
            decoration: _inputDeco('Descripción (opcional)'),
          ),
          if (widget.barbero != null) ...[
            const SizedBox(height: 4),
            SwitchListTile(
              title: const Text('Activo', style: TextStyle(color: Colors.white)),
              value: _activo,
              activeColor: const Color(0xFFFACC15),
              onChanged: (v) => setState(() => _activo = v),
              tileColor: const Color(0xFF27272A),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading ? null : _guardar,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFACC15),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _loading
                  ? const SizedBox(height: 20, width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : Text(widget.barbero == null ? 'Agregar barbero' : 'Guardar',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ]),
      ),
    );
  }

  InputDecoration _inputDeco(String hint) => InputDecoration(
    hintText: hint,
    filled: true,
    fillColor: const Color(0xFF27272A),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFFACC15)),
    ),
    counterStyle: const TextStyle(color: Color(0xFFA1A1AA)),
  );
}
