import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'firebase_options.dart';
import 'l10n/app_localizations.dart';
import 'screens/splash_screen.dart';
import 'services/database_service.dart';
import 'services/trial_service.dart';
import 'services/firebase_service.dart';

final dbService = DatabaseService();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  await dbService.init();
  await TrialService.initInstallDate();
  await FirebaseService.ensureAnonymousAuth();
  runApp(const ScannerExpressApp());
}

class ScannerExpressApp extends StatelessWidget {
  const ScannerExpressApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ScannerExpress',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0071e3)),
        fontFamily: 'Inter',
        useMaterial3: true,
      ),
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('es'), Locale('en')],
      home: const SplashScreen(),
    );
  }
}
