import 'package:flutter_test/flutter_test.dart';
import 'package:scannerexpress/models/document.dart';
import 'package:scannerexpress/models/folder.dart';
import 'package:scannerexpress/services/database_service.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

void main() {
  setUpAll(() {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  });

  late DatabaseService db;

  setUp(() async {
    db = DatabaseService();
    await db.init(inMemory: true);
  });

  tearDown(() async => db.close());

  test('insert and fetch document', () async {
    final doc = Document(
      id: 'doc1',
      name: 'Factura Enero',
      folderId: null,
      pages: 1,
      pdfLocalPath: '/tmp/doc1.pdf',
      pdfCloudUrl: null,
      ocrText: null,
      createdAt: DateTime(2026, 4, 15),
      updatedAt: DateTime(2026, 4, 15),
    );
    await db.insertDocument(doc);
    final docs = await db.getAllDocuments();
    expect(docs.length, 1);
    expect(docs.first.name, 'Factura Enero');
  });

  test('insert and fetch folder', () async {
    final folder = Folder(id: 'f1', name: 'Trabajo', createdAt: DateTime(2026, 4, 15));
    await db.insertFolder(folder);
    final folders = await db.getAllFolders();
    expect(folders.length, 1);
    expect(folders.first.name, 'Trabajo');
  });

  test('delete document', () async {
    final doc = Document(
      id: 'doc2', name: 'Test', folderId: null, pages: 1,
      pdfLocalPath: '/tmp/d.pdf', pdfCloudUrl: null, ocrText: null,
      createdAt: DateTime(2026, 4, 15), updatedAt: DateTime(2026, 4, 15),
    );
    await db.insertDocument(doc);
    await db.deleteDocument('doc2');
    expect((await db.getAllDocuments()).length, 0);
  });
}
