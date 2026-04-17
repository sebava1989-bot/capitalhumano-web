class UserModel {
  final int id;
  final String fullName;
  final String rut;
  final String gymCode;
  final String gymName;
  final int points;
  final int streak;
  final int level;
  final int rankPosition;

  UserModel({
    required this.id,
    required this.fullName,
    required this.rut,
    required this.gymCode,
    required this.gymName,
    required this.points,
    required this.streak,
    required this.level,
    required this.rankPosition,
  });

  factory UserModel.fromJson(Map<String, dynamic> j) => UserModel(
        id: j['id'],
        fullName: j['full_name'] ?? '',
        rut: j['rut'] ?? '',
        gymCode: j['gym_code'] ?? '',
        gymName: j['gym_name'] ?? '',
        points: j['points'] ?? 0,
        streak: j['streak'] ?? 0,
        level: j['level'] ?? 1,
        rankPosition: j['rank_position'] ?? 0,
      );

  String get initials {
    final parts = fullName.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty) return parts[0][0].toUpperCase();
    return '?';
  }

  String get levelName {
    if (level >= 10) return 'Élite';
    if (level >= 7) return 'Avanzado';
    if (level >= 4) return 'Intermedio';
    return 'Principiante';
  }
}
