import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import 'workout_session_screen.dart';

const _routineColors = [AppTheme.primary, AppTheme.accent, Color(0xFF9C27B0), AppTheme.success];
const _routineIcons = ['💪', '🦵', '🏋️', '🏃'];

String _routineLevel(int exerciseCount) {
  if (exerciseCount <= 4) return 'Principiante';
  if (exerciseCount <= 6) return 'Intermedio';
  return 'Avanzado';
}

Map<String, dynamic> _mapRoutine(Map<String, dynamic> r, int index) {
  final exercises = (r['exercises'] as List<dynamic>?) ?? [];
  return {
    'id': r['id'] as int,
    'name': r['name'] as String,
    'day': r['day_of_week'] ?? '',
    'duration': '${exercises.length * 7}-${exercises.length * 10} min',
    'exercises': exercises.length,
    'level': _routineLevel(exercises.length),
    'icon': _routineIcons[index % _routineIcons.length],
    'color': _routineColors[index % _routineColors.length],
    'exerciseList': exercises.map((e) => {
      'name': e['name'],
      'sets': e['sets'],
      'reps': e['reps'],
      'rest': e['rest_seconds'],
    }).toList(),
  };
}

class RoutinesScreen extends StatefulWidget {
  const RoutinesScreen({super.key});

  @override
  State<RoutinesScreen> createState() => _RoutinesScreenState();
}

class _RoutinesScreenState extends State<RoutinesScreen> {
  List<Map<String, dynamic>> _routines = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadRoutines();
  }

  Future<void> _loadRoutines() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.get('/routines') as List<dynamic>;
      setState(() {
        _routines = data.asMap().entries
            .map((e) => _mapRoutine(e.value as Map<String, dynamic>, e.key))
            .toList();
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = 'No se pudo cargar las rutinas'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.secondary,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 140,
            pinned: true,
            backgroundColor: AppTheme.secondary,
            automaticallyImplyLeading: false,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF7B1FA2), Color(0xFF4A148C)],
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
                        Text('🏋️ Mis Rutinas', style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800)),
                        SizedBox(height: 4),
                        Text('Rutinas asignadas por tu gimnasio', style: TextStyle(color: Colors.white70, fontSize: 14)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          if (_loading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
            )
          else if (_error != null)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_error!, style: const TextStyle(color: AppTheme.textSecondary)),
                    const SizedBox(height: 16),
                    ElevatedButton(onPressed: _loadRoutines, child: const Text('Reintentar')),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, i) => _RoutineCard(routine: _routines[i]),
                  childCount: _routines.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _RoutineCard extends StatelessWidget {
  final Map<String, dynamic> routine;
  const _RoutineCard({required this.routine});

  @override
  Widget build(BuildContext context) {
    final color = routine['color'] as Color;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(
              builder: (_) => WorkoutSessionScreen(routine: routine),
            ));
          },
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 52, height: 52,
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Text(routine['icon'] as String,
                            style: const TextStyle(fontSize: 26)),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(routine['name'] as String,
                              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 17, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 2),
                          Text(routine['day'] as String,
                              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(routine['level'] as String,
                          style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    _Tag(icon: Icons.timer_outlined, label: routine['duration'] as String),
                    const SizedBox(width: 12),
                    _Tag(icon: Icons.fitness_center, label: '${routine['exercises']} ejercicios'),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [color, color.withOpacity(0.7)]),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text('Iniciar', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Tag({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.textSecondary, size: 14),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
      ],
    );
  }
}
