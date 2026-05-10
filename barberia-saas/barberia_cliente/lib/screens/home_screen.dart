import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/supabase_config.dart';
import 'login_screen.dart';
import 'reservar_screen.dart';
import 'cambiar_cita_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _db = Supabase.instance.client;
  Map<String, dynamic>? _userData;
  Map<String, dynamic>? _proximaCita;
  Map<String, dynamic>? _sinCalificar;
  List<Map<String, dynamic>> _premios = [];
  List<Map<String, dynamic>> _descuentosMasivos = [];
  List<Map<String, dynamic>> _historial = [];
  String? _barberiaId;
  String? _barberiaNombre;
  int _descuentoReferidoPct = 0;
  bool _esNuevoReferido = false;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final user = _db.auth.currentUser;
      if (user == null) return;

      final barberia = await _db.from('barberias')
        .select('id, nombre, referido_descuento_nuevo_cliente_pct')
        .eq('slug', barberiaSlug).maybeSingle();
      if (barberia == null) return;

      final barberiaId = barberia['id'] as String;
      final now = DateTime.now().toUtc();

      final userData = await _db.from('users')
        .select('nombre, referral_code, referred_by_code')
        .eq('id', user.id).maybeSingle();

      List<Map<String, dynamic>> premiosRaw = [];
      List<Map<String, dynamic>> descuentosMasivosRaw = [];
      List<Map<String, dynamic>> historialRaw = [];
      dynamic proximaCita;
      dynamic sinCalificar;

      try {
        proximaCita = await _db.from('reservas')
          .select('id, fecha_hora, estado, precio_final, barbero_id, barberia_id, servicios(nombre, duracion_min), barberos(nombre)')
          .eq('cliente_id', user.id)
          .eq('barberia_id', barberiaId)
          .inFilter('estado', ['confirmada', 'en_curso', 'pendiente'])
          .gte('fecha_hora', now.toIso8601String())
          .order('fecha_hora').limit(1).maybeSingle();
      } catch (_) {}

      try {
        sinCalificar = await _db.from('reservas')
          .select('id, servicios(nombre), barberos(nombre)')
          .eq('cliente_id', user.id)
          .eq('barberia_id', barberiaId)
          .eq('estado', 'completada')
          .filter('calificacion', 'is', null)
          .order('fecha_hora', ascending: false)
          .limit(1).maybeSingle();
      } catch (_) {}

      try {
        premiosRaw = List<Map<String, dynamic>>.from(await _db.from('referido_premios')
          .select('id, descuento_pct, created_at, referido_id')
          .eq('referidor_id', user.id)
          .eq('barberia_id', barberiaId)
          .eq('canjeado', false)
          .eq('confirmado', true));
      } catch (_) {}

      try {
        descuentosMasivosRaw = List<Map<String, dynamic>>.from(await _db.from('descuentos_masivos')
          .select('id, descuento_pct, motivo, created_at')
          .eq('cliente_id', user.id)
          .eq('barberia_id', barberiaId)
          .eq('canjeado', false)
          .order('created_at', ascending: false));
      } catch (_) {}

      try {
        historialRaw = List<Map<String, dynamic>>.from(await _db.from('reservas')
          .select('id, fecha_hora, estado, precio_final, calificacion, servicios(nombre), barberos(nombre)')
          .eq('cliente_id', user.id)
          .eq('barberia_id', barberiaId)
          .inFilter('estado', ['completada', 'cancelada'])
          .order('fecha_hora', ascending: false).limit(10));
      } catch (_) {}

      // Enriquecer premios con nombre del referido
      final premiosEnriquecidos = <Map<String, dynamic>>[];
      for (final p in premiosRaw) {
        final referidoId = p['referido_id'] as String?;
        String referidoNombre = 'Un amigo';
        if (referidoId != null) {
          try {
            final referidoData = await _db.from('users')
              .select('nombre').eq('id', referidoId).maybeSingle();
            referidoNombre = referidoData?['nombre'] as String? ?? 'Un amigo';
          } catch (_) {}
        }
        premiosEnriquecidos.add({...p, 'referidoNombre': referidoNombre});
      }

      if (!mounted) return;
      final tieneReferido = userData?['referred_by_code'] != null;
      final pct = (barberia['referido_descuento_nuevo_cliente_pct'] as num?)?.toInt() ?? 0;
      final sinReservasCompletadas = historialRaw.where((r) => r['estado'] == 'completada').isEmpty;

      setState(() {
        _barberiaId = barberiaId;
        _barberiaNombre = barberia['nombre'];
        _descuentoReferidoPct = pct;
        _esNuevoReferido = tieneReferido && pct > 0 && sinReservasCompletadas;
        _userData = userData;
        _proximaCita = proximaCita;
        _sinCalificar = sinCalificar;
        _premios = premiosEnriquecidos;
        _descuentosMasivos = descuentosMasivosRaw;
        _historial = historialRaw;
      });
    } catch (_) {
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  Future<void> _cancelarCita(String reservaId) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1C1C1F),
        title: const Text('Cancelar cita', style: TextStyle(color: Colors.white)),
        content: const Text('¿Estás seguro de que quieres cancelar esta cita?',
          style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('No, volver', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Sí, cancelar', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirmar != true) return;

    try {
      await _db.from('reservas').update({'estado': 'cancelada'}).eq('id', reservaId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cita cancelada'), backgroundColor: Color(0xFF27272A)),
      );
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al cancelar: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _calificarCita(String reservaId, int estrellas) async {
    try {
      final user = _db.auth.currentUser;
      if (user == null) return;

      await _db.from('reservas')
        .update({'calificacion': estrellas})
        .eq('id', reservaId)
        .eq('cliente_id', user.id);

      // Confirmar premios de referido pendientes para quien nos invitó
      if (_barberiaId != null) {
        try {
          await _db.from('referido_premios')
            .update({'confirmado': true})
            .eq('referido_id', user.id)
            .eq('barberia_id', _barberiaId!)
            .eq('confirmado', false)
            .eq('canjeado', false);
        } catch (_) {}
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('¡Gracias por tu calificación!'), backgroundColor: Color(0xFF27272A)),
      );
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _mostrarCalificacion(String reservaId, String servicio, String barbero) {
    int estrellasTemp = 0;
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1C1C1F),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.fromLTRB(24, 16, 24, MediaQuery.of(ctx).padding.bottom + 24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(
              color: Colors.white24, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 20),
            const Text('¿Cómo fue tu experiencia?',
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('$servicio · $barbero',
              style: const TextStyle(color: Colors.white54, fontSize: 13)),
            const SizedBox(height: 24),
            Row(mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (i) {
                final star = i + 1;
                return GestureDetector(
                  onTap: () => setModalState(() => estrellasTemp = star),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: Icon(
                      estrellasTemp >= star ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: const Color(0xFFFACC15),
                      size: 44,
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: estrellasTemp == 0 ? null : () {
                Navigator.pop(ctx);
                _calificarCita(reservaId, estrellasTemp);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFACC15),
                foregroundColor: Colors.black,
                disabledBackgroundColor: const Color(0xFF3F3F46),
                minimumSize: const Size(double.infinity, 52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(
                estrellasTemp == 0 ? 'Selecciona una calificación' : 'Enviar calificación',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  String _formatFecha(String iso) {
    final dt = DateTime.parse(iso).toLocal();
    return DateFormat("EEEE d 'de' MMMM · HH:mm", 'es').format(dt);
  }

  Widget _buildEstrellas(int calificacion) {
    return Row(mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) => Icon(
        calificacion > i ? Icons.star_rounded : Icons.star_outline_rounded,
        color: const Color(0xFFFACC15),
        size: 16,
      )),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Color(0xFF09090B),
        body: Center(child: CircularProgressIndicator(color: Color(0xFFFACC15))),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFFFACC15),
          onRefresh: _load,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

              // Header
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
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => const LoginScreen()));
                  },
                ),
              ]),
              const SizedBox(height: 24),

              // Banner descuento por referido (primera cita)
              if (_esNuevoReferido) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF14532D), Color(0xFF166534)]),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.green.withValues(alpha: 0.5)),
                  ),
                  child: Row(children: [
                    const Text('🎁', style: TextStyle(fontSize: 28)),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('$_descuentoReferidoPct% de descuento en tu primera cita',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                      const SizedBox(height: 2),
                      const Text('Se aplica automáticamente al reservar',
                        style: TextStyle(color: Colors.green, fontSize: 12)),
                    ])),
                  ]),
                ),
              ],

              // Card calificación pendiente
              if (_sinCalificar != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1C1C1F),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFACC15).withValues(alpha: 0.5)),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Row(children: [
                      Icon(Icons.star_rounded, color: Color(0xFFFACC15), size: 18),
                      SizedBox(width: 8),
                      Text('¿Cómo estuvo tu cita?',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                    ]),
                    const SizedBox(height: 4),
                    Text(
                      '${(_sinCalificar!['servicios'] as Map?)?['nombre'] ?? 'Servicio'} · ${(_sinCalificar!['barberos'] as Map?)?['nombre'] ?? ''}',
                      style: const TextStyle(color: Colors.white54, fontSize: 13),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => _mostrarCalificacion(
                          _sinCalificar!['id'] as String,
                          (_sinCalificar!['servicios'] as Map?)?['nombre'] ?? '',
                          (_sinCalificar!['barberos'] as Map?)?['nombre'] ?? '',
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFACC15),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Calificar mi cita',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ]),
                ),
              ],

              // Próxima cita
              if (_proximaCita != null) ...[
                const Text('TU PRÓXIMA CITA',
                  style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
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
                      Expanded(child: Text(_formatFecha(_proximaCita!['fecha_hora']),
                        style: const TextStyle(color: Color(0xFFFACC15), fontSize: 13, fontWeight: FontWeight.w600))),
                    ]),
                    const SizedBox(height: 4),
                    Text(
                      '\$${NumberFormat('#,###', 'es_CL').format(_proximaCita!['precio_final'] ?? 0)}',
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                    const SizedBox(height: 12),
                    Row(children: [
                      Expanded(
                        child: TextButton.icon(
                          onPressed: () async {
                            final cita = _proximaCita!;
                            final result = await Navigator.of(context).push(MaterialPageRoute(
                              builder: (_) => CambiarCitaScreen(
                                reservaId: cita['id'] as String,
                                barberoId: cita['barbero_id'] as String,
                                barberiaId: cita['barberia_id'] as String,
                                duracionMin: (cita['servicios'] as Map?)?['duracion_min'] as int? ?? 30,
                                servicioNombre: (cita['servicios'] as Map?)?['nombre'] ?? '',
                                barberoNombre: (cita['barberos'] as Map?)?['nombre'] ?? '',
                              ),
                            ));
                            if (result == true) _load();
                          },
                          icon: const Icon(Icons.edit_calendar_outlined, size: 15, color: Color(0xFFFACC15)),
                          label: const Text('Cambiar hora',
                            style: TextStyle(color: Color(0xFFFACC15), fontSize: 12)),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                              side: const BorderSide(color: Color(0xFFFACC15), width: 0.5),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextButton.icon(
                          onPressed: () => _cancelarCita(_proximaCita!['id'] as String),
                          icon: const Icon(Icons.cancel_outlined, size: 15, color: Colors.red),
                          label: const Text('Cancelar',
                            style: TextStyle(color: Colors.red, fontSize: 12)),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                              side: const BorderSide(color: Colors.red, width: 0.5),
                            ),
                          ),
                        ),
                      ),
                    ]),
                  ]),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context)
                    .push(MaterialPageRoute(builder: (_) => const ReservarScreen()))
                    .then((_) => _load()),
                  icon: const Icon(Icons.add, color: Color(0xFFFACC15), size: 18),
                  label: const Text('Nueva reserva', style: TextStyle(color: Color(0xFFFACC15))),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFFACC15), width: 1),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    minimumSize: const Size(double.infinity, 44),
                  ),
                ),
                const SizedBox(height: 20),
              ] else ...[
                GestureDetector(
                  onTap: () => Navigator.of(context)
                    .push(MaterialPageRoute(builder: (_) => const ReservarScreen()))
                    .then((_) => _load()),
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
                      Text('Reservar hora',
                        style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 17)),
                    ]),
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Descuentos masivos
              if (_descuentosMasivos.isNotEmpty) ...[
                const Text('DESCUENTOS DISPONIBLES',
                  style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1C1C1F),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFACC15).withValues(alpha: 0.3)),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Row(children: [
                      Text('🎁', style: TextStyle(fontSize: 20)),
                      SizedBox(width: 8),
                      Text('Tienes descuentos disponibles',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ]),
                    const SizedBox(height: 8),
                    ..._descuentosMasivos.map((d) => Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('${d['descuento_pct']}% de descuento',
                            style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.bold, fontSize: 16)),
                          if ((d['motivo'] as String?)?.isNotEmpty == true)
                            Text(d['motivo'] as String,
                              style: const TextStyle(color: Colors.white54, fontSize: 12)),
                        ])),
                        const Text('Se aplica al reservar',
                          style: TextStyle(color: Colors.white38, fontSize: 11)),
                      ]),
                    )),
                  ]),
                ),
                const SizedBox(height: 20),
              ],

              // Premios por referidos
              if (_premios.isNotEmpty) ...[
                const Text('TUS PREMIOS',
                  style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1C1C1F),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start,
                    children: _premios.map((p) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('🎁', style: TextStyle(fontSize: 24)),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('${p['descuento_pct']}% de descuento',
                            style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 16)),
                          RichText(text: TextSpan(
                            style: const TextStyle(color: Colors.white70, fontSize: 13),
                            children: [
                              const TextSpan(text: 'Tu amigo '),
                              TextSpan(
                                text: p['referidoNombre'] as String? ?? 'Un amigo',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                              ),
                              const TextSpan(text: ' ya se atendió'),
                            ],
                          )),
                          const SizedBox(height: 2),
                          const Text('Se aplica automáticamente en tu próxima reserva',
                            style: TextStyle(color: Colors.white38, fontSize: 11)),
                        ])),
                      ]),
                    )).toList(),
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Código de referido
              if (_userData?['referral_code'] != null) ...[
                const Text('INVITA A UN AMIGO',
                  style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1C1C1F),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFF3F3F46)),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text(
                      'Comparte tu código y gana descuentos cuando tus amigos se atiendan',
                      style: TextStyle(color: Colors.white54, fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _userData!['referral_code'] as String,
                      style: const TextStyle(
                        color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 4),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          final code = _userData!['referral_code'] as String;
                          const apkUrl = 'https://github.com/sebava1989-bot/capitalhumano-web/releases/download/v1.0.0-cliente/app-release.apk';
                          final webUrl = 'https://barberia-saas-gamma.vercel.app/$barberiaSlug?ref=$code';
                          final descTxt = _descuentoReferidoPct > 0
                            ? '$_descuentoReferidoPct% de descuento' : 'un descuento';
                          final texto = Uri.encodeComponent(
                            '✂️ *$_barberiaNombre* — Reserva tu hora fácil\n\n'
                            '👇 USA MI CÓDIGO Y GANA *$descTxt* EN TU PRIMERA CITA:\n\n'
                            '🔑 *$code*\n\n'
                            '📱 Descarga la app (Android):\n$apkUrl\n\n'
                            'Al registrarte ingresa el código *$code* y el descuento se aplica solo.\n\n'
                            '🍎 iPhone: $webUrl'
                          );
                          launchUrl(
                            Uri.parse('https://wa.me/?text=$texto'),
                            mode: LaunchMode.externalApplication,
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF25D366),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: const Icon(Icons.share, size: 18),
                        label: const Text('Invitar por WhatsApp',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      ),
                    ),
                  ]),
                ),
                const SizedBox(height: 20),
              ],

              // Historial
              if (_historial.isNotEmpty) ...[
                const Text('HISTORIAL',
                  style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
                const SizedBox(height: 8),
                ..._historial.map((r) {
                  final esCompletada = r['estado'] == 'completada';
                  final calificacion = r['calificacion'] as int?;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1C1C1F),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text((r['servicios'] as Map?)?['nombre'] ?? '',
                            style: const TextStyle(color: Colors.white70, fontSize: 14,
                              fontWeight: FontWeight.w500)),
                          if ((r['barberos'] as Map?)?['nombre'] != null) ...[
                            const SizedBox(height: 2),
                            Text('✂️ ${(r['barberos'] as Map)['nombre']}',
                              style: const TextStyle(color: Colors.white38, fontSize: 12)),
                          ],
                          const SizedBox(height: 2),
                          Text(_formatFecha(r['fecha_hora']),
                            style: const TextStyle(color: Colors.white38, fontSize: 12)),
                        ])),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: esCompletada
                              ? Colors.green.withValues(alpha: 0.15)
                              : Colors.red.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            esCompletada ? '✓ Listo' : 'Cancelada',
                            style: TextStyle(
                              color: esCompletada ? Colors.green : Colors.red,
                              fontSize: 11, fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ]),
                      if (esCompletada) ...[
                        const SizedBox(height: 8),
                        if (calificacion != null)
                          _buildEstrellas(calificacion)
                        else
                          GestureDetector(
                            onTap: () => _mostrarCalificacion(
                              r['id'] as String,
                              (r['servicios'] as Map?)?['nombre'] ?? '',
                              (r['barberos'] as Map?)?['nombre'] ?? '',
                            ),
                            child: const Text('⭐ Calificar esta cita',
                              style: TextStyle(color: Color(0xFFFACC15), fontSize: 12)),
                          ),
                      ],
                    ]),
                  );
                }),
                const SizedBox(height: 20),
              ],

            ]),
          ),
        ),
      ),
    );
  }
}
