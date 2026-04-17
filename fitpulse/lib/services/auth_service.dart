import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';

class AuthService {
  static const String baseUrl = 'https://fitpulse-production-d06c.up.railway.app/api';
  static const String _tokenKey = 'fp_token';
  static const String _userKey = 'fp_user';

  static Future<Map<String, dynamic>> login({
    required String gymCode,
    required String rut,
    required String password,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'gym_code': gymCode.trim().toUpperCase(),
        'rut': rut.trim(),
        'password': password,
      }),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) throw data['error'] ?? 'Error al iniciar sesión';

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, data['token']);
    await prefs.setString(_userKey, jsonEncode(data['user']));

    return data;
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<UserModel?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw == null) return null;
    return UserModel.fromJson(jsonDecode(raw));
  }

  static Future<void> saveDemo() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, 'demo-token');
    await prefs.setString(_userKey, jsonEncode({
      'id': 1,
      'full_name': 'Carlos Muñoz',
      'rut': '12345678-9',
      'gym_code': 'GYM01',
      'gym_name': 'FitPulse Gym',
      'points': 1240,
      'streak': 7,
      'level': 4,
      'rank_position': 3,
    }));
  }

  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null;
  }

  static Future<void> updateUserCache(Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(userData));
  }
}
