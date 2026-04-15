import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n/app_localizations.dart';
import '../main.dart';
import '../models/document.dart';
import '../services/firebase_service.dart';
import '../services/ocr_service.dart';
import '../services/pdf_service.dart';
import '../services/scanner_service.dart';
import '../services/storage_service.dart';
import 'document_detail_screen.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  bool _processing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _scan());
  }

  Future<void> _scan() async {
    setState(() => _processing = true);
    final l10n = AppLocalizations.of(context)!;
    try {
      final prefs = await SharedPreferences.getInstance();
      final highQuality = prefs.getBool('high_quality') ?? false;
      final result = await ScannerService.scan(highQuality: highQuality);
      if (result == null) {
        if (mounted) Navigator.pop(context);
        return;
      }

      final pdfBytes = await PdfService.generatePdf(imageBytesList: result.imageBytesList);
      final docId = const Uuid().v4();
      final localPath = await StorageService.savePdf(docId: docId, pdfBytes: pdfBytes);

      String ocrText = '';
      if (result.imagePaths.isNotEmpty) {
        ocrText = await OcrService.extractText(result.imagePaths.first);
      }

      final now = DateTime.now();
      final dateStr = '${now.year}-${now.month.toString().padLeft(2,'0')}-${now.day.toString().padLeft(2,'0')}';
      String smartName = 'Documento_$dateStr';
      if (ocrText.isNotEmpty) {
        final firstLine = ocrText.split('\n').firstWhere((l) => l.trim().isNotEmpty, orElse: () => '');
        if (firstLine.isNotEmpty) {
          final cleaned = firstLine.trim().replaceAll(RegExp(r'[<>:"/\\|?*]'), '');
          smartName = '${cleaned.substring(0, cleaned.length.clamp(0, 40))}_$dateStr';
        }
      }

      final doc = Document(
        id: docId,
        name: smartName,
        folderId: null,
        pages: result.imageBytesList.length,
        pdfLocalPath: localPath,
        pdfCloudUrl: null,
        ocrText: ocrText.isEmpty ? null : ocrText,
        createdAt: now,
        updatedAt: now,
      );

      await dbService.insertDocument(doc);

      final syncOn = prefs.getBool('cloud_sync') ?? true;
      if (syncOn) {
        final connectivity = await Connectivity().checkConnectivity();
        if (connectivity.contains(ConnectivityResult.wifi)) {
          FirebaseService.uploadDocument(doc, pdfBytes);
        }
      }

      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => DocumentDetailScreen(document: doc)),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.error_scanner)),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: _processing
            ? const Column(mainAxisSize: MainAxisSize.min, children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Procesando...'),
              ])
            : const SizedBox.shrink(),
      ),
    );
  }
}
