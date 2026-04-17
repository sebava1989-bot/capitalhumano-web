import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../services/progress_storage.dart';
import '../theme/app_theme.dart';

class ProgressScreen extends StatefulWidget {
  const ProgressScreen({super.key});
  @override
  State<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends State<ProgressScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<WeightEntry> _weights = [];
  List<MeasurementEntry> _measures = [];
  double? _goalKg;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  Future<void> _load() async {
    final w = await ProgressStorage.getWeights();
    final m = await ProgressStorage.getMeasurements();
    final g = await ProgressStorage.getWeightGoal();
    if (mounted) setState(() { _weights = w; _measures = m; _goalKg = g; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.secondary,
      body: NestedScrollView(
        headerSliverBuilder: (_, __) => [
          SliverAppBar(
            expandedHeight: 150,
            pinned: true,
            backgroundColor: AppTheme.secondary,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF6A1B9A), Color(0xFF38006B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(32),
                    bottomRight: Radius.circular(32),
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(22, 16, 22, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('📈 Mi Progreso', style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800)),
                        SizedBox(height: 4),
                        Text('Peso y medidas corporales', style: TextStyle(color: Colors.white70, fontSize: 14)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            bottom: TabBar(
              controller: _tabs,
              indicatorColor: AppTheme.primary,
              labelColor: AppTheme.primary,
              unselectedLabelColor: AppTheme.textSecondary,
              labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              tabs: const [
                Tab(text: 'Peso'),
                Tab(text: 'Medidas'),
              ],
            ),
          ),
        ],
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            : TabBarView(
                controller: _tabs,
                children: [
                  _WeightTab(weights: _weights, goalKg: _goalKg, onRefresh: _load),
                  _MeasuresTab(measures: _measures, onRefresh: _load),
                ],
              ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primary,
        onPressed: () {
          if (_tabs.index == 0) _showAddWeight();
          else _showAddMeasures();
        },
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  // ── AGREGAR PESO ──────────────────────────────────────
  void _showAddWeight() {
    final kgCtrl = TextEditingController();
    final noteCtrl = TextEditingController();
    DateTime selectedDate = DateTime.now();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setS) {
        return Padding(
          padding: EdgeInsets.fromLTRB(24, 20, 24, MediaQuery.of(ctx).viewInsets.bottom + 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Registrar peso', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: _FpField(
                      controller: kgCtrl,
                      label: 'Peso (kg)',
                      hint: '75.5',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 3,
                    child: GestureDetector(
                      onTap: () async {
                        final d = await showDatePicker(
                          context: ctx,
                          initialDate: selectedDate,
                          firstDate: DateTime(2020),
                          lastDate: DateTime.now(),
                          builder: (_, child) => Theme(
                            data: ThemeData.dark().copyWith(colorScheme: const ColorScheme.dark(primary: AppTheme.primary)),
                            child: child!,
                          ),
                        );
                        if (d != null) setS(() => selectedDate = d);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                        decoration: BoxDecoration(
                          color: AppTheme.secondary,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.divider),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.calendar_today, color: AppTheme.textSecondary, size: 16),
                            const SizedBox(width: 8),
                            Text(DateFormat('dd MMM yyyy', 'es').format(selectedDate),
                                style: const TextStyle(color: Colors.white, fontSize: 14)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _FpField(controller: noteCtrl, label: 'Nota (opcional)', hint: 'Ej: Después del entrenamiento'),
              const SizedBox(height: 20),
              // Meta de peso
              GestureDetector(
                onTap: () => _showSetGoal(ctx),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.flag_outlined, color: AppTheme.primary, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        _goalKg != null ? 'Meta: $_goalKg kg · Toca para cambiar' : 'Establecer meta de peso',
                        style: const TextStyle(color: AppTheme.primary, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    final kg = double.tryParse(kgCtrl.text.replaceAll(',', '.'));
                    if (kg == null || kg <= 0) return;
                    await ProgressStorage.saveWeight(WeightEntry(
                      id: DateTime.now().millisecondsSinceEpoch.toString(),
                      date: selectedDate,
                      kg: kg,
                      note: noteCtrl.text.isEmpty ? null : noteCtrl.text,
                    ));
                    Navigator.pop(ctx);
                    _load();
                  },
                  child: const Text('Guardar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  void _showSetGoal(BuildContext parentCtx) {
    final ctrl = TextEditingController(text: _goalKg?.toString() ?? '');
    showDialog(
      context: parentCtx,
      builder: (_) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: const Text('Meta de peso (kg)', style: TextStyle(color: Colors.white)),
        content: TextField(
          controller: ctrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(hintText: 'Ej: 70', hintStyle: TextStyle(color: AppTheme.textSecondary)),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar', style: TextStyle(color: AppTheme.textSecondary))),
          TextButton(
            onPressed: () async {
              final g = double.tryParse(ctrl.text.replaceAll(',', '.'));
              if (g != null) {
                await ProgressStorage.setWeightGoal(g);
                setState(() => _goalKg = g);
              }
              Navigator.pop(context);
            },
            child: const Text('Guardar', style: TextStyle(color: AppTheme.primary)),
          ),
        ],
      ),
    );
  }

  // ── AGREGAR MEDIDAS ────────────────────────────────────
  void _showAddMeasures() {
    final Map<String, TextEditingController> ctrls = {
      'cintura': TextEditingController(),
      'pecho': TextEditingController(),
      'cadera': TextEditingController(),
      'brazoDer': TextEditingController(),
      'muslo': TextEditingController(),
      'cuello': TextEditingController(),
    };
    DateTime selectedDate = DateTime.now();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setS) {
        return SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(24, 20, 24, MediaQuery.of(ctx).viewInsets.bottom + 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Registrar medidas', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              const Text('Ingresa solo las que quieras registrar (en cm)', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
              const SizedBox(height: 16),
              GestureDetector(
                onTap: () async {
                  final d = await showDatePicker(
                    context: ctx, initialDate: selectedDate,
                    firstDate: DateTime(2020), lastDate: DateTime.now(),
                    builder: (_, child) => Theme(
                      data: ThemeData.dark().copyWith(colorScheme: const ColorScheme.dark(primary: AppTheme.primary)),
                      child: child!,
                    ),
                  );
                  if (d != null) setS(() => selectedDate = d);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.secondary,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.divider),
                  ),
                  child: Row(children: [
                    const Icon(Icons.calendar_today, color: AppTheme.textSecondary, size: 16),
                    const SizedBox(width: 8),
                    Text(DateFormat('dd MMM yyyy', 'es').format(selectedDate),
                        style: const TextStyle(color: Colors.white, fontSize: 14)),
                  ]),
                ),
              ),
              ...[
                ('cintura', '👗 Cintura', 'cm'),
                ('pecho', '💪 Pecho', 'cm'),
                ('cadera', '🩳 Cadera', 'cm'),
                ('brazoDer', '💪 Brazo', 'cm'),
                ('muslo', '🦵 Muslo', 'cm'),
                ('cuello', '🔵 Cuello', 'cm'),
              ].map((t) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _FpField(
                  controller: ctrls[t.$1]!,
                  label: t.$2,
                  hint: '0.0 ${t.$3}',
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                ),
              )),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    double? v(String k) => double.tryParse(ctrls[k]!.text.replaceAll(',', '.'));
                    final entry = MeasurementEntry(
                      id: DateTime.now().millisecondsSinceEpoch.toString(),
                      date: selectedDate,
                      cintura: v('cintura'), pecho: v('pecho'), cadera: v('cadera'),
                      brazoDer: v('brazoDer'), muslo: v('muslo'), cuello: v('cuello'),
                    );
                    await ProgressStorage.saveMeasurement(entry);
                    Navigator.pop(ctx);
                    _load();
                  },
                  child: const Text('Guardar medidas', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}

// ══════════════════════════════════════════════════════
//  TAB PESO
// ══════════════════════════════════════════════════════
class _WeightTab extends StatelessWidget {
  final List<WeightEntry> weights;
  final double? goalKg;
  final VoidCallback onRefresh;
  const _WeightTab({required this.weights, required this.goalKg, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    if (weights.isEmpty) {
      return _EmptyState(
        emoji: '⚖️',
        title: 'Sin registros de peso',
        subtitle: 'Toca + para agregar tu primer registro',
      );
    }

    final first = weights.first;
    final last = weights.last;
    final diff = last.kg - first.kg;
    final minKg = weights.map((e) => e.kg).reduce((a, b) => a < b ? a : b);
    final maxKg = weights.map((e) => e.kg).reduce((a, b) => a > b ? a : b);

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
      children: [
        // Stats rápidas
        Row(children: [
          _StatCard('Actual', '${last.kg} kg', AppTheme.primary),
          const SizedBox(width: 10),
          _StatCard('Inicial', '${first.kg} kg', AppTheme.textSecondary),
          const SizedBox(width: 10),
          _StatCard('Cambio', '${diff >= 0 ? '+' : ''}${diff.toStringAsFixed(1)} kg',
              diff < 0 ? AppTheme.success : diff > 0 ? Colors.orange : AppTheme.textSecondary),
        ]),

        if (goalKg != null) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
            ),
            child: Row(children: [
              const Icon(Icons.flag, color: AppTheme.primary, size: 18),
              const SizedBox(width: 8),
              Text('Meta: $goalKg kg · Faltan ${(last.kg - goalKg!).abs().toStringAsFixed(1)} kg',
                  style: const TextStyle(color: AppTheme.primary, fontSize: 13, fontWeight: FontWeight.w600)),
            ]),
          ),
        ],

        const SizedBox(height: 20),

        // Gráfico
        Container(
          padding: const EdgeInsets.fromLTRB(12, 20, 20, 12),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppTheme.divider),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(left: 8, bottom: 16),
                child: Text('Evolución de peso', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
              ),
              SizedBox(
                height: 180,
                child: LineChart(
                  LineChartData(
                    gridData: FlGridData(
                      show: true,
                      getDrawingHorizontalLine: (_) => FlLine(color: AppTheme.divider, strokeWidth: 0.5),
                      drawVerticalLine: false,
                    ),
                    titlesData: FlTitlesData(
                      leftTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 40,
                          getTitlesWidget: (v, _) => Text('${v.toInt()}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10)),
                        ),
                      ),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 28,
                          interval: weights.length <= 7 ? 1 : (weights.length / 5).ceilToDouble(),
                          getTitlesWidget: (v, _) {
                            final i = v.toInt();
                            if (i < 0 || i >= weights.length) return const SizedBox();
                            return Text(
                              DateFormat('d/M').format(weights[i].date),
                              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 9),
                            );
                          },
                        ),
                      ),
                      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    ),
                    borderData: FlBorderData(show: false),
                    minY: minKg - 2,
                    maxY: maxKg + 2,
                    lineBarsData: [
                      LineChartBarData(
                        spots: weights.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value.kg)).toList(),
                        isCurved: true,
                        color: AppTheme.primary,
                        barWidth: 3,
                        dotData: FlDotData(
                          show: true,
                          getDotPainter: (_, __, ___, ____) => FlDotCirclePainter(
                            radius: 4, color: AppTheme.primary, strokeWidth: 2, strokeColor: Colors.white,
                          ),
                        ),
                        belowBarData: BarAreaData(
                          show: true,
                          color: AppTheme.primary.withOpacity(0.1),
                        ),
                      ),
                      if (goalKg != null)
                        LineChartBarData(
                          spots: [FlSpot(0, goalKg!), FlSpot((weights.length - 1).toDouble(), goalKg!)],
                          isCurved: false,
                          color: AppTheme.success.withOpacity(0.6),
                          barWidth: 1.5,
                          dashArray: [6, 4],
                          dotData: const FlDotData(show: false),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),
        const Text('Historial', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),

        ...weights.reversed.map((e) => Dismissible(
          key: Key(e.id),
          direction: DismissDirection.endToStart,
          background: Container(
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(color: Colors.red.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
            alignment: Alignment.centerRight,
            padding: const EdgeInsets.only(right: 16),
            child: const Icon(Icons.delete_outline, color: Colors.red),
          ),
          onDismissed: (_) async {
            await ProgressStorage.deleteWeight(e.id);
            onRefresh();
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.divider),
            ),
            child: Row(children: [
              const Text('⚖️', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 12),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(DateFormat('EEEE d \'de\' MMMM', 'es').format(e.date),
                      style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                  if (e.note != null) Text(e.note!, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                ],
              )),
              Text('${e.kg} kg', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
            ]),
          ),
        )),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════
//  TAB MEDIDAS
// ══════════════════════════════════════════════════════
class _MeasuresTab extends StatelessWidget {
  final List<MeasurementEntry> measures;
  final VoidCallback onRefresh;
  const _MeasuresTab({required this.measures, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    if (measures.isEmpty) {
      return _EmptyState(
        emoji: '📏',
        title: 'Sin medidas registradas',
        subtitle: 'Toca + para agregar tu primera medición',
      );
    }

    final last = measures.last;
    final first = measures.first;

    final fields = [
      ('cintura', '👗 Cintura', last.cintura, first.cintura),
      ('pecho', '💪 Pecho', last.pecho, first.pecho),
      ('cadera', '🩳 Cadera', last.cadera, first.cadera),
      ('brazoDer', '💪 Brazo', last.brazoDer, first.brazoDer),
      ('muslo', '🦵 Muslo', last.muslo, first.muslo),
      ('cuello', '🔵 Cuello', last.cuello, first.cuello),
    ].where((f) => f.$3 != null).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
      children: [
        // Resumen actual vs inicial
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppTheme.divider),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('Medidas actuales', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
                Text(DateFormat('d MMM yyyy', 'es').format(last.date),
                    style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
              ]),
              const SizedBox(height: 14),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: fields.map((f) {
                  final diff = f.$4 != null ? f.$3! - f.$4! : null;
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppTheme.secondary,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.divider),
                    ),
                    child: Column(children: [
                      Text(f.$2, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                      const SizedBox(height: 2),
                      Text('${f.$3!.toStringAsFixed(1)} cm',
                          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                      if (diff != null && diff != 0)
                        Text(
                          '${diff > 0 ? '+' : ''}${diff.toStringAsFixed(1)}',
                          style: TextStyle(
                            color: diff < 0 ? AppTheme.success : Colors.orange,
                            fontSize: 10, fontWeight: FontWeight.w600,
                          ),
                        ),
                    ]),
                  );
                }).toList(),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),
        const Text('Historial de mediciones', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),

        ...measures.reversed.map((e) => Dismissible(
          key: Key(e.id),
          direction: DismissDirection.endToStart,
          background: Container(
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(color: Colors.red.withOpacity(0.2), borderRadius: BorderRadius.circular(14)),
            alignment: Alignment.centerRight,
            padding: const EdgeInsets.only(right: 16),
            child: const Icon(Icons.delete_outline, color: Colors.red),
          ),
          onDismissed: (_) async {
            await ProgressStorage.deleteMeasurement(e.id);
            onRefresh();
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.divider),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  const Text('📏', style: TextStyle(fontSize: 18)),
                  const SizedBox(width: 8),
                  Text(DateFormat('EEEE d \'de\' MMMM yyyy', 'es').format(e.date),
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                ]),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    if (e.cintura != null) _Chip('👗 ${e.cintura} cm'),
                    if (e.pecho != null) _Chip('💪 ${e.pecho} cm'),
                    if (e.cadera != null) _Chip('🩳 ${e.cadera} cm'),
                    if (e.brazoDer != null) _Chip('💪 ${e.brazoDer} cm'),
                    if (e.muslo != null) _Chip('🦵 ${e.muslo} cm'),
                    if (e.cuello != null) _Chip('🔵 ${e.cuello} cm'),
                  ],
                ),
              ],
            ),
          ),
        )),
      ],
    );
  }
}

