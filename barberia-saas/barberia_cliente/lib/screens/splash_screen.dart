import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'login_screen.dart';
import 'home_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    final session = Supabase.instance.client.auth.currentSession;
    Navigator.of(context).pushReplacement(MaterialPageRoute(
      builder: (_) => session != null ? const HomeScreen() : const LoginScreen(),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('✂️', style: TextStyle(fontSize: 56)),
          SizedBox(height: 16),
          Text('BarberDesk', style: TextStyle(color: Color(0xFFFACC15), fontSize: 28, fontWeight: FontWeight.bold)),
          SizedBox(height: 8),
          Text('Tu próxima cita, fácil', style: TextStyle(color: Colors.white54, fontSize: 14)),
        ]),
      ),
    );
  }
}
