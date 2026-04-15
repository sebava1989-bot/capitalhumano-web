// TODO: Run `flutterfire configure --project=scannerexpress-tuamigodigital`
// This file will be auto-generated. For now it's a stub.
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) throw UnsupportedError('Web not supported');
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      default:
        throw UnsupportedError('Platform not supported');
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDhOEWWZDLVkz8wYjzK9TgrtIDrxuJl_gI',
    appId: '1:603694623352:android:cb0b00bb92fa79b1d05b8d',
    messagingSenderId: '603694623352',
    projectId: 'scannerexpress-tuamigodigital',
    storageBucket: 'scannerexpress-tuamigodigital.firebasestorage.app',
  );

}