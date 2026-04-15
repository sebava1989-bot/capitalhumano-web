import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';

class PremiumBadge extends StatelessWidget {
  final bool isPremium;
  final int daysLeft;

  const PremiumBadge({super.key, required this.isPremium, required this.daysLeft});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final label = isPremium ? l10n.badge_pro : l10n.trial_days_left(daysLeft);
    final color = isPremium ? const Color(0xFF0071e3) : Colors.orange;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
    );
  }
}
