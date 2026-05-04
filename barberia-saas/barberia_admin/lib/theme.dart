import 'package:flutter/material.dart';

class AppTheme {
  static const gold = Color(0xFFFACC15);
  static const surface = Color(0xFF27272A);
  static const bg = Color(0xFF18181B);

  static const cardDecoration = BoxDecoration(
    color: Color(0xFF2D2D31),
    borderRadius: BorderRadius.all(Radius.circular(16)),
    boxShadow: [
      BoxShadow(color: Color(0x1AFACC15), blurRadius: 20, spreadRadius: 1),
    ],
    border: Border.fromBorderSide(BorderSide(color: Color(0x33FACC15), width: 1)),
  );

  static BoxDecoration accentCardDecoration(Color accentColor) => BoxDecoration(
    color: const Color(0xFF2D2D31),
    borderRadius: const BorderRadius.all(Radius.circular(16)),
    boxShadow: [
      BoxShadow(color: accentColor.withValues(alpha: 0.15), blurRadius: 20, spreadRadius: 1),
    ],
    border: Border.fromBorderSide(BorderSide(color: accentColor.withValues(alpha: 0.3), width: 1)),
  );
}
