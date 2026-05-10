import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/estilo_corte.dart';

const _apiBase = 'https://barberia-saas-gamma.vercel.app';

class EstilosService {
  final _db = Supabase.instance.client;

  Future<List<EstiloCorte>> getEstilos(String barberiaId) async {
    final data = await _db
        .from('estilos_corte')
        .select()
        .or('es_predefinido.eq.true,barberia_id.eq.$barberiaId')
        .eq('activo', true)
        .order('orden');
    return (data as List).map((e) => EstiloCorte.fromJson(e)).toList();
  }

  Future<void> agregarEstilo({
    required String barberiaId,
    required String nombre,
    String? descripcion,
    String? fotoReferenciaUrl,
  }) async {
    final prompt =
        'Modifica solo el cabello de esta persona aplicando un $nombre'
        '${descripcion != null ? ". $descripcion" : ""}.'
        ' Mantén el rostro, expresión, piel, ropa y fondo exactamente iguales. Solo cambia el peinado.';
    await _db.from('estilos_corte').insert({
      'barberia_id': barberiaId,
      'nombre': nombre,
      'descripcion': descripcion,
      'foto_referencia_url': fotoReferenciaUrl,
      'prompt_ia': prompt,
      'es_predefinido': false,
      'orden': 100,
      'activo': true,
    });
  }

  Future<void> eliminarEstilo(String estiloId) async {
    await _db
        .from('estilos_corte')
        .update({'activo': false})
        .eq('id', estiloId);
  }

  Future<Map<String, dynamic>> analizarRostro({
    required String slug,
    required Uint8List fotoBytes,
  }) async {
    final token = _db.auth.currentSession?.accessToken;
    if (token == null) throw Exception('No hay sesión activa');

    final base64Img = base64Encode(fotoBytes);
    final response = await http
        .post(
          Uri.parse('$_apiBase/api/$slug/analizar-rostro'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode({'imageBase64': base64Img}),
        )
        .timeout(const Duration(seconds: 30));

    if (response.statusCode != 200) {
      throw Exception('Error ${response.statusCode}: ${response.body}');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<String> generarTransformacion({
    required String slug,
    required Uint8List fotoBytes,
    required EstiloCorte estilo,
  }) async {
    final token = _db.auth.currentSession?.accessToken;
    if (token == null) throw Exception('No hay sesión activa');

    final base64Img = base64Encode(fotoBytes);
    final response = await http
        .post(
          Uri.parse('$_apiBase/api/$slug/generar-estilo'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode({
            'imageBase64': base64Img,
            'promptEstilo': estilo.promptIa,
          }),
        )
        .timeout(const Duration(seconds: 60));

    if (response.statusCode != 200) {
      throw Exception('Error ${response.statusCode}: ${response.body}');
    }
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return data['imageBase64'] as String;
  }
}
