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
  final _telefonoCtrl = TextEditingController();
  final _refCtrl = TextEditingController();
  bool _isLogin = false; // Registro por defecto para nuevos usuarios
  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    if (!_isLogin && _telefonoCtrl.text.trim().isEmpty) {
      setState(() { _error = 'El teléfono es obligatorio'; });
      return;
    }
    setState(() { _loading = true; _error = null; });
    final db = Supabase.instance.client;
    try {
      if (_isLogin) {
        await db.auth.signInWithPassword(
          email: _emailCtrl.text.trim(),
          password: _passCtrl.text.trim(),
        );
      } else {
        final res = await db.auth.signUp(
          email: _emailCtrl.text.trim(),
          password: _passCtrl.text.trim(),
        );
        if (res.user?.id != null) {
          // Prioridad: deep link > campo manual
          final refCode = (widget.refCode?.trim().isNotEmpty == true
              ? widget.refCode!.trim()
              : _refCtrl.text.trim()).toUpperCase().isEmpty
              ? null
              : (widget.refCode?.trim().isNotEmpty == true
                  ? widget.refCode!.trim()
                  : _refCtrl.text.trim()).toUpperCase();
          final nombre = _nombreCtrl.text.trim().toUpperCase();
          final letras = nombre.replaceAll(RegExp(r'[^A-Z]'), '');
          final prefijo = letras.length >= 3 ? letras.substring(0, 3) : letras.padRight(3, 'X');
          final numeros = (100 + DateTime.now().microsecondsSinceEpoch % 900).toString();
          final myCode = '$prefijo$numeros';
          await db.rpc('crear_perfil_cliente', params: {
            'p_nombre': _nombreCtrl.text.trim(),
            'p_referral_code': myCode,
            'p_referred_by_code': refCode,
            'p_barberia_slug': barberiaSlug,
            'p_telefono': _telefonoCtrl.text.trim(),
          });
        }
      }
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()));
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

            // Banner de código referido automático
            if (!_isLogin && widget.refCode != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFF14532D).withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.green.withValues(alpha: 0.5)),
                ),
                child: Row(children: [
                  const Icon(Icons.card_giftcard, color: Colors.green, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(
                    'Código de referido aplicado: ${widget.refCode}',
                    style: const TextStyle(color: Colors.green, fontSize: 13),
                  )),
                ]),
              ),
            ],

            const SizedBox(height: 24),
            if (!_isLogin) ...[
              _field(_nombreCtrl, 'Tu nombre', Icons.person_outline),
              const SizedBox(height: 12),
            ],
            _field(_emailCtrl, 'Correo', Icons.email_outlined, type: TextInputType.emailAddress),
            const SizedBox(height: 12),
            if (!_isLogin) ...[
              _field(_telefonoCtrl, 'Teléfono *', Icons.phone_outlined, type: TextInputType.phone),
              const SizedBox(height: 12),
            ],
            _field(_passCtrl, 'Contraseña', Icons.lock_outline, obscure: true),
            if (!_isLogin) ...[
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF14532D).withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green.withValues(alpha: 0.4)),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                child: Row(children: [
                  const Icon(Icons.card_giftcard, color: Colors.green, size: 20),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text('¿Tienes un código de invitación?',
                      style: TextStyle(color: Colors.green, fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                ]),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _refCtrl,
                textCapitalization: TextCapitalization.characters,
                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 3),
                textAlign: TextAlign.center,
                decoration: InputDecoration(
                  hintText: 'CÓDIGO (ej. 5D5A060C)',
                  hintStyle: const TextStyle(color: Colors.white24, fontSize: 13, letterSpacing: 1, fontWeight: FontWeight.normal),
                  filled: true,
                  fillColor: const Color(0xFF27272A),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFACC15),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _loading
                  ? const SizedBox(height: 20, width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : Text(_isLogin ? 'Ingresar' : 'Registrarme',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 16),
            Center(child: TextButton(
              onPressed: () => setState(() { _isLogin = !_isLogin; _error = null; }),
              child: Text(
                _isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión',
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
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}
