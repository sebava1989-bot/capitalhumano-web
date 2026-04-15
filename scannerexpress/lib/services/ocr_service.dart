import 'dart:io';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

class OcrService {
  static final _recognizer = TextRecognizer(script: TextRecognitionScript.latin);

  static Future<String> extractText(String imagePath) async {
    final inputImage = InputImage.fromFile(File(imagePath));
    try {
      final result = await _recognizer.processImage(inputImage);
      return result.text.trim();
    } catch (_) {
      return '';
    }
  }

  static void dispose() => _recognizer.close();
}
