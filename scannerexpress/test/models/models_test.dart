import 'package:flutter_test/flutter_test.dart';
import 'package:scannerexpress/models/document.dart';
import 'package:scannerexpress/models/folder.dart';
import 'package:scannerexpress/models/user_state.dart';

void main() {
  group('Document', () {
    test('toMap/fromMap round-trip', () {
      final doc = Document(
        id: 'abc',
        name: 'Test Doc',
        folderId: null,
        pages: 2,
        pdfLocalPath: '/data/test.pdf',
        pdfCloudUrl: null,
        ocrText: 'hello world',
        createdAt: DateTime(2026, 4, 15),
        updatedAt: DateTime(2026, 4, 15),
      );
      final map = doc.toMap();
      final restored = Document.fromMap(map);
      expect(restored.id, doc.id);
      expect(restored.name, doc.name);
      expect(restored.pages, doc.pages);
      expect(restored.ocrText, doc.ocrText);
    });
  });

  group('Folder', () {
    test('toMap/fromMap round-trip', () {
      final folder = Folder(id: 'f1', name: 'Facturas', createdAt: DateTime(2026, 4, 15));
      final restored = Folder.fromMap(folder.toMap());
      expect(restored.id, folder.id);
      expect(restored.name, folder.name);
    });
  });

  group('UserState', () {
    test('isPremium defaults to false', () {
      final state = UserState(
        installDate: DateTime(2026, 4, 15),
        isPremium: false,
        purchaseToken: null,
        firebaseUid: 'uid123',
      );
      expect(state.isPremium, false);
    });
  });
}
