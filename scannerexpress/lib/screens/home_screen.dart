import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../main.dart';
import '../models/document.dart';
import '../models/folder.dart';
import '../services/trial_service.dart';
import '../widgets/document_card.dart';
import '../widgets/folder_card.dart';
import '../widgets/premium_badge.dart';
import 'document_detail_screen.dart';
import 'folders_screen.dart';
import 'paywall_screen.dart';
import 'scanner_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _navIndex = 0;
  List<Document> _recent = [];
  List<Folder> _folders = [];
  bool _isPremium = false;
  int _daysLeft = 7;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final status = await TrialService.getStatus();
    final recent = await dbService.getRecentDocuments();
    final folders = await dbService.getAllFolders();
    if (!mounted) return;
    setState(() {
      _isPremium = status.isPremium;
      _daysLeft = (7 - status.daysElapsed).clamp(0, 7);
      _recent = recent;
      _folders = folders;
    });
  }

  Future<void> _onFabPressed() async {
    final status = await TrialService.getStatus();
    if (!status.canUse) {
      if (!mounted) return;
      Navigator.push(context, MaterialPageRoute(builder: (_) => const PaywallScreen()))
          .then((_) => _load());
      return;
    }
    if (!mounted) return;
    Navigator.push(context, MaterialPageRoute(builder: (_) => const ScannerScreen()))
        .then((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: const Text('ScannerExpress', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: PremiumBadge(isPremium: _isPremium, daysLeft: _daysLeft),
          ),
        ],
      ),
      body: _navIndex == 0 ? _buildHome(l10n) : _navIndex == 1
          ? const FoldersScreen()
          : const SettingsScreen(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _navIndex,
        onDestinationSelected: (i) => setState(() => _navIndex = i),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), label: l10n.nav_home),
          NavigationDestination(icon: const Icon(Icons.folder_outlined), label: l10n.nav_folders),
          NavigationDestination(icon: const Icon(Icons.settings_outlined), label: l10n.nav_settings),
        ],
      ),
      floatingActionButton: _navIndex == 0
          ? FloatingActionButton.extended(
              onPressed: _onFabPressed,
              icon: const Icon(Icons.document_scanner),
              label: Text(l10n.home_scan_fab),
            )
          : null,
    );
  }

  Widget _buildHome(AppLocalizations l10n) {
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_recent.isNotEmpty) ...[
            Text(l10n.home_recent, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ..._recent.map((d) => DocumentCard(
              doc: d,
              onTap: () => Navigator.push(context,
                  MaterialPageRoute(builder: (_) => DocumentDetailScreen(document: d)))
                  .then((_) => _load()),
            )),
            const SizedBox(height: 16),
          ],
          if (_folders.isNotEmpty) ...[
            Text(l10n.home_folders, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ..._folders.map((f) => FolderCard(
              folder: f,
              docCount: 0,
              onTap: () {},
            )),
          ],
          if (_recent.isEmpty && _folders.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.only(top: 80),
                child: Text(l10n.home_no_docs, textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 16)),
              ),
            ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }
}
