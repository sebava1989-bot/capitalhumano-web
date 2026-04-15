import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../l10n/app_localizations.dart';
import '../main.dart';
import '../models/folder.dart';
import '../widgets/folder_card.dart';
import '../widgets/document_card.dart';
import 'document_detail_screen.dart';

class FoldersScreen extends StatefulWidget {
  const FoldersScreen({super.key});

  @override
  State<FoldersScreen> createState() => _FoldersScreenState();
}

class _FoldersScreenState extends State<FoldersScreen> {
  List<Folder> _folders = [];
  Map<String, int> _docCounts = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final folders = await dbService.getAllFolders();
    final counts = <String, int>{};
    for (final f in folders) {
      final docs = await dbService.getDocumentsByFolder(f.id);
      counts[f.id] = docs.length;
    }
    if (!mounted) return;
    setState(() { _folders = folders; _docCounts = counts; });
  }

  Future<void> _createFolder() async {
    final l10n = AppLocalizations.of(context)!;
    final controller = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(l10n.folders_new),
        content: TextField(controller: controller, autofocus: true, decoration: const InputDecoration(hintText: 'Nombre')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(context, controller.text), child: const Text('Crear')),
        ],
      ),
    );
    if (name != null && name.isNotEmpty) {
      final folder = Folder(id: const Uuid().v4(), name: name, createdAt: DateTime.now());
      await dbService.insertFolder(folder);
      _load();
    }
  }

  Future<void> _deleteFolder(Folder folder) async {
    final l10n = AppLocalizations.of(context)!;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        content: Text(l10n.folders_confirm_delete),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Eliminar')),
        ],
      ),
    );
    if (confirm == true) {
      await dbService.deleteFolder(folder.id);
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.nav_folders)),
      body: _folders.isEmpty
          ? Center(child: Text('Sin carpetas aún', style: TextStyle(color: Colors.grey.shade500)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _folders.length,
              itemBuilder: (ctx, i) {
                final f = _folders[i];
                return Dismissible(
                  key: Key(f.id),
                  direction: DismissDirection.endToStart,
                  background: Container(color: Colors.red, alignment: Alignment.centerRight,
                      padding: const EdgeInsets.only(right: 20),
                      child: const Icon(Icons.delete, color: Colors.white)),
                  onDismissed: (_) => _deleteFolder(f),
                  child: FolderCard(
                    folder: f,
                    docCount: _docCounts[f.id] ?? 0,
                    onTap: () => _openFolder(f),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createFolder,
        child: const Icon(Icons.create_new_folder),
      ),
    );
  }

  Future<void> _openFolder(Folder folder) async {
    final docs = await dbService.getDocumentsByFolder(folder.id);
    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        expand: false,
        builder: (_, ctrl) => Column(children: [
          Padding(padding: const EdgeInsets.all(16),
              child: Text(folder.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
          Expanded(child: docs.isEmpty
              ? const Center(child: Text('Carpeta vacía'))
              : ListView(controller: ctrl, padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: docs.map((d) => DocumentCard(
                    doc: d,
                    onTap: () => Navigator.push(context,
                        MaterialPageRoute(builder: (_) => DocumentDetailScreen(document: d))),
                  )).toList())),
        ]),
      ),
    );
  }
}
