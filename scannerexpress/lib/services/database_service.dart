import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';
import '../models/document.dart';
import '../models/folder.dart';

class DatabaseService {
  Database? _db;

  Future<void> init({bool inMemory = false}) async {
    final path = inMemory
        ? inMemoryDatabasePath
        : p.join((await getApplicationDocumentsDirectory()).path, 'scannerexpress.db');
    _db = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE documents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            folder_id TEXT,
            pages INTEGER NOT NULL,
            pdf_local_path TEXT NOT NULL,
            pdf_cloud_url TEXT,
            ocr_text TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at INTEGER NOT NULL
          )
        ''');
      },
    );
  }

  void close() => _db?.close();

  Future<void> insertDocument(Document doc) async =>
      _db!.insert('documents', doc.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);

  Future<void> updateDocument(Document doc) async =>
      _db!.update('documents', doc.toMap(), where: 'id = ?', whereArgs: [doc.id]);

  Future<void> deleteDocument(String id) async =>
      _db!.delete('documents', where: 'id = ?', whereArgs: [id]);

  Future<List<Document>> getAllDocuments() async {
    final rows = await _db!.query('documents', orderBy: 'created_at DESC');
    return rows.map(Document.fromMap).toList();
  }

  Future<List<Document>> getRecentDocuments({int limit = 5}) async {
    final rows = await _db!.query('documents', orderBy: 'created_at DESC', limit: limit);
    return rows.map(Document.fromMap).toList();
  }

  Future<List<Document>> getDocumentsByFolder(String folderId) async {
    final rows = await _db!.query('documents',
        where: 'folder_id = ?', whereArgs: [folderId], orderBy: 'created_at DESC');
    return rows.map(Document.fromMap).toList();
  }

  Future<void> insertFolder(Folder folder) async =>
      _db!.insert('folders', folder.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);

  Future<void> updateFolder(Folder folder) async =>
      _db!.update('folders', folder.toMap(), where: 'id = ?', whereArgs: [folder.id]);

  Future<void> deleteFolder(String id) async =>
      _db!.delete('folders', where: 'id = ?', whereArgs: [id]);

  Future<List<Folder>> getAllFolders() async {
    final rows = await _db!.query('folders', orderBy: 'created_at ASC');
    return rows.map(Folder.fromMap).toList();
  }
}
