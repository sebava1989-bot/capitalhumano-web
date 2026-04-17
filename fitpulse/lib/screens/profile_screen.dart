import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import 'progress_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  UserModel? _user;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final u = await AuthService.getUser();
    if (mounted) setState(() => _user = u);
  }

  Future<void> _logout() async {
    await AuthService.logout();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final user = _user;

    return Scaffold(
      backgroundColor: AppTheme.secondary,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppTheme.secondary,
            automaticallyImplyLeading: false,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF00BCD4), Color(0xFF006064)],
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
                    padding: const EdgeInsets.all(22),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 72, height: 72,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: Center(
                            child: Text(
                              user?.initials ?? '?',
                              style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(user?.fullName ?? '...', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
                        Text(user?.gymName ?? '', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Stats
                  Row(
                    children: [
                      _StatBox(label: 'Nivel', value: '${user?.level ?? 1}', sub: user?.levelName ?? '', color: AppTheme.primary),
                      const SizedBox(width: 12),
                      _StatBox(label: 'Racha', value: '${user?.streak ?? 0}', sub: 'días seguidos', color: const Color(0xFFFF8C00)),
                      const SizedBox(width: 12),
                      _StatBox(label: 'Puntos', value: '${user?.points ?? 0}', sub: 'totales', color: AppTheme.accent),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Acceso a progreso
                  GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProgressScreen())),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Color(0xFF6A1B9A), Color(0xFF38006B)]),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Row(children: [
                        Text('📈', style: TextStyle(fontSize: 26)),
                        SizedBox(width: 14),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('Mi Progreso', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                          Text('Peso, medidas y evolución', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        ])),
                        Icon(Icons.arrow_forward_ios, color: Colors.white54, size: 16),
                      ]),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Logros demo
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppTheme.divider),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Logros', style: TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 14),
                        _Badge(emoji: '🔥', title: 'Primera semana', desc: 'Completaste 7 días seguidos', earned: true),
                        _Badge(emoji: '💪', title: '10 entrenamientos', desc: 'Registraste 10 sesiones', earned: true),
                        _Badge(emoji: '🏆', title: 'Top 10', desc: 'Entraste al ranking del gimnasio', earned: false),
                        _Badge(emoji: '⚡', title: '500 puntos', desc: 'Acumulaste 500 puntos', earned: false),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Botón cerrar sesión
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _logout,
                      icon: const Icon(Icons.logout, color: Colors.red),
                      label: const Text('Cerrar sesión', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: const BorderSide(color: Colors.red),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final String label;
  final String value;
  final String sub;
  final Color color;

  const _StatBox({required this.label, required this.value, required this.sub, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 10),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.divider),
        ),
        child: Column(
          children: [
            Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.w900)),
            Text(sub, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10)),
          ],
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String emoji;
  final String title;
  final String desc;
  final bool earned;

  const _Badge({required this.emoji, required this.title, required this.desc, required this.earned});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Text(emoji, style: TextStyle(fontSize: 26, color: earned ? null : const Color(0xFF333333))),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: earned ? AppTheme.textPrimary : AppTheme.textSecondary, fontSize: 14, fontWeight: FontWeight.w600)),
                Text(desc, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
              ],
            ),
          ),
          if (earned)
            const Icon(Icons.check_circle, color: AppTheme.success, size: 18)
          else
            const Icon(Icons.lock_outline, color: AppTheme.textSecondary, size: 16),
        ],
      ),
    );
  }
}
