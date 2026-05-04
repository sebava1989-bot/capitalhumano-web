import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/barberias_service.dart';
import 'barberos_screen.dart';
import 'servicios_screen.dart';
import 'campana_referidos_screen.dart';
import 'logo_upload_screen.dart';
import 'login_screen.dart';

class ConfigScreen extends StatefulWidget {
  final String barberiaId;
  const ConfigScreen({super.key, required this.barberiaId});
  @override
  State<ConfigScreen> createState() => _ConfigScreenState();
}

class _ConfigScreenState extends State<ConfigScreen> {
  Map<String, dynamic>? _barberia;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await BarberiasService().getBarberia(widget.barberiaId);
    if (!mounted || data == null) return;
    setState(() => _barberia = data);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Configuración')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (_barberia != null) ...[
            _InfoTile('Barbería', _barberia!['nombre'] as String? ?? ''),
            _InfoTile('Código', _barberia!['codigo'] as String? ?? ''),
            _InfoTile('URL slug', _barberia!['slug'] as String? ?? ''),
          ],
          const SizedBox(height: 24),
          const Text('GESTIÓN',
              style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 12, letterSpacing: 1)),
          const SizedBox(height: 8),
          _NavTile(Icons.image_outlined, 'Logo de la barbería', () async {
            await Navigator.push(context, MaterialPageRoute(
              builder: (_) => LogoUploadScreen(
                barberiaId: widget.barberiaId,
                logoUrlActual: _barberia?['logo_url'] as String?,
              ),
            ));
            _load();
          }),
          const SizedBox(height: 8),
          _NavTile(Icons.content_cut, 'Barberos', () => Navigator.push(context,
              MaterialPageRoute(builder: (_) => BarberosScreen(barberiaId: widget.barberiaId)))),
          const SizedBox(height: 8),
          _NavTile(Icons.list_alt, 'Servicios', () => Navigator.push(context,
              MaterialPageRoute(builder: (_) => ServiciosScreen(barberiaId: widget.barberiaId)))),
          const SizedBox(height: 8),
          _NavTile(Icons.people_outline, 'Campaña de Referidos', () => Navigator.push(context,
              MaterialPageRoute(builder: (_) => CampanaReferidosScreen(barberiaId: widget.barberiaId)))),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () async {
                await AuthService().signOut();
                if (!mounted) return;
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (_) => false,
                );
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.redAccent),
                foregroundColor: Colors.redAccent,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Cerrar sesión', style: TextStyle(fontWeight: FontWeight.bold)),
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
      SizedBox(width: 80, child: Text(label, style: const TextStyle(color: Color(0xFFA1A1AA)))),
      Expanded(child: Text(value, style: const TextStyle(color: Colors.white))),
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
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    leading: Icon(icon, color: const Color(0xFFFACC15)),
    title: Text(label, style: const TextStyle(color: Colors.white)),
    trailing: const Icon(Icons.chevron_right, color: Color(0xFFA1A1AA)),
    onTap: onTap,
  );
}
