import 'dart:io';
import 'dart:typed_data';
import 'package:google_mlkit_document_scanner/google_mlkit_document_scanner.dart';

class ScannerResult {
  final List<Uint8List> imageBytesList;
  final List<String> imagePaths;

  ScannerResult({required this.imageBytesList, required this.imagePaths});
}

class ScannerService {
  static Future<ScannerResult?> scan({bool highQuality = false}) async {
    final options = DocumentScannerOptions(
      mode: ScannerMode.full,
      isGalleryImport: true,
      pageLimit: 20,
      documentFormat: DocumentFormat.jpeg,
    );

    final scanner = DocumentScanner(options: options);
    final result = await scanner.scanDocument();

    final imagePaths = result.images;
    if (imagePaths.isEmpty) return null;

    final imageBytesList = await Future.wait(
      imagePaths.map((path) => File(path).readAsBytes()),
    );

    await scanner.close();

    return ScannerResult(
      imageBytesList: imageBytesList.cast<Uint8List>(),
      imagePaths: imagePaths,
    );
  }
}
