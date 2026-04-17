class ExerciseSet {
  final int reps;
  final double weight;
  bool completed;

  ExerciseSet({required this.reps, required this.weight, this.completed = false});
}

class Exercise {
  final int id;
  final String name;
  final String muscleGroup;
  final List<ExerciseSet> sets;

  Exercise({
    required this.id,
    required this.name,
    required this.muscleGroup,
    required this.sets,
  });

  factory Exercise.fromJson(Map<String, dynamic> j) => Exercise(
        id: j['id'],
        name: j['name'] ?? '',
        muscleGroup: j['muscle_group'] ?? '',
        sets: (j['sets'] as List? ?? [])
            .map((s) => ExerciseSet(
                  reps: s['reps'] ?? 10,
                  weight: (s['weight'] ?? 0).toDouble(),
                ))
            .toList(),
      );
}

class Routine {
  final int id;
  final String name;
  final String description;
  final List<Exercise> exercises;
  final String dayOfWeek;

  Routine({
    required this.id,
    required this.name,
    required this.description,
    required this.exercises,
    required this.dayOfWeek,
  });

  factory Routine.fromJson(Map<String, dynamic> j) => Routine(
        id: j['id'],
        name: j['name'] ?? '',
        description: j['description'] ?? '',
        exercises: (j['exercises'] as List? ?? [])
            .map((e) => Exercise.fromJson(e))
            .toList(),
        dayOfWeek: j['day_of_week'] ?? '',
      );
}

class WorkoutLog {
  final DateTime date;
  final int routineId;
  final String routineName;
  final int pointsEarned;
  final int durationMinutes;

  WorkoutLog({
    required this.date,
    required this.routineId,
    required this.routineName,
    required this.pointsEarned,
    required this.durationMinutes,
  });

  factory WorkoutLog.fromJson(Map<String, dynamic> j) => WorkoutLog(
        date: DateTime.parse(j['date']),
        routineId: j['routine_id'],
        routineName: j['routine_name'] ?? '',
        pointsEarned: j['points_earned'] ?? 0,
        durationMinutes: j['duration_minutes'] ?? 0,
      );
}
