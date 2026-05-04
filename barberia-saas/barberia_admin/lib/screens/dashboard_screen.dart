import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/reservas_service.dart';

class DashboardScreen extends StatefulWidget {
  final String barberiaId;
  const DashboardScreen({super.key, required this.barberiaId});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _service = ReservasService();
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final stats = await _service.getStatsHoy(widget.barberiaId);
    if (!mounted) return;
    setState(() {
      _stats = stats;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final fecha =
        DateFormat("EEEE d 'de' MMMM", 'es').format(DateTime.now());
    return Scaffold(
      appBar: AppBar(
        title: const Text('Barbería Admin'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFFACC15)))
          : RefreshIndicator(
              color: const Color(0xFFFACC15),
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Text(
                    fecha.toUpperCase(),
                    style: const TextStyle(
                        color: Color(0xFFA1A1AA),
                        fontSize: 12,
                        letterSpacing: 1),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Resumen de hoy',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 24),
                  Row(children: [
                    _StatCard(
                        label: 'Citas hoy',
                        value: '${_stats?['total'] ?? 0}',
                        icon: Icons.calendar_today,
                        color: const Color(0xFFFACC15)),
                    const SizedBox(width: 12),
                    _StatCard(
                        label: 'Pendientes',
                        value: '${_stats?['pendientes'] ?? 0}',
                        icon: Icons.pending_outlined,
                        color: Colors.orange),
                  ]),
                  const SizedBox(height: 12),
                  _StatCard(
                    label: 'Ingresos del día',
                    value:
                        '\$${NumberFormat('#,###', 'es_CL').format(_stats?['ingresos'] ?? 0)}',
                    icon: Icons.attach_money,
                    color: Colors.greenAccent,
                    wide: true,
                  ),
                ],
              ),
            ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final bool wide;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.wide = false,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF2D2D31),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: color.withValues(alpha: 0.15), blurRadius: 20, spreadRadius: 1),
        ],
        border: Border.fromBorderSide(
          BorderSide(color: color.withValues(alpha: 0.3), width: 1),
        ),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 12),
        Text(value, style: TextStyle(color: color, fontSize: 28, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 13)),
      ]),
    );
    return Expanded(child: card);
  }
}
