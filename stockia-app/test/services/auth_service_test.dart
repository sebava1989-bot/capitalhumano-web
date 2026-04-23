import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stockia_app/services/auth_service.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('isLoggedIn returns false when no token', () async {
    final auth = AuthService();
    expect(await auth.isLoggedIn(), isFalse);
  });

  test('saveToken + getToken round trip', () async {
    final auth = AuthService();
    await auth.saveToken('tok123', 'user@test.cl', 'admin');
    expect(await auth.getToken(), 'tok123');
    expect(await auth.getEmail(), 'user@test.cl');
    expect(await auth.isLoggedIn(), isTrue);
  });

  test('logout clears token', () async {
    final auth = AuthService();
    await auth.saveToken('tok123', 'user@test.cl', 'admin');
    await auth.logout();
    expect(await auth.isLoggedIn(), isFalse);
    expect(await auth.getToken(), isNull);
  });
}
