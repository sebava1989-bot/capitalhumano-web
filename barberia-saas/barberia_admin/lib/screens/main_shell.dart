import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/barberias_service.dart';
import 'dashboard_screen.dart';
import 'agenda_screen.dart';
import 'clientes_screen.dart';
import 'config_screen.dart';
import 'login_screen.dart';
import 'prueba_estilo_screen.dart';
import 'gestion_estilos_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, this.initialIndex = 0});
  final int initialIndex;
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  String? _barberiaId;
  String _barberiaNombre = '';
  String _barberiaSlug = '';
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
    String nombre = '';
    String slug = '';
    if (id != null) {
      final data = await BarberiasService().getBarberia(id);
      nombre = data?['nombre'] as String? ?? '';
      slug = data?['slug'] as String? ?? '';
    }
    if (!mounted) return;
    setState(() {
      _barberiaId = id;
      _barberiaNombre = nombre;
      _barberiaSlug = slug;
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
      ClientesScreen(barberiaId: _barberiaId!, barberiaNombre: _barberiaNombre),
      ConfigScreen(barberiaId: _barberiaId!),
      PruebaEstiloScreen(
        barberiaId: _barberiaId!,
        barberiaSlug: _barberiaSlug,
        onGestionarEstilos: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => GestionEstilosScreen(barberiaId: _barberiaId!),
          ),
        ),
      ),
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
              selectedIcon: Icon(Icons.bar_chart, color: Color(0xFFFACC15)),
              label: 'Inicio'),
          NavigationDestination(
              icon: Icon(Icons.calendar_today_outlined),
              selectedIcon: Icon(Icons.calendar_today, color: Color(0xFFFACC15)),
              label: 'Agenda'),
          NavigationDestination(
              icon: Icon(Icons.people_outline),
              selectedIcon: Icon(Icons.people, color: Color(0xFFFACC15)),
              label: 'Clientes'),
          NavigationDestination(
              icon: Icon(Icons.settings_outlined),
              selectedIcon:
                  Icon(Icons.settings, color: Color(0xFFFACC15)),
              label: 'Config'),
          NavigationDestination(
              icon: Icon(Icons.auto_fix_high_outlined),
              selectedIcon:
                  Icon(Icons.auto_fix_high, color: Color(0xFFFACC15)),
              label: 'Estilos IA'),
        ],
      ),
    );
  }
}
