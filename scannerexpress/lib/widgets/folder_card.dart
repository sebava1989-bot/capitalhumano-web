import 'package:flutter/material.dart';
import '../models/folder.dart';

class FolderCard extends StatelessWidget {
  final Folder folder;
  final int docCount;
  final VoidCallback onTap;

  const FolderCard({super.key, required this.folder, required this.docCount, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.folder, color: Color(0xFF0071e3)),
        title: Text(folder.name),
        subtitle: Text('$docCount docs'),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
