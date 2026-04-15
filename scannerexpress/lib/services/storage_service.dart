import 'dart:io';
import 'dart:typed_data';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

class StorageService {
  static Future<String> savePdf({
    required String docId,
    required Uint8List pdfBytes,
  }) async {
    final dir = await getApplicationDocumentsDirectory();
    final docsDir = Directory(p.join(dir.path, 'documents'));
    if (!docsDir.existsSync()) docsDir.createSync(recursive: true);
    final file = File(p.join(docsDir.path, '$docId.pdf'));
    await file.writeAsBytes(pdfBytes);
    return file.path;
  }

  static Future<void> deletePdf(String localPath) async {
    final file = File(localPath);
    if (file.existsSync()) await file.delete();
  }

  static Future<Uint8List> readPdf(String localPath) async {
    return File(localPath).readAsBytes();
  }
}
