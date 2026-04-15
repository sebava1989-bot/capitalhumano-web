import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n/app_localizations.dart';
import '../services/purchase_service.dart';
import 'paywall_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _highQuality = false;
  bool _cloudSync = true;
  String _version = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final info = await PackageInfo.fromPlatform();
    if (!mounted) return;
    setState(() {
      _highQuality = prefs.getBool('high_quality') ?? false;
      _cloudSync = prefs.getBool('cloud_sync') ?? true;
      _version = info.version;
    });
  }

  Future<void> _restore() async {
    PurchaseService.startListening(
      onSuccess: () {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('¡Compra restaurada!')));
        PurchaseService.stopListening();
      },
      onError: (msg) {
        if (!mounted) return;
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.error_restore_not_found)));
        PurchaseService.stopListening();
      },
    );
    await PurchaseService.restorePurchases();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.settings_title)),
      body: ListView(
        children: [
          SwitchListTile(
            title: Text(l10n.settings_quality),
            subtitle: Text(_highQuality ? l10n.settings_quality_high : l10n.settings_quality_normal),
            value: _highQuality,
            onChanged: (v) async {
              final prefs = await SharedPreferences.getInstance();
              await prefs.setBool('high_quality', v);
              setState(() => _highQuality = v);
            },
          ),
          SwitchListTile(
            title: Text(l10n.settings_sync),
            value: _cloudSync,
            onChanged: (v) async {
              final prefs = await SharedPreferences.getInstance();
              await prefs.setBool('cloud_sync', v);
              setState(() => _cloudSync = v);
            },
          ),
          ListTile(
            title: Text(l10n.settings_restore),
            trailing: const Icon(Icons.restore),
            onTap: _restore,
          ),
          ListTile(
            title: Text(l10n.settings_version),
            trailing: Text(_version, style: TextStyle(color: Colors.grey.shade500)),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(l10n.settings_developer,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
          ),
        ],
      ),
    );
  }
}
