import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'home_screen.dart';
import 'routines_screen.dart';
import 'ranking_screen.dart';
import 'nutrition_screen.dart';
import 'profile_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  final _screens = const [
    HomeScreen(),
    RoutinesScreen(),
    NutritionScreen(),
    RankingScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppTheme.surface,
          border: const Border(top: BorderSide(color: AppTheme.divider, width: 0.5)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, -2))],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _NavItem(icon: Icons.home_rounded, label: 'Inicio', index: 0, current: _currentIndex, onTap: (i) => setState(() => _currentIndex = i)),
                _NavItem(icon: Icons.fitness_center, label: 'Rutinas', index: 1, current: _currentIndex, onTap: (i) => setState(() => _currentIndex = i)),
                _NavItem(icon: Icons.restaurant_menu, label: 'Nutrición', index: 2, current: _currentIndex, onTap: (i) => setState(() => _currentIndex = i)),
                _NavItem(icon: Icons.leaderboard_rounded, label: 'Ranking', index: 3, current: _currentIndex, onTap: (i) => setState(() => _currentIndex = i)),
                _NavItem(icon: Icons.person_rounded, label: 'Perfil', index: 4, current: _currentIndex, onTap: (i) => setState(() => _currentIndex = i)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final int index;
  final int current;
  final Function(int) onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.index,
    required this.current,
    required this.onTap,
  });

  bool get _active => index == current;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onTap(index),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 72,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 44,
              height: 32,
              decoration: BoxDecoration(
                color: _active ? AppTheme.primary.withOpacity(0.15) : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: _active ? AppTheme.primary : AppTheme.textSecondary, size: 22),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: _active ? AppTheme.primary : AppTheme.textSecondary,
                fontSize: 10,
                fontWeight: _active ? FontWeight.w700 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
