import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  final String? refCode;
  const LoginScreen({super.key, this.refCode});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _nombreCtrl = TextEditingController();
  final _refCtrl = TextEditingController();
  bool _isLogin = true;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.refCode != null) _refCtrl.text = widget.refCode!;
  }

  Future<void> _submit() async {
    setState(() { _loading = true; _error = null; });
    final db = Supabase.instance.client;
    try {
      if (_isLogin) {
        await db.auth.signInWithPassword(email: _emailCtrl.text.trim(), password: _passCtrl.text.trim());
      } else {
        final res = await db.auth.signUp(email: _emailCtrl.text.trim(), password: _passCtrl.text.trim());
        if (res.user?.id != null) {
          final refCode = _refCtrl.text.trim().isNotEmpty ? _refCtrl.text.trim().toUpperCase() : null;
          // Generar referral_code simple
          final chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          final rng = DateTime.now().microsecondsSinceEpoch;
          final myCode = String.fromCharCodes(List.generate(6, (i) => chars.codeUnitAt((rng >> (i * 4)) % chars.length)));
          // Usar RPC con SECURITY DEFINER para bypasear RLS
          await db.rpc('crear_perfil_cliente', params: {
            'p_nombre': _nombreCtrl.text.trim(),
            'p_referral_code': myCode,
            'p_referred_by_code': refCode,
            'p_barberia_slug': barberiaSlug,
          });
        }
      }
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
    } on AuthException catch (e) {
      setState(() { _error = e.message; });
    } catch (e) {
      setState(() { _error = e.toString(); });
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const SizedBox(height: 40),
            const Text('✂️', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text(_isLogin ? 'Bienvenido' : 'Crear cuenta',
              style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(_isLogin ? 'Inicia sesión para ver tus citas' : 'Regístrate para reservar tu hora',
              style: const TextStyle(color: Colors.white54, fontSize: 14)),
            const SizedBox(height: 32),
            if (!_isLogin) ...[
              _field(_nombreCtrl, 'Tu nombre', Icons.person_outline),
              const SizedBox(height: 12),
            ],
            _field(_emailCtrl, 'Correo', Icons.email_outlined, type: TextInputType.emailAddress),
            const SizedBox(height: 12),
            _field(_passCtrl, 'Contraseña', Icons.lock_outline, obscure: true),
            if (!_isLogin) ...[
              const SizedBox(height: 12),
              _field(_refCtrl, 'Código de referido (opcional)', Icons.card_giftcard_outlined),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
            ],
            const SizedBox(height: 24),
            SizedBox(width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFACC15),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _loading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : Text(_isLogin ? 'Ingresar' : 'Registrarme', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 16),
            Center(child: TextButton(
              onPressed: () => setState(() { _isLogin = !_isLogin; _error = null; }),
              child: Text(_isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión',
                style: const TextStyle(color: Color(0xFFFACC15))),
            )),
          ]),
        ),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String hint, IconData icon,
      {TextInputType type = TextInputType.text, bool obscure = false}) {
    return TextField(
      controller: ctrl,
      keyboardType: type,
      obscureText: obscure,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white38),
        prefixIcon: Icon(icon, color: Colors.white38, size: 20),
        filled: true,
        fillColor: const Color(0xFF27272A),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}
