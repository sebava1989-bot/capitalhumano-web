import 'package:flutter_test/flutter_test.dart';
import 'package:alma_ai/theme.dart';

void main() {
  test('AlmaTheme tiene exactamente 4 temas', () {
    expect(AlmaTheme.all.length, 4);
  });

  test('El tema por defecto es Naturaleza (índice 0)', () {
    expect(AlmaTheme.all[0].name, 'Naturaleza');
  });

  test('Cada tema tiene colores primario, burbuja, usuario y fondo definidos', () {
    for (final theme in AlmaTheme.all) {
      expect(theme.primary, isNotNull);
      expect(theme.almaBubble, isNotNull);
      expect(theme.userBubble, isNotNull);
      expect(theme.background, isNotNull);
    }
  });
}
