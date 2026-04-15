import 'package:flutter_test/flutter_test.dart';
import 'package:scannerexpress/services/trial_service.dart';

void main() {
  group('TrialService.daysElapsed', () {
    test('returns 0 on install day', () {
      final install = DateTime(2026, 4, 15);
      final now = DateTime(2026, 4, 15, 10, 0);
      expect(TrialService.daysElapsed(installDate: install, now: now), 0);
    });

    test('returns 6 after 6 days', () {
      final install = DateTime(2026, 4, 15);
      final now = DateTime(2026, 4, 21, 10, 0);
      expect(TrialService.daysElapsed(installDate: install, now: now), 6);
    });

    test('returns 7 after 7 days — trial expired', () {
      final install = DateTime(2026, 4, 15);
      final now = DateTime(2026, 4, 22, 10, 0);
      expect(TrialService.daysElapsed(installDate: install, now: now), 7);
    });
  });

  group('TrialService.canUseApp', () {
    test('premium user can always use app', () {
      expect(TrialService.canUseApp(isPremium: true, daysElapsed: 100), true);
    });

    test('trial user within 7 days can use app', () {
      expect(TrialService.canUseApp(isPremium: false, daysElapsed: 6), true);
    });

    test('trial user at day 7 cannot use app', () {
      expect(TrialService.canUseApp(isPremium: false, daysElapsed: 7), false);
    });
  });
}
