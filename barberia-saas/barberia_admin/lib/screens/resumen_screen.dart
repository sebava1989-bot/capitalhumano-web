import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/resumen_service.dart';

class ResumenScreen extends StatefulWidget {
  final String barberiaId;
  const ResumenScreen({super.key, required this.barberiaId});
  @override
  State<ResumenScreen> createState() => _ResumenScreenState();
}

class _ResumenScreenState extends State<ResumenScreen>
    with SingleTickerProviderStateMixin {
  final _service = ResumenService();
  List<BarberoResumen> _barberos = [];
  bool _loading = true;
  late TabController _tabs;

  final _fmt = NumberFormat('#,###', 'es_CL');

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await _service.getResumen(widget.barberiaId);
    if (!mounted) return;
    setState(() {
      _barberos = data;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final lunes = now.subtract(Duration(days: now.weekday - 1));
    final domingo = lunes.add(const Duration(days: 6));
    final semanaLabel =
        '${DateFormat('d MMM', 'es').format(lunes)} – ${DateFormat('d MMM', 'es').format(domingo)}';
    final mesLabel = DateFormat('MMMM yyyy', 'es').format(now);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Resumen ejecutivo'),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _load)],
        bottom: TabBar(
          controller: _tabs,
          indicatorColor: const Color(0xFFFACC15),
          labelColor: const Color(0xFFFACC15),
          unselectedLabelColor: const Color(0xFFA1A1AA),
          tabs: [
            Tab(text: 'Semana\n$semanaLabel'),
            Tab(text: 'Mes\n${mesLabel[0].toUpperCase()}${mesLabel.substring(1)}'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFFACC15)))
          : TabBarView(
              controller: _tabs,
              children: [
                _buildSemana(),
                _buildMes(),
              ],
            ),
    );
  }

  Widget _buildSemana() {
    final totalCitas = _barberos.fold(0, (s, b) => s + b.citasSemana);
    final totalIngresos = _barberos.fold(0.0, (s, b) => s + b.ingresosSemana);
    final maxIngresos = _barberos.isEmpty
        ? 1.0
        : _barberos.map((b) => b.ingresosSemana).reduce((a, b) => a > b ? a : b).clamp(1.0, double.infinity);

    return RefreshIndicator(
      color: const Color(0xFFFACC15),
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Totales
          Row(children: [
            _TotalCard(label: 'Ingresos semana', value: '\$${_fmt.format(totalIngresos)}', color: const Color(0xFFFACC15)),
            const SizedBox(width: 12),
            _TotalCard(label: 'Citas completadas', value: '$totalCitas', color: Colors.greenAccent),
          ]),
          const SizedBox(height: 20),
          const Text('POR BARBERO', style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 11, letterSpacing: 1)),
          const SizedBox(height: 10),
          if (_barberos.isEmpty)
            const Center(child: Padding(
              padding: EdgeInsets.all(32),
              child: Text('Sin datos esta semana', style: TextStyle(color: Color(0xFFA1A1AA))),
            ))
          else
            ..._barberos.map((b) => _BarberoSemanaCard(b: b, maxIngresos: maxIngresos, fmt: _fmt)),
        ],
      ),
    );
  }

  Widget _buildMes() {
    final totalCitas = _barberos.fold(0, (s, b) => s + b.citasMes);
    final totalIngresos = _barberos.fold(0.0, (s, b) => s + b.ingresosMes);
    final maxCitas = _barberos.isEmpty ? 1 : _barberos.map((b) => b.citasMes).reduce((a, b) => a > b ? a : b).clamp(1, 9999);

    return RefreshIndicator(
      color: const Color(0xFFFACC15),
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(children: [
            _TotalCard(label: 'Ingresos del mes', value: '\$${_fmt.format(totalIngresos)}', color: const Color(0xFFFACC15)),
            const SizedBox(width: 12),
            _TotalCard(label: 'Citas completadas', value: '$totalCitas', color: Colors.greenAccent),
          ]),
          const SizedBox(height: 20),
          const Text('POR BARBERO', style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 11, letterSpacing: 1)),
          const SizedBox(height: 10),
          if (_barberos.isEmpty)
            const Center(child: Padding(
              padding: EdgeInsets.all(32),
              child: Text('Sin datos este mes', style: TextStyle(color: Color(0xFFA1A1AA))),
            ))
          else
            ..._barberos.map((b) => _BarberoMesCard(b: b, maxCitas: maxCitas, fmt: _fmt)),
        ],
      ),
    );
  }
}

class _TotalCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _TotalCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF27272A),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withValues(alpha: 0.3)),
            boxShadow: [BoxShadow(color: color.withValues(alpha: 0.1), blurRadius: 12)],
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 11)),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.bold)),
          ]),
        ),
      );
}

class _BarberoSemanaCard extends StatelessWidget {
  final BarberoResumen b;
  final double maxIngresos;
  final NumberFormat fmt;
  const _BarberoSemanaCard({required this.b, required this.maxIngresos, required this.fmt});

  @override
  Widget build(BuildContext context) {
    final pct = b.ingresosSemana / maxIngresos;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF27272A),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF3F3F46)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: const Color(0xFF3F3F46),
            child: Text(b.nombre[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(b.nombre, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
          ),
          Text('\$${fmt.format(b.ingresosSemana)}',
              style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.bold, fontSize: 16)),
        ]),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 6,
            backgroundColor: const Color(0xFF3F3F46),
            valueColor: AlwaysStoppedAnimation<Color>(
              pct >= 0.8 ? Colors.greenAccent : pct >= 0.5 ? const Color(0xFFFACC15) : const Color(0xFF3B82F6),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text('${b.citasSemana} cita${b.citasSemana != 1 ? 's' : ''} esta semana',
            style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 12)),
      ]),
    );
  }
}

class _BarberoMesCard extends StatelessWidget {
  final BarberoResumen b;
  final int maxCitas;
  final NumberFormat fmt;
  const _BarberoMesCard({required this.b, required this.maxCitas, required this.fmt});

  @override
  Widget build(BuildContext context) {
    final pct = b.citasMes / maxCitas;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF27272A),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF3F3F46)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: const Color(0xFF3F3F46),
            child: Text(b.nombre[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(b.nombre, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
              Text('${b.citasMes} cita${b.citasMes != 1 ? 's' : ''}',
                  style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 12)),
            ]),
          ),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('\$${fmt.format(b.ingresosMes)}',
                style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.bold, fontSize: 16)),
            if (b.citasMes > 0)
              Text('prom \$${fmt.format(b.promedioPorCitaMes.round())}',
                  style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 11)),
          ]),
        ]),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 6,
            backgroundColor: const Color(0xFF3F3F46),
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFFACC15)),
          ),
        ),
      ]),
    );
  }
}
