import 'package:shared_preferences/shared_preferences.dart';

class TrialService {
  static const _keyInstallDate = 'install_date';
  static const _keyIsPremium = 'is_premium';
  static const _keyPurchaseToken = 'purchase_token';

  static int daysElapsed({required DateTime installDate, required DateTime now}) {
    return now.difference(installDate).inDays;
  }

  static bool canUseApp({required bool isPremium, required int daysElapsed}) {
    return isPremium || daysElapsed < 7;
  }

  static Future<DateTime> initInstallDate() async {
    final prefs = await SharedPreferences.getInstance();
    if (!prefs.containsKey(_keyInstallDate)) {
      final now = DateTime.now();
      await prefs.setInt(_keyInstallDate, now.millisecondsSinceEpoch);
      return now;
    }
    return DateTime.fromMillisecondsSinceEpoch(prefs.getInt(_keyInstallDate)!);
  }

  static Future<DateTime> getInstallDate() async {
    final prefs = await SharedPreferences.getInstance();
    final ms = prefs.getInt(_keyInstallDate);
    if (ms == null) return initInstallDate();
    return DateTime.fromMillisecondsSinceEpoch(ms);
  }

  static Future<bool> getIsPremium() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyIsPremium) ?? false;
  }

  static Future<void> setPremium({required String purchaseToken}) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyIsPremium, true);
    await prefs.setString(_keyPurchaseToken, purchaseToken);
  }

  static Future<void> clearPremium() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyIsPremium);
    await prefs.remove(_keyPurchaseToken);
  }

  static Future<({bool isPremium, int daysElapsed, bool canUse})> getStatus() async {
    final installDate = await getInstallDate();
    final isPremium = await getIsPremium();
    final elapsed = daysElapsed(installDate: installDate, now: DateTime.now());
    return (
      isPremium: isPremium,
      daysElapsed: elapsed,
      canUse: canUseApp(isPremium: isPremium, daysElapsed: elapsed),
    );
  }
}
