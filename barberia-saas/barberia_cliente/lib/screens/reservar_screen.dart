import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../config/supabase_config.dart';

class ReservarScreen extends StatefulWidget {
  const ReservarScreen({super.key});

  @override
  State<ReservarScreen> createState() => _ReservarScreenState();
}

class _ReservarScreenState extends State<ReservarScreen> {
  final _db = Supabase.instance.client;
  int _step = 0; // 0=barbero, 1=servicio, 2=fecha, 3=hora
  List<Map<String, dynamic>> _barberos = [];
  List<Map<String, dynamic>> _servicios = [];
  List<String> _slots = [];
  Map<String, dynamic>? _barberoSel;
  Map<String, dynamic>? _servicioSel;
  DateTime _fecha = DateTime.now();
  String? _horaSel;
  bool _loading = true;
  bool _sending = false;
  String? _barberiaId;

  @override
  void initState() {
    super.initState();
    _loadBarberos();
  }

  Future<void> _loadBarberos() async {
    final b = await _db.from('barberias').select('id').eq('slug', barberiaSlug).maybeSingle();
    if (b == null) return;
    _barberiaId = b['id'] as String;
    final list = await _db.from('barberos').select('id, nombre').eq('barberia_id', _barberiaId!).eq('activo', true).order('nombre');
    if (!mounted) return;
    setState(() { _barberos = List<Map<String, dynamic>>.from(list); _loading = false; });
  }

  Future<void> _loadServicios() async {
    setState(() { _loading = true; });
    final list = await _db.from('servicios').select('id, nombre, precio, duracion_min').eq('barberia_id', _barberiaId!).eq('activo', true).order('nombre');
    if (!mounted) return;
    setState(() { _servicios = List<Map<String, dynamic>>.from(list); _loading = false; });
  }

  Future<void> _loadSlots() async {
    if (_barberoSel == null || _servicioSel == null) return;
    setState(() { _loading = true; _slots = []; _horaSel = null; });

    final fechaStr = DateFormat('yyyy-MM-dd').format(_fecha);
    final disp = await _db.from('disponibilidad')
      .select('slots, inicio, fin')
      .eq('barbero_id', _barberoSel!['id'])
      .eq('barberia_id', _barberiaId!)
      .eq('fecha', fechaStr).maybeSingle();

    if (!mounted) return;
    if (disp == null) { setState(() { _loading = false; }); return; }

    final slots = (disp['slots'] as List?)?.map((s) => s['hora'] as String).toSet() ?? <String>{};
    final inicio = disp['inicio'] as String? ?? '09:00';
    final fin = disp['fin'] as String? ?? '18:00';
    final duracion = _servicioSel!['duracion_min'] as int? ?? 30;

    final available = <String>[];
    var current = _parseTime(inicio);
    final endTime = _parseTime(fin);
    while (current.isBefore(endTime)) {
      final slot = DateFormat('HH:mm').format(current);
      if (!slots.contains(slot)) available.add(slot);
      current = current.add(Duration(minutes: duracion));
    }
    setState(() { _slots = available; _loading = false; });
  }

