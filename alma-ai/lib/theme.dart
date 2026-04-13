import 'package:flutter/material.dart';

class AlmaThemeData {
  final String name;
  final String emoji;
  final Color primary;
  final Color primaryLight;
  final Color almaBubble;
  final Color userBubble;
  final Color background;
  final Color surface;
  final Color onAlmaBubble;
  final Color onUserBubble;
  final bool isDark;

  const AlmaThemeData({
    required this.name,
    required this.emoji,
    required this.primary,
    required this.primaryLight,
    required this.almaBubble,
    required this.userBubble,
    required this.background,
    required this.surface,
    required this.onAlmaBubble,
    required this.onUserBubble,
    this.isDark = false,
  });

  ThemeData toMaterialTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: isDark ? Brightness.dark : Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        brightness: isDark ? Brightness.dark : Brightness.light,
      ),
      scaffoldBackgroundColor: background,
      fontFamily: 'Roboto',
    );
  }
}

class AlmaTheme {
  static const List<AlmaThemeData> all = [naturaleza, noche, calidez, serenidad];

  static const AlmaThemeData naturaleza = AlmaThemeData(
    name: 'Naturaleza',
    emoji: '🌿',
    primary: Color(0xFF7CAE7A),
    primaryLight: Color(0xFFA8D5A2),
    almaBubble: Color(0xFFE8F4E0),
    userBubble: Color(0xFFD4A574),
    background: Color(0xFFFAF7F2),
    surface: Color(0xFFF5F0E8),
    onAlmaBubble: Color(0xFF2D4A2A),
    onUserBubble: Color(0xFFFFFFFF),
  );

  static const AlmaThemeData noche = AlmaThemeData(
    name: 'Noche',
    emoji: '🌙',
    primary: Color(0xFF4A4A8A),
    primaryLight: Color(0xFF7070CC),
    almaBubble: Color(0xFF1E1E3A),
    userBubble: Color(0xFF2A2A5A),
    background: Color(0xFF0F0F1A),
    surface: Color(0xFF1A1A2E),
    onAlmaBubble: Color(0xFFC8C8FF),
    onUserBubble: Color(0xFFE0E0FF),
    isDark: true,
  );

  static const AlmaThemeData calidez = AlmaThemeData(
    name: 'Calidez',
    emoji: '🌸',
    primary: Color(0xFFE87F9A),
    primaryLight: Color(0xFFF4B8C8),
    almaBubble: Color(0xFFFDE8EF),
    userBubble: Color(0xFFF4956A),
    background: Color(0xFFFFF8F5),
    surface: Color(0xFFFFF0F0),
    onAlmaBubble: Color(0xFF8B2252),
    onUserBubble: Color(0xFFFFFFFF),
  );

  static const AlmaThemeData serenidad = AlmaThemeData(
    name: 'Serenidad',
    emoji: '🌊',
    primary: Color(0xFF4A7CC7),
    primaryLight: Color(0xFF87B4E8),
    almaBubble: Color(0xFFDDE9F8),
    userBubble: Color(0xFFC4A882),
    background: Color(0xFFF5F8FF),
    surface: Color(0xFFEBF2FF),
    onAlmaBubble: Color(0xFF1A3A6B),
    onUserBubble: Color(0xFFFFFFFF),
  );
}
