import 'dart:typed_data';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../models/document.dart';
import '../models/folder.dart';
import '../models/user_state.dart';

class FirebaseService {
  static final _auth = FirebaseAuth.instance;
  static final _firestore = FirebaseFirestore.instance;
  static final _storage = FirebaseStorage.instance;

  static String? get uid => _auth.currentUser?.uid;

  static Future<String> ensureAnonymousAuth() async {
    if (_auth.currentUser == null) {
      await _auth.signInAnonymously();
    }
    return _auth.currentUser!.uid;
  }

  static Future<void> saveUserState(UserState state) async {
    await _firestore.collection('users').doc(state.firebaseUid).set({
      'install_date': state.installDate.millisecondsSinceEpoch,
      'is_premium': state.isPremium,
      'purchase_token': state.purchaseToken,
    }, SetOptions(merge: true));
  }

  static Future<void> uploadDocument(Document doc, Uint8List pdfBytes) async {
    final uid_ = uid;
    if (uid_ == null) return;
    final ref = _storage.ref('$uid_/documents/${doc.id}.pdf');
    await ref.putData(pdfBytes);
    final url = await ref.getDownloadURL();
    await _firestore
        .collection('users')
        .doc(uid_)
        .collection('documents')
        .doc(doc.id)
        .set({...doc.toMap(), 'pdf_cloud_url': url});
  }

  static Future<void> deleteDocument(String docId) async {
    final uid_ = uid;
    if (uid_ == null) return;
    await _storage.ref('$uid_/documents/$docId.pdf').delete().catchError((_) {});
    await _firestore
        .collection('users')
        .doc(uid_)
        .collection('documents')
        .doc(docId)
        .delete();
  }

  static Future<void> upsertFolder(Folder folder) async {
    final uid_ = uid;
    if (uid_ == null) return;
    await _firestore
        .collection('users')
        .doc(uid_)
        .collection('folders')
        .doc(folder.id)
        .set(folder.toMap(), SetOptions(merge: true));
  }
}
