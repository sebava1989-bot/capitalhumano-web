import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scannerexpress/widgets/premium_badge.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:scannerexpress/l10n/app_localizations.dart';

Widget _wrap(Widget child) => MaterialApp(
  localizationsDelegates: [
    AppLocalizations.delegate,
    ...GlobalMaterialLocalizations.delegates,
    GlobalWidgetsLocalizations.delegate,
  ],
  supportedLocales: const [Locale('es')],
  home: Scaffold(body: child),
);

void main() {
  testWidgets('shows PRO when premium', (tester) async {
    await tester.pumpWidget(_wrap(const PremiumBadge(isPremium: true, daysLeft: 0)));
    await tester.pump(); // allow localizations to load
    expect(find.text('PRO'), findsOneWidget);
  });

  testWidgets('shows days left when not premium', (tester) async {
    await tester.pumpWidget(_wrap(const PremiumBadge(isPremium: false, daysLeft: 4)));
    await tester.pump();
    expect(find.textContaining('4'), findsOneWidget);
  });
}