  DateTime _parseTime(String t) {
    final parts = t.split(':');
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day, int.parse(parts[0]), int.parse(parts[1]));
  }

  Future<void> _confirmar() async {
    if (_barberoSel == null || _servicioSel == null || _horaSel == null) return;
    setState(() { _sending = true; });

    final user = _db.auth.currentUser!;
    final userData = await _db.from('users').select('nombre, referred_by_code').eq('id', user.id).maybeSingle();

    final fechaStr = DateFormat('yyyy-MM-dd').format(_fecha);
    final parts = _horaSel!.split(':');
    final fechaHora = DateTime.utc(_fecha.year, _fecha.month, _fecha.day, int.parse(parts[0]), int.parse(parts[1]));

    // Verificar descuentos
    int descuento = 0;
    final refCode = userData?['referred_by_code'] as String?;
    if (refCode != null) {
      final prevRes = await _db.from('reservas')
        .select('id')
        .eq('cliente_id', user.id)
        .eq('barberia_id', _barberiaId!)
        .neq('estado', 'cancelada');
      if ((prevRes as List).isEmpty) {
        final barberiaConf = await _db.from('barberias')
          .select('referido_descuento_nuevo_cliente_pct')
          .eq('id', _barberiaId!).maybeSingle();
        final pct = (barberiaConf?['referido_descuento_nuevo_cliente_pct'] as num?)?.toInt() ?? 0;
        if (pct > 0) descuento += ((_servicioSel!['precio'] as int) * pct ~/ 100);
      }
    }

    final precio = _servicioSel!['precio'] as int;
    final precioFinal = precio - descuento;

    await _db.from('reservas').insert({
      'barberia_id': _barberiaId,
      'cliente_id': user.id,
      'barbero_id': _barberoSel!['id'],
      'servicio_id': _servicioSel!['id'],
      'fecha_hora': fechaHora.toIso8601String(),
      'precio': precio,
      'descuento': descuento,
      'precio_final': precioFinal,
      'estado': 'confirmada',
      'origen': 'app_cliente',
      'ref_code': refCode,
      'cliente_email': user.email,
      'cliente_nombre': userData?['nombre'] ?? user.email?.split('@')[0],
    });

    // Marcar slot como ocupado
    final disp = await _db.from('disponibilidad').select('id, slots')
      .eq('barbero_id', _barberoSel!['id'])
      .eq('barberia_id', _barberiaId!)
      .eq('fecha', fechaStr).maybeSingle();

    if (disp != null) {
      final slots = List<Map<String, dynamic>>.from(disp['slots'] ?? []);
      slots.add({'hora': _horaSel, 'reserva_id': 'app'});
      await _db.from('disponibilidad').update({'slots': slots}).eq('id', disp['id']);
    }

    if (!mounted) return;
    setState(() { _sending = false; });
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(descuento > 0 ? '✅ Reserva confirmada — \$${precioFinal.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')} con descuento' : '✅ Reserva confirmada'),
        backgroundColor: const Color(0xFF27272A),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF09090B),
        title: Text(['Elige barbero', 'Elige servicio', 'Elige fecha', 'Elige hora'][_step],
          style: const TextStyle(color: Colors.white, fontSize: 17)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator(color: Color(0xFFFACC15)))
        : _buildStep(),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0: return _lista(_barberos, 'nombre', (b) {
        setState(() { _barberoSel = b; _step = 1; });
        _loadServicios();
      });
      case 1: return _lista(_servicios, 'nombre', (s) {
        setState(() { _servicioSel = s; _step = 2; });
      }, subtitle: (s) => '\$${s['precio'].toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]}.')}');
      case 2: return _calendarioSimple();
      case 3: return _horasGrid();
      default: return const SizedBox();
    }
  }

  Widget _lista(List<Map<String, dynamic>> items, String key, Function(Map<String, dynamic>) onTap, {String Function(Map<String, dynamic>)? subtitle}) {
    if (items.isEmpty) {
      return const Center(child: Text('No hay opciones disponibles', style: TextStyle(color: Colors.white54)));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (_, i) {
        final item = items[i];
        return ListTile(
          title: Text(item[key], style: const TextStyle(color: Colors.white)),
          subtitle: subtitle != null ? Text(subtitle(item), style: const TextStyle(color: Color(0xFFFACC15))) : null,
          trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 16),
          tileColor: const Color(0xFF1C1C1F),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          onTap: () => onTap(item),
        ).withMargin();
      },
    );
  }

  Widget _calendarioSimple() {
    final dias = List.generate(14, (i) => DateTime.now().add(Duration(days: i + 1)));
    return Column(children: [
      Expanded(child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: dias.length,
        itemBuilder: (_, i) {
          final d = dias[i];
          final label = DateFormat("EEEE d 'de' MMMM", 'es').format(d);
          return ListTile(
            title: Text(label, style: const TextStyle(color: Colors.white)),
            tileColor: const Color(0xFF1C1C1F),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 16),
            onTap: () {
              setState(() { _fecha = d; _step = 3; });
              _loadSlots();
            },
          ).withMargin();
        },
      )),
    ]);
  }

  Widget _horasGrid() {
    if (_slots.isEmpty) {
      return const Center(child: Padding(
        padding: EdgeInsets.all(24),
        child: Text('Sin horas disponibles para este día.\nElige otra fecha.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white54, fontSize: 15)),
      ));
    }
    return Column(children: [
      Expanded(
        child: GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 4, mainAxisSpacing: 10, crossAxisSpacing: 10, childAspectRatio: 2),
          itemCount: _slots.length,
          itemBuilder: (_, i) {
            final slot = _slots[i];
            final sel = slot == _horaSel;
            return GestureDetector(
              onTap: () => setState(() => _horaSel = slot),
              child: Container(
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: sel ? const Color(0xFFFACC15) : const Color(0xFF27272A),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(slot, style: TextStyle(color: sel ? Colors.black : Colors.white, fontWeight: FontWeight.bold)),
              ),
            );
          },
        ),
      ),
      Padding(
        padding: const EdgeInsets.all(16),
        child: ElevatedButton(
          onPressed: _horaSel == null || _sending ? null : _confirmar,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFACC15),
            foregroundColor: Colors.black,
            minimumSize: const Size(double.infinity, 52),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: _sending
            ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2)
            : Text(_horaSel == null ? 'Selecciona una hora' : 'Confirmar reserva — $_horaSel',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        ),
      ),
    ]);
  }
}

extension on Widget {
  Widget withMargin() => Padding(padding: const EdgeInsets.only(bottom: 8), child: this);
}