// ── Widgets comunes ──────────────────────────────────

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatCard(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Column(children: [
        Text(value, style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.w800)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
      ]),
    ),
  );
}

class _Chip extends StatelessWidget {
  final String text;
  const _Chip(this.text);

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(
      color: AppTheme.secondary,
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: AppTheme.divider),
    ),
    child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 12)),
  );
}

class _EmptyState extends StatelessWidget {
  final String emoji;
  final String title;
  final String subtitle;
  const _EmptyState({required this.emoji, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) => Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(emoji, style: const TextStyle(fontSize: 52)),
        const SizedBox(height: 14),
        Text(title, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Text(subtitle, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
      ],
    ),
  );
}

class _FpField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final TextInputType keyboardType;
  const _FpField({required this.controller, required this.label, required this.hint, this.keyboardType = TextInputType.text});

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    keyboardType: keyboardType,
    style: const TextStyle(color: Colors.white),
    decoration: InputDecoration(
      labelText: label,
      hintText: hint,
      filled: true,
      fillColor: AppTheme.secondary,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppTheme.divider)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppTheme.divider)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppTheme.primary, width: 2)),
      labelStyle: const TextStyle(color: AppTheme.textSecondary),
      hintStyle: const TextStyle(color: Color(0xFF4A5568)),
    ),
  );
}
