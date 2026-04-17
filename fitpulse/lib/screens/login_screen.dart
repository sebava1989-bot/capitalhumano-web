import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _gymCodeCtrl = TextEditingController();
  final _rutCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String _error = '';

  @override
  void dispose() {
    _gymCodeCtrl.dispose();
    _rutCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final gymCode = _gymCodeCtrl.text.trim();
    final rut = _rutCtrl.text.trim();
    final pass = _passCtrl.text;

    if (gymCode.isEmpty || rut.isEmpty || pass.isEmpty) {
      setState(() => _error = 'Completa todos los campos');
      return;
    }

    setState(() { _loading = true; _error = ''; });

    try {
      await AuthService.login(gymCode: gymCode, rut: rut, password: pass);
      if (mounted) context.go('/home');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _enterDemo() async {
    await AuthService.saveDemo();
    if (mounted) context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.secondary,
      body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              children: [
                const SizedBox(height: 60),

                // Logo
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primary, AppTheme.primaryDark],
                    ),
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withOpacity(0.4),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.bolt, color: Colors.white, size: 44),
                ),
                const SizedBox(height: 20),
                const Text(
                  'FitPulse',
                  style: TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Tu gimnasio, tu comunidad',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 15),
                ),
                const SizedBox(height: 50),

                // Formulario
                _FpInput(
                  controller: _gymCodeCtrl,
                  label: 'Código del gimnasio',
                  hint: 'Ej: GYM01',
                  icon: Icons.fitness_center,
                  textCapitalization: TextCapitalization.characters,
                ),
                const SizedBox(height: 14),
                _FpInput(
                  controller: _rutCtrl,
                  label: 'RUT',
                  hint: '12345678-9',
                  icon: Icons.badge_outlined,
                ),
                const SizedBox(height: 14),
                _FpInput(
                  controller: _passCtrl,
                  label: 'Contraseña',
                  hint: '••••••••',
                  icon: Icons.lock_outline,
                  obscure: _obscure,
                  onToggleObscure: () => setState(() => _obscure = !_obscure),
                  onSubmit: _login,
                ),

                if (_error.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.red.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(_error, style: const TextStyle(color: Colors.red, fontSize: 13)),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 28),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _login,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _loading
                        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                        : const Text('Ingresar', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                  ),
                ),

                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _enterDemo,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: AppTheme.divider),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('Ver demo', style: TextStyle(color: AppTheme.textSecondary, fontSize: 15)),
                  ),
                ),

                const SizedBox(height: 40),
                const Text(
                  '¿No tienes acceso? Consulta con el administrador de tu gimnasio',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 30),
              ],
            ),
          ),
      ),
    );
  }
}

class _FpInput extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final bool obscure;
  final VoidCallback? onToggleObscure;
  final VoidCallback? onSubmit;
  final TextCapitalization textCapitalization;

  const _FpInput({
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.obscure = false,
    this.onToggleObscure,
    this.onSubmit,
    this.textCapitalization = TextCapitalization.none,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      textCapitalization: textCapitalization,
      style: const TextStyle(color: AppTheme.textPrimary, fontSize: 16),
      onSubmitted: onSubmit != null ? (_) => onSubmit!() : null,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, color: AppTheme.textSecondary, size: 20),
        suffixIcon: onToggleObscure != null
            ? IconButton(
                icon: Icon(obscure ? Icons.visibility_off : Icons.visibility,
                    color: AppTheme.textSecondary, size: 20),
                onPressed: onToggleObscure,
              )
            : null,
        filled: true,
        fillColor: AppTheme.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppTheme.divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppTheme.divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppTheme.primary, width: 2),
        ),
        labelStyle: const TextStyle(color: AppTheme.textSecondary),
        hintStyle: const TextStyle(color: Color(0xFF4A5568)),
      ),
    );
  }
}
