import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/document.dart';

class DocumentCard extends StatelessWidget {
  final Document doc;
  final VoidCallback onTap;

  const DocumentCard({super.key, required this.doc, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('dd/MM/yyyy').format(doc.createdAt);
    return Card(
      child: ListTile(
        leading: const Icon(Icons.picture_as_pdf, color: Color(0xFF0071e3)),
        title: Text(doc.name, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text('$dateStr · ${doc.pages} p.'),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
