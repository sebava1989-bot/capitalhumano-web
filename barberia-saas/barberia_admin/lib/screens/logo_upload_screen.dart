import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/barberias_service.dart';

class LogoUploadScreen extends StatefulWidget {
  final String barberiaId;
  final String? logoUrlActual;
  const LogoUploadScreen({super.key, required this.barberiaId, this.logoUrlActual});
  @override
  State<LogoUploadScreen> createState() => _LogoUploadScreenState();
}

class _LogoUploadScreenState extends State<LogoUploadScreen> {
  final _service = BarberiasService();
  Uint8List? _bytes;
  bool _loading = false;
  String? _logoUrl;

  @override
  void initState() {
    super.initState();
    _logoUrl = widget.logoUrlActual;
  }

  Future<void> _pickAndUpload() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, maxWidth: 400, imageQuality: 90);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    setState(() { _bytes = bytes; _loading = true; });
    try {
      final url = await _service.uploadLogo(widget.barberiaId, bytes);
      await _service.updateLogoUrl(widget.barberiaId, url);
      setState(() { _logoUrl = url; _loading = false; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Logo actualizado'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Logo de la barbería')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  color: const Color(0xFF27272A),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: _bytes != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.memory(_bytes!, fit: BoxFit.contain))
                    : (_logoUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.network(_logoUrl!, fit: BoxFit.contain))
                        : const Icon(Icons.store, size: 64, color: Color(0xFFA1A1AA))),
              ),
              const SizedBox(height: 24),
              if (_loading)
                const CircularProgressIndicator(color: Color(0xFFFACC15))
              else
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _pickAndUpload,
                    icon: const Icon(Icons.upload),
                    label: const Text('Cambiar logo', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFACC15),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
