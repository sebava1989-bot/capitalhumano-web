import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'workout_session_screen.dart';

final _demoRoutines = [
  {
    'id': 1,
    'name': 'Pecho y Tríceps',
    'day': 'Martes / Viernes',
    'duration': '45-55 min',
    'exercises': 6,
    'level': 'Intermedio',
    'icon': '💪',
    'color': AppTheme.primary,
    'exerciseList': [
      {'name': 'Press banca plano', 'sets': 4, 'reps': 10, 'rest': 90},
      {'name': 'Press inclinado mancuernas', 'sets': 3, 'reps': 12, 'rest': 75},
      {'name': 'Aperturas en máquina', 'sets': 3, 'reps': 15, 'rest': 60},
      {'name': 'Fondos en paralelas', 'sets': 3, 'reps': 12, 'rest': 75},
      {'name': 'Press francés', 'sets': 3, 'reps': 12, 'rest': 60},
      {'name': 'Extensión tríceps polea', 'sets': 3, 'reps': 15, 'rest': 45},
    ],
  },
  {
    'id': 2,
    'name': 'Piernas y Glúteos',
    'day': 'Lunes / Jueves',
    'duration': '50-65 min',
    'exercises': 7,
    'level': 'Avanzado',
    'icon': '🦵',
    'color': AppTheme.accent,
    'exerciseList': [
      {'name': 'Sentadilla libre', 'sets': 4, 'reps': 8, 'rest': 120},
      {'name': 'Prensa de piernas', 'sets': 4, 'reps': 12, 'rest': 90},
      {'name': 'Extensiones de cuádriceps', 'sets': 3, 'reps': 15, 'rest': 60},
      {'name': 'Curl femoral tumbado', 'sets': 3, 'reps': 12, 'rest': 60},
      {'name': 'Hip thrust', 'sets': 4, 'reps': 12, 'rest': 90},
      {'name': 'Elevación de talones', 'sets': 4, 'reps': 20, 'rest': 45},
      {'name': 'Peso muerto rumano', 'sets': 3, 'reps': 10, 'rest': 90},
    ],
  },
  {
    'id': 3,
    'name': 'Espalda y Bíceps',
    'day': 'Miércoles / Sábado',
    'duration': '45-55 min',
    'exercises': 6,
    'level': 'Intermedio',
    'icon': '🏋️',
    'color': const Color(0xFF9C27B0),
    'exerciseList': [
      {'name': 'Dominadas asistidas', 'sets': 4, 'reps': 8, 'rest': 90},
      {'name': 'Remo con barra', 'sets': 4, 'reps': 10, 'rest': 90},
      {'name': 'Jalón al pecho polea', 'sets': 3, 'reps': 12, 'rest': 75},
      {'name': 'Remo en máquina', 'sets': 3, 'reps': 12, 'rest': 60},
      {'name': 'Curl bíceps barra', 'sets': 3, 'reps': 12, 'rest': 60},
      {'name': 'Curl martillo mancuernas', 'sets': 3, 'reps': 12, 'rest': 60},
    ],
  },
  {
    'id': 4,
    'name': 'Cardio HIIT',
    'day': 'Miércoles',
    'duration': '30 min',
    'exercises': 5,
    'level': 'Principiante',
    'icon': '🏃',
    'color': AppTheme.success,
    'exerciseList': [
      {'name': 'Burpees', 'sets': 4, 'reps': 10, 'rest': 60},
      {'name': 'Mountain climbers', 'sets': 4, 'reps': 20, 'rest': 45},
      {'name': 'Saltos de caja', 'sets': 3, 'reps': 12, 'rest': 60},
      {'name': 'Sprints en cinta', 'sets': 6, 'reps': 1, 'rest': 90},
      {'name': 'Saltar la cuerda', 'sets': 3, 'reps': 1, 'rest': 60},
    ],
  },
];

class RoutinesScreen extends StatelessWidget {
  const RoutinesScreen({super.key});

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

          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, i) => _RoutineCard(routine: _demoRoutines[i]),
                childCount: _demoRoutines.length,
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
