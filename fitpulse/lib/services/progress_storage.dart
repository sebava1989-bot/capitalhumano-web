import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class WeightEntry {
  final String id;
  final DateTime date;
  final double kg;
  final String? note;

  WeightEntry({required this.id, required this.date, required this.kg, this.note});

  Map<String, dynamic> toJson() => {
    'id': id, 'date': date.toIso8601String(), 'kg': kg, 'note': note,
  };
  factory WeightEntry.fromJson(Map<String, dynamic> j) => WeightEntry(
    id: j['id'], date: DateTime.parse(j['date']),
    kg: (j['kg'] as num).toDouble(), note: j['note'],
  );
}

class MeasurementEntry {
  final String id;
  final DateTime date;
  final double? cintura;
  final double? pecho;
  final double? cadera;
  final double? brazoDer;
  final double? muslo;
  final double? cuello;
  final String? note;

  MeasurementEntry({
    required this.id, required this.date,
    this.cintura, this.pecho, this.cadera,
    this.brazoDer, this.muslo, this.cuello, this.note,
  });

  Map<String, dynamic> toJson() => {
    'id': id, 'date': date.toIso8601String(),
    'cintura': cintura, 'pecho': pecho, 'cadera': cadera,
    'brazoDer': brazoDer, 'muslo': muslo, 'cuello': cuello, 'note': note,
  };
  factory MeasurementEntry.fromJson(Map<String, dynamic> j) => MeasurementEntry(
    id: j['id'], date: DateTime.parse(j['date']),
    cintura: (j['cintura'] as num?)?.toDouble(),
    pecho: (j['pecho'] as num?)?.toDouble(),
    cadera: (j['cadera'] as num?)?.toDouble(),
    brazoDer: (j['brazoDer'] as num?)?.toDouble(),
    muslo: (j['muslo'] as num?)?.toDouble(),
    cuello: (j['cuello'] as num?)?.toDouble(),
    note: j['note'],
  );
}

class ProgressStorage {
  static const _weightKey = 'fp_weight_log';
  static const _measureKey = 'fp_measure_log';
  static const _goalKey = 'fp_weight_goal';

  // PESO
  static Future<List<WeightEntry>> getWeights() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_weightKey);
    if (raw == null) return [];
    return (jsonDecode(raw) as List).map((e) => WeightEntry.fromJson(e)).toList()
      ..sort((a, b) => a.date.compareTo(b.date));
  }

  static Future<void> saveWeight(WeightEntry e) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getWeights();
    list.add(e);
    list.sort((a, b) => a.date.compareTo(b.date));
    await prefs.setString(_weightKey, jsonEncode(list.map((w) => w.toJson()).toList()));
  }

  static Future<void> deleteWeight(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getWeights();
    list.removeWhere((e) => e.id == id);
    await prefs.setString(_weightKey, jsonEncode(list.map((w) => w.toJson()).toList()));
  }

  static Future<double?> getWeightGoal() async {
    final prefs = await SharedPreferences.getInstance();
    final v = prefs.getDouble(_goalKey);
    return v;
  }

  static Future<void> setWeightGoal(double goal) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble(_goalKey, goal);
  }

  // MEDIDAS
  static Future<List<MeasurementEntry>> getMeasurements() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_measureKey);
    if (raw == null) return [];
    return (jsonDecode(raw) as List).map((e) => MeasurementEntry.fromJson(e)).toList()
      ..sort((a, b) => a.date.compareTo(b.date));
  }

  static Future<void> saveMeasurement(MeasurementEntry e) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getMeasurements();
    list.add(e);
    list.sort((a, b) => a.date.compareTo(b.date));
    await prefs.setString(_measureKey, jsonEncode(list.map((m) => m.toJson()).toList()));
  }

  static Future<void> deleteMeasurement(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getMeasurements();
    list.removeWhere((e) => e.id == id);
    await prefs.setString(_measureKey, jsonEncode(list.map((m) => m.toJson()).toList()));
  }
}
