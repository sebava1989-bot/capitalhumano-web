import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class FoodAiService {
  // Reemplazar con tu API key de Anthropic
  static const String _apiKey = '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';
  static const String _url = 'https://api.anthropic.com/v1/messages';

  static Future<FoodAnalysis> analyzePhoto(File imageFile) async {
    final bytes = await imageFile.readAsBytes();
    final base64Image = base64Encode(bytes);
    final ext = imageFile.path.split('.').last.toLowerCase();
    final mediaType = ext == 'png' ? 'image/png' : 'image/jpeg';

    final body = jsonEncode({
      'model': 'claude-haiku-4-5-20251001',
      'max_tokens': 512,
      'messages': [
        {
          'role': 'user',
          'content': [
            {
              'type': 'image',
              'source': {
                'type': 'base64',
                'media_type': mediaType,
                'data': base64Image,
              },
            },
            {
              'type': 'text',
              'text': '''Analiza esta imagen de comida y responde SOLO con un JSON válido, sin texto adicional, con este formato exacto:
{
  "nombre": "nombre del alimento o plato",
  "calorias": número entero estimado,
  "proteinas": número entero en gramos,
  "carbohidratos": número entero en gramos,
  "grasas": número entero en gramos,
  "porcion": "descripción de la porción estimada",
  "confianza": "alta" | "media" | "baja",
  "nota": "observación breve opcional"
}
Si no puedes identificar comida en la imagen, responde: {"error": "No se detectó alimento en la imagen"}'''
            }
          ],
        }
      ],
    });

    final res = await http.post(
      Uri.parse(_url),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': _apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: body,
    );

    if (res.statusCode != 200) {
      throw 'Error al analizar la imagen (${res.statusCode})';
    }

    final data = jsonDecode(res.body);
    final text = data['content'][0]['text'] as String;

    // Extraer JSON de la respuesta
    final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(text);
    if (jsonMatch == null) throw 'Respuesta inválida del análisis';

    final parsed = jsonDecode(jsonMatch.group(0)!);
    if (parsed['error'] != null) throw parsed['error'] as String;

    return FoodAnalysis.fromJson(parsed);
  }
}

class FoodAnalysis {
  final String nombre;
  final int calorias;
  final int proteinas;
  final int carbohidratos;
  final int grasas;
  final String porcion;
  final String confianza;
  final String nota;

  FoodAnalysis({
    required this.nombre,
    required this.calorias,
    required this.proteinas,
    required this.carbohidratos,
    required this.grasas,
    required this.porcion,
    required this.confianza,
    required this.nota,
  });

  factory FoodAnalysis.fromJson(Map<String, dynamic> j) => FoodAnalysis(
        nombre: j['nombre'] ?? 'Alimento',
        calorias: (j['calorias'] ?? 0) as int,
        proteinas: (j['proteinas'] ?? 0) as int,
        carbohidratos: (j['carbohidratos'] ?? 0) as int,
        grasas: (j['grasas'] ?? 0) as int,
        porcion: j['porcion'] ?? '',
        confianza: j['confianza'] ?? 'media',
        nota: j['nota'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'nombre': nombre,
        'calorias': calorias,
        'proteinas': proteinas,
        'carbohidratos': carbohidratos,
        'grasas': grasas,
        'porcion': porcion,
        'confianza': confianza,
        'nota': nota,
      };
}

class MealLog {
  final String id;
  final DateTime dateTime;
  final String imagePath;
  final FoodAnalysis analysis;
  final String mealType; // desayuno, almuerzo, cena, snack

  MealLog({
    required this.id,
    required this.dateTime,
    required this.imagePath,
    required this.analysis,
    required this.mealType,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'dateTime': dateTime.toIso8601String(),
        'imagePath': imagePath,
        'analysis': analysis.toJson(),
        'mealType': mealType,
      };

  factory MealLog.fromJson(Map<String, dynamic> j) => MealLog(
        id: j['id'],
        dateTime: DateTime.parse(j['dateTime']),
        imagePath: j['imagePath'] ?? '',
        analysis: FoodAnalysis.fromJson(j['analysis']),
        mealType: j['mealType'] ?? 'snack',
      );
}
