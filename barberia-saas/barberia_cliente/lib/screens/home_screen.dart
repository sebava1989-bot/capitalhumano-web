import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../config/supabase_config.dart';
import 'login_screen.dart';
import 'reservar_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _db = Supabase.instance.client;
  Map<String, dynamic>? _userData;
  Map<String, dynamic>? _proximaCita;
  List<Map<String, dynamic>> _premios = [];
  List<Map<String, dynamic>> _historial = [];
  String? _barberiaNombre;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final user = _db.auth.currentUser;
    if (user == null) return;

    final barberia = await _db.from('barberias').select('id, nombre').eq('slug', barberiaSlug).maybeSingle();
    if (barberia == null) return;

    final barberiaId = barberia['id'] as String;

    final now = DateTime.now().toUtc();
    final userData = await _db.from('users').select('nombre, referral_code').eq('id', user.id).maybeSingle();
    final proximaCita = await _db.from('reservas')
      .select('id, fecha_hora, estado, precio_final, servicios(nombre), barberos(nombre)')
      .eq('cliente_id', user.id)
      .eq('barberia_id', barberiaId)
      .inFilter('estado', ['confirmada', 'en_curso', 'pendiente'])
      .gte('fecha_hora', now.toIso8601String())
      .order('fecha_hora').limit(1).maybeSingle();
    final premiosRaw = await _db.from('referido_premios')
      .select('descuento_pct')
      .eq('referidor_id', user.id)
      .eq('barberia_id', barberiaId)
      .eq('canjeado', false)
      .eq('confirmado', true);
    final historialRaw = await _db.from('reservas')
      .select('fecha_hora, estado, precio_final, servicios(nombre), barberos(nombre)')
      .eq('cliente_id', user.id)
      .eq('barberia_id', barberiaId)
      .inFilter('estado', ['completada', 'cancelada'])
      .order('fecha_hora', ascending: false).limit(5);

    if (!mounted) return;
    setState(() {
      _barberiaNombre = barberia['nombre'];
      _userData = userData;
      _proximaCita = proximaCita;
      _premios = List<Map<String, dynamic>>.from(premiosRaw);
      _historial = List<Map<String, dynamic>>.from(historialRaw);
      _loading = false;
    });
  }

  String _formatFecha(String iso) {
    final dt = DateTime.parse(iso).toLocal();
    return DateFormat("EEEE d 'de' MMMM · HH:mm", 'es').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: Color(0xFFFACC15))));
    }

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFFFACC15),
          onRefresh: _load,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Hola, ${_userData?['nombre'] ?? 'Cliente'} 👋',
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  Text(_barberiaNombre ?? '', style: const TextStyle(color: Colors.white54, fontSize: 13)),
                ]),
                IconButton(
                  icon: const Icon(Icons.logout, color: Colors.white38),
                  onPressed: () async {
                    await _db.auth.signOut();
                    if (!mounted) return;
                    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
                  },
                ),
              ]),
              const SizedBox(height: 24),

              // Próxima cita
              if (_proximaCita != null) ...[
                const Text('TU PRÓXIMA CITA', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF27272A), Color(0xFF1C1C1F)]),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFFACC15).withValues(alpha: 0.3)),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(
                      (_proximaCita!['servicios'] as Map?)?['nombre'] ?? 'Servicio',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 17),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'con ${(_proximaCita!['barberos'] as Map?)?['nombre'] ?? ''}',
                      style: const TextStyle(color: Colors.white60, fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    Row(children: [
                      const Icon(Icons.access_time, color: Color(0xFFFACC15), size: 16),
                      const SizedBox(width: 6),
                      Text(_formatFecha(_proximaCita!['fecha_hora']),
                        style: const TextStyle(color: Color(0xFFFACC15), fontSize: 13, fontWeight: FontWeight.w600)),
                    ]),
                    const SizedBox(height: 4),
                    Text('\$${NumberFormat('#,###', 'es_CL').format(_proximaCita!['precio_final'] ?? 0)}',
                      style: const TextStyle(color: Colors.white70, fontSize: 13)),
                  ]),
                ),
                const SizedBox(height: 20),
              ] else ...[
                GestureDetector(
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReservarScreen())).then((_) => _load()),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFACC15),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(Icons.calendar_today, color: Colors.black, size: 20),
                      SizedBox(width: 10),
                      Text('Reservar hora', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 17)),
                    ]),
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Botón reservar (si hay cita activa igual lo mostramos pequeño)
              if (_proximaCita != null) ...[
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReservarScreen())).then((_) => _load()),
                  icon: const Icon(Icons.add, color: Color(0xFFFACC15), size: 18),
                  label: const Text('Nueva reserva', style: TextStyle(color: Color(0xFFFACC15))),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFFACC15), width: 1),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    minimumSize: const Size(double.infinity, 44),
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Premios
              if (_premios.isNotEmpty) ...[
                const Text('TUS PREMIOS', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1C1C1F),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                  ),
                  child: Row(children: [
                    const Text('🎁', style: TextStyle(fontSize: 28)),
                    const SizedBox(width: 12),
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('${_premios.fold(0, (s, p) => s + (p['descuento_pct'] as int? ?? 0))}% de descuento disponible',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      const Text('Se aplica automáticamente en tu próxima reserva',
                        style: TextStyle(color: Colors.white54, fontSize: 12)),
                    ]),
                  ]),
                ),
                const SizedBox(height: 20),
              ],

              // Código de referido
              if (_userData?['referral_code'] != null) ...[
                const Text('TU CÓDIGO DE REFERIDO', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1C1C1F),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFF3F3F46)),
                  ),
                  child: Row(children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(_userData!['referral_code'],
                        style: const TextStyle(color: Color(0xFFFACC15), fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 4)),
                      const Text('Comparte y gana descuentos cuando tus amigos se atiendan',
                        style: TextStyle(color: Colors.white54, fontSize: 12)),
                    ])),
                    IconButton(
                      icon: const Icon(Icons.copy, color: Colors.white38),
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: _userData!['referral_code']));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('¡Código copiado!'), backgroundColor: Color(0xFF27272A)),
                        );
                      },
                    ),
                  ]),
                ),
                const SizedBox(height: 20),
              ],

              // Historial
              if (_historial.isNotEmpty) ...[
                const Text('HISTORIAL', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                ..._historial.map((r) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1C1C1F),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text((r['servicios'] as Map?)?['nombre'] ?? '',
                        style: const TextStyle(color: Colors.white70, fontSize: 14)),
                      Text(_formatFecha(r['fecha_hora']),
                        style: const TextStyle(color: Colors.white38, fontSize: 12)),
                    ])),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: r['estado'] == 'completada' ? Colors.green.withValues(alpha: 0.15) : Colors.red.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(r['estado'] == 'completada' ? '✓ Listo' : 'Cancelada',
                        style: TextStyle(
                          color: r['estado'] == 'completada' ? Colors.green : Colors.red,
                          fontSize: 11, fontWeight: FontWeight.w600)),
                    ),
                  ]),
                )),
              ],
            ]),
          ),
        ),
      ),
    );
  }
}
