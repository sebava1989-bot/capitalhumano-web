import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pdfx/pdfx.dart';
import 'package:share_plus/share_plus.dart';
import '../l10n/app_localizations.dart';
import '../main.dart';
import '../models/document.dart';
import '../models/folder.dart';
import '../services/storage_service.dart';

class DocumentDetailScreen extends StatefulWidget {
  final Document document;
  const DocumentDetailScreen({super.key, required this.document});

  @override
  State<DocumentDetailScreen> createState() => _DocumentDetailScreenState();
}

class _DocumentDetailScreenState extends State<DocumentDetailScreen>
    with SingleTickerProviderStateMixin {
  late Document _doc;
  late TabController _tabController;
  late PdfControllerPinch _pdfController;

  @override
  void initState() {
    super.initState();
    _doc = widget.document;
    _tabController = TabController(length: 2, vsync: this);
    _pdfController = PdfControllerPinch(
      document: PdfDocument.openFile(_doc.pdfLocalPath),
    );
  }

  @override
  void dispose() {
    _pdfController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _rename() async {
    final l10n = AppLocalizations.of(context)!;
    final controller = TextEditingController(text: _doc.name);
    final result = await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(l10n.doc_rename),
        content: TextField(controller: controller, autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(context, controller.text), child: const Text('Guardar')),
        ],
      ),
    );
    if (result != null && result.isNotEmpty) {
      final updated = _doc.copyWith(name: result, updatedAt: DateTime.now());
      await dbService.updateDocument(updated);
      setState(() => _doc = updated);
    }
  }

  Future<void> _share() async {
    await ShareXFiles([XFile(_doc.pdfLocalPath)], subject: _doc.name).share();
  }

  Future<void> _delete() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        content: const Text('¿Eliminar este documento?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Eliminar')),
        ],
      ),
    );
    if (confirm == true) {
      await dbService.deleteDocument(_doc.id);
      await StorageService.deletePdf(_doc.pdfLocalPath);
      if (mounted) Navigator.pop(context);
    }
  }

  Future<void> _moveToFolder() async {
    final folders = await dbService.getAllFolders();
    if (!mounted) return;
    final folder = await showDialog<Folder>(
      context: context,
      builder: (_) => SimpleDialog(
        title: const Text('Mover a carpeta'),
        children: [
          ...folders.map((f) => SimpleDialogOption(
            child: Text(f.name),
            onPressed: () => Navigator.pop(context, f),
          )),
        ],
      ),
    );
    if (folder != null) {
      final updated = _doc.copyWith(folderId: folder.id, updatedAt: DateTime.now());
      await dbService.updateDocument(updated);
      setState(() => _doc = updated);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: GestureDetector(
          onTap: _rename,
          child: Text(_doc.name, overflow: TextOverflow.ellipsis),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.share), onPressed: _share, tooltip: l10n.doc_share),
          IconButton(icon: const Icon(Icons.folder_open), onPressed: _moveToFolder, tooltip: l10n.doc_move),
          IconButton(icon: const Icon(Icons.delete_outline), onPressed: _delete, tooltip: l10n.doc_delete),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: [const Tab(icon: Icon(Icons.picture_as_pdf)), Tab(text: l10n.doc_ocr_tab)],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          PdfViewPinch(controller: _pdfController),
          _OcrTab(ocrText: _doc.ocrText, l10n: l10n),
        ],
      ),
    );
  }
}

class _OcrTab extends StatelessWidget {
  final String? ocrText;
  final AppLocalizations l10n;
  const _OcrTab({required this.ocrText, required this.l10n});

  @override
  Widget build(BuildContext context) {
    if (ocrText == null || ocrText!.isEmpty) {
      return Center(child: Text(l10n.doc_ocr_empty, style: TextStyle(color: Colors.grey.shade500)));
    }
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ElevatedButton.icon(
            onPressed: () => Clipboard.setData(ClipboardData(text: ocrText!)),
            icon: const Icon(Icons.copy),
            label: const Text('Copiar texto'),
          ),
          const SizedBox(height: 12),
          Expanded(child: SingleChildScrollView(child: SelectableText(ocrText!))),
        ],
      ),
    );
  }
}
