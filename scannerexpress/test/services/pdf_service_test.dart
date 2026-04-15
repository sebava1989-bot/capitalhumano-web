import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:scannerexpress/services/pdf_service.dart';

void main() {
  test('generatePdf returns non-empty bytes', () async {
    // Valid 1x1 white PNG image in base64
    final pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    final fakeImageBytes = base64Decode(pngBase64);

    final pdfBytes = await PdfService.generatePdf(imageBytesList: [fakeImageBytes]);
    expect(pdfBytes.isNotEmpty, true);
    // PDF empieza con %PDF
    expect(pdfBytes[0], 0x25); // %
    expect(pdfBytes[1], 0x50); // P
    expect(pdfBytes[2], 0x44); // D
    expect(pdfBytes[3], 0x46); // F
  });
}
