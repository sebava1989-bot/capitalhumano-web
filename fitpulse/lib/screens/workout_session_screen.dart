import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class WorkoutSessionScreen extends StatefulWidget {
  final Map<String, dynamic> routine;
  const WorkoutSessionScreen({super.key, required this.routine});

  @override
  State<WorkoutSessionScreen> createState() => _WorkoutSessionScreenState();
}

class _WorkoutSessionScreenState extends State<WorkoutSessionScreen> {
  final Map<int, Map<int, bool>> _completed = {};
  final Map<int, List<double>> _weights = {};
  late final Stopwatch _stopwatch;
  late final DateTime _startTime;
  bool _finished = false;

  @override
  void initState() {
    super.initState();
    _stopwatch = Stopwatch()..start();
    _startTime = DateTime.now();

    final exercises = widget.routine['exerciseList'] as List;
    for (int i = 0; i < exercises.length; i++) {
      final sets = exercises[i]['sets'] as int;
      _completed[i] = {};
      _weights[i] = List.filled(sets, 0.0);
      for (int s = 0; s < sets; s++) {
        _completed[i]![s] = false;
      }
    }
  }

  int get _completedSets {
    int count = 0;
    for (final ex in _completed.values) {
      count += ex.values.where((v) => v).length;
    }
    return count;
  }

  int get _totalSets {
    int count = 0;
    for (final ex in (_completed.values)) {
      count += ex.length;
    }
    return count;
  }

  void _finishWorkout() {
    _stopwatch.stop();
    final minutes = _stopwatch.elapsed.inMinutes;
    final points = 50 + (_completedSets * 5) + (minutes > 30 ? 20 : 0);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => _FinishDialog(
        routineName: widget.routine['name'] as String,
        completedSets: _completedSets,
        totalSets: _totalSets,
        durationMinutes: minutes,
        pointsEarned: points,
        onClose: () {
          Navigator.pop(context); // cierra dialog
          Navigator.pop(context); // vuelve a rutinas
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final exercises = widget.routine['exerciseList'] as List;
    final color = widget.routine['color'] as Color;
    final progress = _totalSets > 0 ? _completedSets / _totalSets : 0.0;

    return Scaffold(
      backgroundColor: AppTheme.secondary,
      appBar: AppBar(
        backgroundColor: AppTheme.secondary,
        title: Text(widget.routine['name'] as String),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => _showExitDialog(context),
        ),
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 16),
              child: _TimerWidget(stopwatch: _stopwatch),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Progreso
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('$_completedSets / $_totalSets series',
                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                    Text('${(progress * 100).round()}%',
                        style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: progress,
                    backgroundColor: AppTheme.divider,
                    valueColor: AlwaysStoppedAnimation<Color>(color),
                    minHeight: 6,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Ejercicios
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: exercises.length,
              itemBuilder: (context, i) {
                final ex = exercises[i];
                final sets = ex['sets'] as int;
                return _ExerciseCard(
                  index: i + 1,
                  name: ex['name'] as String,
                  sets: sets,
                  reps: ex['reps'] as int,
                  rest: ex['rest'] as int,
                  completed: _completed[i]!,
                  weights: _weights[i]!,
                  onToggle: (setIndex) {
                    setState(() {
                      _completed[i]![setIndex] = !_completed[i]![setIndex]!;
                    });
                  },
                );
              },
            ),
          ),

          // Botón finalizar
          Padding(
            padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).padding.bottom + 16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _finishWorkout,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.success,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text(
                  _completedSets == _totalSets ? '¡Finalizar entrenamiento! 🏆' : 'Terminar ($_completedSets/$_totalSets series)',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showExitDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: const Text('¿Salir del entrenamiento?', style: TextStyle(color: Colors.white)),
        content: const Text('Perderás el progreso de esta sesión', style: TextStyle(color: AppTheme.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Continuar', style: TextStyle(color: AppTheme.primary)),
          ),
          TextButton(
            onPressed: () { Navigator.pop(context); Navigator.pop(context); },
            child: const Text('Salir', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}

class _TimerWidget extends StatefulWidget {
  final Stopwatch stopwatch;
  const _TimerWidget({required this.stopwatch});

  @override
  State<_TimerWidget> createState() => _TimerWidgetState();
}

class _TimerWidgetState extends State<_TimerWidget> {
  late final Stream<int> _ticks;

  @override
  void initState() {
    super.initState();
    _ticks = Stream.periodic(const Duration(seconds: 1), (i) => i);
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<int>(
      stream: _ticks,
      builder: (_, __) {
        final elapsed = widget.stopwatch.elapsed;
        final min = elapsed.inMinutes.toString().padLeft(2, '0');
        final sec = (elapsed.inSeconds % 60).toString().padLeft(2, '0');
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text('$min:$sec',
              style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700, fontSize: 14, fontFamily: 'monospace')),
        );
      },
    );
  }
}

class _ExerciseCard extends StatelessWidget {
  final int index;
  final String name;
  final int sets;
  final int reps;
  final int rest;
  final Map<int, bool> completed;
  final List<double> weights;
  final Function(int) onToggle;

  const _ExerciseCard({
    required this.index,
    required this.name,
    required this.sets,
    required this.reps,
    required this.rest,
    required this.completed,
    required this.weights,
    required this.onToggle,
  });

  bool get _allDone => completed.values.every((v) => v);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _allDone ? AppTheme.success.withOpacity(0.1) : AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _allDone ? AppTheme.success.withOpacity(0.4) : AppTheme.divider,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28, height: 28,
                decoration: BoxDecoration(
                  color: _allDone ? AppTheme.success.withOpacity(0.2) : AppTheme.primary.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: _allDone
                      ? const Icon(Icons.check, color: AppTheme.success, size: 14)
                      : Text('$index', style: const TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.w800)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(name, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
              ),
              Text('$reps reps · ${rest}s descanso',
                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(sets, (s) {
              final done = completed[s] ?? false;
              return GestureDetector(
                onTap: () => onToggle(s),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 56, height: 42,
                  decoration: BoxDecoration(
                    color: done ? AppTheme.success.withOpacity(0.2) : AppTheme.secondary,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: done ? AppTheme.success : AppTheme.divider,
                      width: done ? 2 : 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('S${s + 1}', style: TextStyle(
                        color: done ? AppTheme.success : AppTheme.textSecondary,
                        fontSize: 10, fontWeight: FontWeight.w600,
                      )),
                      if (done) const Icon(Icons.check, color: AppTheme.success, size: 14)
                      else Text('$reps', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class _FinishDialog extends StatelessWidget {
  final String routineName;
  final int completedSets;
  final int totalSets;
  final int durationMinutes;
  final int pointsEarned;
  final VoidCallback onClose;

  const _FinishDialog({
    required this.routineName,
    required this.completedSets,
    required this.totalSets,
    required this.durationMinutes,
    required this.pointsEarned,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppTheme.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('🏆', style: TextStyle(fontSize: 52)),
            const SizedBox(height: 12),
            const Text('¡Entrenamiento completado!',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(routineName,
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _Stat(value: '$completedSets/$totalSets', label: 'Series', icon: '💪'),
                _Stat(value: '${durationMinutes}min', label: 'Duración', icon: '⏱️'),
                _Stat(value: '+$pointsEarned', label: 'Puntos', icon: '⚡'),
              ],
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onClose,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('¡Excelente! 🔥', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String value;
  final String label;
  final String icon;
  const _Stat({required this.value, required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(icon, style: const TextStyle(fontSize: 22)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
        Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
      ],
    );
  }
}
