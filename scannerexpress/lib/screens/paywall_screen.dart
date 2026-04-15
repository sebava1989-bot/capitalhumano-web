import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../services/purchase_service.dart';
import 'purchase_success_screen.dart';

class PaywallScreen extends StatefulWidget {
  const PaywallScreen({super.key});

  @override
  State<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends State<PaywallScreen> {
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    PurchaseService.startListening(
      onSuccess: () {
        if (!mounted) return;
        Navigator.pushReplacement(context,
            MaterialPageRoute(builder: (_) => const PurchaseSuccessScreen()));
      },
      onError: (msg) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
        setState(() => _loading = false);
      },
    );
  }

  @override
  void dispose() {
    PurchaseService.stopListening();
    super.dispose();
  }

  Future<void> _buy() async {
    setState(() => _loading = true);
    try {
      await PurchaseService.buyPremium();
    } catch (e) {
      if (!mounted) return;
      final l10n = AppLocalizations.of(context)!;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.error_purchase)));
      setState(() => _loading = false);
    }
  }

  Future<void> _restore() async {
    setState(() => _loading = true);
    await PurchaseService.restorePurchases();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: const Color(0xFF1a1a2e),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              const Icon(Icons.document_scanner, size: 64, color: Color(0xFF0071e3)),
              const SizedBox(height: 24),
              Text(l10n.paywall_title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 32),
              _Benefit(text: l10n.paywall_benefit_1),
              _Benefit(text: l10n.paywall_benefit_2),
              _Benefit(text: l10n.paywall_benefit_3),
              _Benefit(text: l10n.paywall_benefit_4),
              const SizedBox(height: 32),
              const Text(r'$2 USD', textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.bold)),
              Text(l10n.paywall_price, textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white54, fontSize: 14)),
              const Spacer(),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0071e3),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: _loading ? null : _buy,
                child: _loading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(l10n.paywall_cta, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: _loading ? null : _restore,
                child: Text(l10n.paywall_restore, style: const TextStyle(color: Colors.white54)),
              ),
              const SizedBox(height: 16),
              Text(l10n.footer_developer,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white24, fontSize: 11)),
            ],
          ),
        ),
      ),
    );
  }
}

class _Benefit extends StatelessWidget {
  final String text;
  const _Benefit({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(children: [
        const Icon(Icons.check_circle, color: Color(0xFF0071e3), size: 20),
        const SizedBox(width: 12),
        Text(text, style: const TextStyle(color: Colors.white, fontSize: 15)),
      ]),
    );
  }
}
