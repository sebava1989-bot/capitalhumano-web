import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/auth_service.dart';
import 'barberos_screen.dart';
import 'servicios_screen.dart';
import 'login_screen.dart';

class ConfigScreen extends StatefulWidget {
  final String barberiaId;
  const ConfigScreen({super.key, required this.barberiaId});
  @override
  State<ConfigScreen> createState() => _ConfigScreenState();
}

class _ConfigScreenState extends State<ConfigScreen> {
  String? _nombre;
  String? _slug;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await Supabase.instance.client
        .from('barberias')
        .select('nombre, slug')
        .eq('id', widget.barberiaId)
        .maybeSingle();
    if (!mounted || data == null) return;
    setState(() {
      _nombre = data['nombre'] as String?;
      _slug = data['slug'] as String?;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Configuración')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (_nombre != null) _InfoTile('Barbería', _nombre!),
          if (_slug != null) _InfoTile('URL slug', _slug!),
          const SizedBox(height: 24),
          const Text('GESTIÓN',
              style: TextStyle(
                  color: Color(0xFFA1A1AA),
                  fontSize: 12,
                  letterSpacing: 1)),
          const SizedBox(height: 8),
          _NavTile(
            Icons.content_cut,
            'Barberos',
            () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) =>
                        BarberosScreen(barberiaId: widget.barberiaId))),
          ),
          const SizedBox(height: 8),
          _NavTile(
            Icons.list_alt,
            'Servicios',
            () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) =>
                        ServiciosScreen(barberiaId: widget.barberiaId))),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () async {
                await AuthService().signOut();
                if (mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(
                        builder: (_) => const LoginScreen()),
                    (_) => false,
                  );
                }
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.redAccent),
                foregroundColor: Colors.redAccent,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Cerrar sesión',
                  style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label, value;
  const _InfoTile(this.label, this.value);
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(children: [
          SizedBox(
              width: 80,
              child: Text(label,
                  style: const TextStyle(color: Color(0xFFA1A1AA)))),
          Expanded(
              child: Text(value,
                  style: const TextStyle(color: Colors.white))),
        ]),
      );
}

class _NavTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _NavTile(this.icon, this.label, this.onTap);
  @override
  Widget build(BuildContext context) => ListTile(
        tileColor: const Color(0xFF27272A),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12)),
        leading: Icon(icon, color: const Color(0xFFFACC15)),
        title: Text(label, style: const TextStyle(color: Colors.white)),
        trailing: const Icon(Icons.chevron_right,
            color: Color(0xFFA1A1AA)),
        onTap: onTap,
      );
}
