import 'package:flutter/material.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFF0071e3),
      body: Center(
        child: Text(
          'ScannerExpress',
          style: TextStyle(color: Colors.white, fontSize: 24),
        ),
      ),
    );
  }
}
