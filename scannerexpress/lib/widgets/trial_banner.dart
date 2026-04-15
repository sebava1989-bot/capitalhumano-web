import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';

class TrialBanner extends StatelessWidget {
  final int daysLeft;
  final VoidCallback onUpgrade;

  const TrialBanner({super.key, required this.daysLeft, required this.onUpgrade});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return MaterialBanner(
      backgroundColor: Colors.orange.shade50,
      content: Text(l10n.trial_days_left(daysLeft)),
      actions: [
        TextButton(
          onPressed: onUpgrade,
          child: Text(l10n.paywall_cta),
        ),
      ],
    );
  }
}
