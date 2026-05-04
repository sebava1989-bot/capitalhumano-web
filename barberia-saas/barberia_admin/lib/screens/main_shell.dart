import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'dashboard_screen.dart';
import 'agenda_screen.dart';
import 'clientes_screen.dart';
import 'alianzas_screen.dart';
import 'config_screen.dart';
import 'login_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, this.initialIndex = 0});
  final int initialIndex;
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  String? _barberiaId;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _loadBarberia();
  }

  Future<void> _loadBarberia() async {
    final id = await AuthService().getBarberiaId();
    if (!mounted) return;
    setState(() {
      _barberiaId = id;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(
            child: CircularProgressIndicator(color: Color(0xFFFACC15))),
      );
    }
    if (_barberiaId == null) {
      return Scaffold(
        body: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Text('No se encontró barbería asignada.',
                style: TextStyle(color: Colors.white70)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                await AuthService().signOut();
                if (mounted) {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  );
                }
              },
              child: const Text('Cerrar sesión'),
            ),
          ]),
        ),
      );
    }

    final screens = [
      DashboardScreen(barberiaId: _barberiaId!),
      AgendaScreen(barberiaId: _barberiaId!),
      ClientesScreen(barberiaId: _barberiaId!),
      AlianzasScreen(barberiaId: _barberiaId!),
      ConfigScreen(barberiaId: _barberiaId!),
    ];

    return Scaffold(
      body: screens[_index],
      bottomNavigationBar: NavigationBar(
        backgroundColor: const Color(0xFF27272A),
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        indicatorColor: const Color(0xFFFACC15).withValues(alpha: 0.2),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.bar_chart_outlined),
              selectedIcon:
                  Icon(Icons.bar_chart, color: Color(0xFFFACC15)),
              label: 'Inicio'),
          NavigationDestination(
              icon: Icon(Icons.calendar_today_outlined),
              selectedIcon:
                  Icon(Icons.calendar_today, color: Color(0xFFFACC15)),
              label: 'Agenda'),
          NavigationDestination(
              icon: Icon(Icons.people_outline),
              selectedIcon: Icon(Icons.people, color: Color(0xFFFACC15)),
              label: 'Clientes'),
          NavigationDestination(
              icon: Icon(Icons.card_giftcard_outlined),
              selectedIcon:
                  Icon(Icons.card_giftcard, color: Color(0xFFFACC15)),
              label: 'Alianzas'),
          NavigationDestination(
              icon: Icon(Icons.settings_outlined),
              selectedIcon:
                  Icon(Icons.settings, color: Color(0xFFFACC15)),
              label: 'Config'),
        ],
      ),
    );
  }
}
