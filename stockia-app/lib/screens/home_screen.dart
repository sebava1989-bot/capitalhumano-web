import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/stock_alert.dart';
import '../models/movement.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<StockAlert> _alerts = [];
  List<Movement> _movements = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = ApiService();
      final alertsData = await api.get('/stock/alerts') as List;
      final movementsData = await api.get('/movements') as List;
      setState(() {
        _alerts = alertsData.map((e) => StockAlert.fromJson(e)).toList();
        _movements = movementsData.take(20).map((e) => Movement.fromJson(e)).toList();
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() { _error = e.message; _loading = false; });
    } catch (_) {
      setState(() { _error = 'Error de conexión'; _loading = false; });
    }
  }

  Future<void> _logout() async {
    await AuthService().logout();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('StockIA'),
        actions: [
          IconButton(icon: const Icon(Icons.logout), onPressed: _logout, tooltip: 'Cerrar sesión'),
        ],
        bottom: TabBar(
          controller: _tabs,
          tabs: [
            Tab(text: 'Alertas${_alerts.isNotEmpty ? " (${_alerts.length})" : ""}'),
            const Tab(text: 'Movimientos'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_error!, style: const TextStyle(color: Colors.red)),
                    const SizedBox(height: 8),
                    ElevatedButton(onPressed: _load, child: const Text('Reintentar')),
                  ],
                ))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: TabBarView(
                    controller: _tabs,
                    children: [
                      _AlertsTab(alerts: _alerts),
                      _MovementsTab(movements: _movements),
                    ],
                  ),
                ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton.extended(
            heroTag: 'salida',
            onPressed: () => context.push('/salida').then((_) => _load()),
            icon: const Icon(Icons.arrow_upward),
            label: const Text('Salida'),
            backgroundColor: Colors.red[400],
            foregroundColor: Colors.white,
          ),
          const SizedBox(height: 8),
          FloatingActionButton.extended(
            heroTag: 'dte',
            onPressed: () => context.push('/dte').then((_) => _load()),
            icon: const Icon(Icons.upload_file),
            label: const Text('Importar DTE'),
          ),
        ],
      ),
    );
  }
}

class _AlertsTab extends StatelessWidget {
  final List<StockAlert> alerts;
  const _AlertsTab({required this.alerts});

  @override
  Widget build(BuildContext context) {
    if (alerts.isEmpty) {
      return const Center(child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle_outline, size: 64, color: Colors.green),
          SizedBox(height: 8),
          Text('Sin alertas de stock', style: TextStyle(fontSize: 16)),
        ],
      ));
    }
    return ListView.builder(
      itemCount: alerts.length,
      itemBuilder: (ctx, i) {
        final a = alerts[i];
        final color = a.isCritical ? Colors.red : Colors.orange;
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: color.withValues(alpha: 0.15),
              child: Icon(Icons.warning_amber_rounded, color: color),
            ),
            title: Text(a.productName, style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('${a.warehouseName} · SKU: ${a.sku}'),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('${a.currentStock}', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
                Text('mín: ${a.minStock}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _MovementsTab extends StatelessWidget {
  final List<Movement> movements;
  const _MovementsTab({required this.movements});

  @override
  Widget build(BuildContext context) {
    if (movements.isEmpty) {
      return const Center(child: Text('Sin movimientos recientes'));
    }
    final fmt = DateFormat('dd/MM HH:mm');
    return ListView.builder(
      itemCount: movements.length,
      itemBuilder: (ctx, i) {
        final m = movements[i];
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: m.isOut ? Colors.red[50] : Colors.green[50],
            child: Icon(
              m.isOut ? Icons.arrow_upward : Icons.arrow_downward,
              color: m.isOut ? Colors.red : Colors.green,
            ),
          ),
          title: Text(m.productName),
          subtitle: Text(m.responsible ?? '—'),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${m.isOut ? "-" : "+"}${m.quantity}',
                  style: TextStyle(fontWeight: FontWeight.bold, color: m.isOut ? Colors.red : Colors.green)),
              Text(fmt.format(m.createdAt.toLocal()), style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ),
        );
      },
    );
  }
}
