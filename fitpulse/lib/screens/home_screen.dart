import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  UserModel? _user;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await AuthService.getUser();
    if (mounted) setState(() => _user = user);
  }

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  String get _dayMessage {
    final day = DateTime.now().weekday;
    const msgs = ['', 'Lunes de pierna 🦵', 'Martes de pecho 💪', 'Miércoles cardio 🏃', 'Jueves de espalda 💪', 'Viernes de hombros 🔥', 'Sábado libre 🎯', 'Domingo activo ⚡'];
    return msgs[day];
  }

  @override
  Widget build(BuildContext context) {
    final user = _user;

    return Scaffold(
      backgroundColor: AppTheme.secondary,
      body: RefreshIndicator(
        onRefresh: _loadUser,
        color: AppTheme.primary,
        child: CustomScrollView(
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFFFF4D00), Color(0xFFCC2200)],
                  ),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(32),
                    bottomRight: Radius.circular(32),
                  ),
                ),
                child: SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(22, 16, 22, 28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(_greeting,
                                    style: const TextStyle(color: Colors.white70, fontSize: 14)),
                                const SizedBox(height: 2),
                                Text(
                                  user?.fullName.split(' ').first ?? '...',
                                  style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
                                ),
                              ],
                            ),
                            // Avatar
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Center(
                                child: Text(
                                  user?.initials ?? '?',
                                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        // Stats row
                        Row(
                          children: [
                            _StatChip(icon: Icons.local_fire_department, label: '${user?.streak ?? 0} días', sublabel: 'Racha'),
                            const SizedBox(width: 10),
                            _StatChip(icon: Icons.stars_rounded, label: '${user?.points ?? 0} pts', sublabel: 'Puntos'),
                            const SizedBox(width: 10),
                            _StatChip(icon: Icons.emoji_events, label: '#${user?.rankPosition ?? '-'}', sublabel: 'Ranking'),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),

            // Mensaje del día
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.divider),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.calendar_today, color: AppTheme.primary, size: 22),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Hoy', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                            Text(_dayMessage, style: const TextStyle(color: AppTheme.textPrimary, fontSize: 15, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 20)),

            // Acciones rápidas
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Acciones rápidas',
                        style: TextStyle(color: AppTheme.textPrimary, fontSize: 17, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: _QuickAction(
                            icon: Icons.play_circle_fill,
                            label: 'Iniciar\nentreno',
                            color: AppTheme.primary,
                            onTap: () => context.go('/routines'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _QuickAction(
                            icon: Icons.leaderboard,
                            label: 'Ver\nranking',
                            color: const Color(0xFFFFD600),
                            onTap: () => context.go('/ranking'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _QuickAction(
                            icon: Icons.show_chart,
                            label: 'Mi\nprogreso',
                            color: AppTheme.accent,
                            onTap: () => context.go('/profile'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),

            // Nivel y progreso
            if (user != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: _LevelCard(user: user),
                ),
              ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),

            // Motivación
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _MotivationCard(streak: user?.streak ?? 0),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sublabel;

  const _StatChip({required this.icon, required this.label, required this.sublabel});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: 18),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800)),
            Text(sublabel, style: const TextStyle(color: Colors.white70, fontSize: 10)),
          ],
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickAction({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.divider),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 30),
            const SizedBox(height: 8),
            Text(label, textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _LevelCard extends StatelessWidget {
  final UserModel user;
  const _LevelCard({required this.user});

  @override
  Widget build(BuildContext context) {
    final progress = (user.points % 500) / 500.0;
    final nextLevelPoints = 500 - (user.points % 500);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.cardBg, AppTheme.surface],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Nivel ${user.level} · ${user.levelName}',
                      style: const TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text('Faltan $nextLevelPoints pts para nivel ${user.level + 1}',
                      style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                ],
              ),
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text('${user.level}',
                      style: const TextStyle(color: AppTheme.primary, fontSize: 18, fontWeight: FontWeight.w900)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: AppTheme.divider,
              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 6),
          Text('${user.points} pts totales',
              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
        ],
      ),
    );
  }
}

class _MotivationCard extends StatelessWidget {
  final int streak;
  const _MotivationCard({required this.streak});

  String get _message {
    if (streak == 0) return '¡Hoy es un buen día para empezar tu racha! 💪';
    if (streak < 3) return '¡Llevas $streak días seguidos! Sigue así 🔥';
    if (streak < 7) return '¡$streak días de racha! Estás en modo bestia 🚀';
    if (streak < 14) return '¡$streak días! Eres una máquina imparable ⚡';
    return '¡$streak días seguidos! Leyenda del gimnasio 🏆';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Row(
        children: [
          const Text('🔥', style: TextStyle(fontSize: 32)),
          const SizedBox(width: 14),
          Expanded(
            child: Text(_message,
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14, fontWeight: FontWeight.w600, height: 1.4)),
          ),
        ],
      ),
    );
  }
}
