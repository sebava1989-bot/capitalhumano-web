import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';

class DteScreen extends StatefulWidget {
  const DteScreen({super.key});
  @override
  State<DteScreen> createState() => _DteScreenState();
}

class _DteScreenState extends State<DteScreen> {
  bool _loading = false;
  String? _error;

  Future<void> _pickAndImport() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['xml'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;

    final file = result.files.first;
    final xmlContent = String.fromCharCodes(file.bytes!);

    setState(() { _loading = true; _error = null; });
    try {
      final api = ApiService();
      final data = await api.post('/documents/import-xml', {'xml': xmlContent});
      final documentId = data['id'] as String;
      if (mounted) {
        context.push('/dte/review/$documentId');
      }
    } on ApiException catch (e) {
      if (e.statusCode == 409) {
        setState(() => _error = 'Este documento ya fue importado anteriormente');
      } else {
        setState(() => _error = e.message);
      }
    } catch (_) {
      setState(() => _error = 'Error al procesar el archivo XML');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Importar DTE')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.upload_file_outlined, size: 80, color: Color(0xFF2563EB)),
              const SizedBox(height: 16),
              const Text('Selecciona un archivo XML de factura DTE',
                  textAlign: TextAlign.center, style: TextStyle(fontSize: 16)),
              const SizedBox(height: 8),
              const Text('El sistema detectará automáticamente los productos y sugerirá coincidencias.',
                  textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red[200]!),
                  ),
                  child: Text(_error!, style: const TextStyle(color: Colors.red)),
                ),
              ],
              const SizedBox(height: 24),
              _loading
                  ? const CircularProgressIndicator()
                  : FilledButton.icon(
                      onPressed: _pickAndImport,
                      icon: const Icon(Icons.folder_open_outlined),
                      label: const Text('Seleccionar archivo XML'),
                    ),
            ],
          ),
        ),
      ),
    );
  }
}
