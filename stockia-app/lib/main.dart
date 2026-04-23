import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'services/auth_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/salida_screen.dart';
import 'screens/dte_screen.dart';
import 'screens/dte_review_screen.dart';

void main() {
  runApp(const StockIAApp());
}

final _router = GoRouter(
  initialLocation: '/home',
  redirect: (context, state) async {
    final auth = AuthService();
    final loggedIn = await auth.isLoggedIn();
    if (!loggedIn && state.matchedLocation != '/login') return '/login';
    if (loggedIn && state.matchedLocation == '/login') return '/home';
    return null;
  },
  routes: [
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
    GoRoute(path: '/salida', builder: (_, __) => const SalidaScreen()),
    GoRoute(path: '/dte', builder: (_, __) => const DteScreen()),
    GoRoute(
      path: '/dte/review/:documentId',
      builder: (_, state) => DteReviewScreen(documentId: state.pathParameters['documentId']!),
    ),
  ],
);

class StockIAApp extends StatelessWidget {
  const StockIAApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'StockIA',
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF2563EB),
        useMaterial3: true,
      ),
      routerConfig: _router,
    );
  }
}
