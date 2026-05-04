import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';

class BarberiasService {
  final _db = Supabase.instance.client;

  Future<Map<String, dynamic>?> getBarberia(String barberiaId) async {
    return await _db
        .from('barberias')
        .select('id, nombre, logo_url, slug, codigo')
        .eq('id', barberiaId)
        .maybeSingle();
  }

  Future<String> uploadLogo(String barberiaId, Uint8List bytes) async {
    final storagePath = '$barberiaId/logo.jpg';
    await _db.storage.from('logos').uploadBinary(
      storagePath,
      bytes,
      fileOptions: const FileOptions(contentType: 'image/jpeg', upsert: true),
    );
    return _db.storage.from('logos').getPublicUrl(storagePath);
  }

  Future<void> updateLogoUrl(String barberiaId, String logoUrl) async {
    await _db.from('barberias').update({'logo_url': logoUrl}).eq('id', barberiaId);
  }
}
