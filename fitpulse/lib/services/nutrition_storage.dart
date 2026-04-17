import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'food_ai_service.dart';

class NutritionStorage {
  static const String _prefix = 'fp_meals_';
  static const int defaultCalorieGoal = 2000;

  static String _key(DateTime date) =>
      '$_prefix${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  static Future<List<MealLog>> getToday() async {
    return getForDate(DateTime.now());
  }

  static Future<List<MealLog>> getForDate(DateTime date) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key(date));
    if (raw == null) return [];
    final list = jsonDecode(raw) as List;
    return list.map((e) => MealLog.fromJson(e)).toList();
  }

  static Future<void> saveMeal(MealLog meal) async {
    final prefs = await SharedPreferences.getInstance();
    final key = _key(meal.dateTime);
    final raw = prefs.getString(key);
    final list = raw != null ? (jsonDecode(raw) as List).map((e) => MealLog.fromJson(e)).toList() : <MealLog>[];
    list.add(meal);
    await prefs.setString(key, jsonEncode(list.map((m) => m.toJson()).toList()));
  }

  static Future<void> deleteMeal(String mealId, DateTime date) async {
    final prefs = await SharedPreferences.getInstance();
    final key = _key(date);
    final raw = prefs.getString(key);
    if (raw == null) return;
    final list = (jsonDecode(raw) as List).map((e) => MealLog.fromJson(e)).toList();
    list.removeWhere((m) => m.id == mealId);
    await prefs.setString(key, jsonEncode(list.map((m) => m.toJson()).toList()));
  }

  static Future<int> getCalorieGoal() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('fp_calorie_goal') ?? defaultCalorieGoal;
  }

  static Future<void> setCalorieGoal(int goal) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('fp_calorie_goal', goal);
  }
}
