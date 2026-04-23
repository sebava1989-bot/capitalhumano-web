import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/suggestion_item.dart';
import '../models/warehouse.dart';
import '../services/api_service.dart';

class DteReviewScreen extends StatefulWidget {
  final String documentId;
  const DteReviewScreen({super.key, required this.documentId});
  @override
  State<DteReviewScreen> createState() => _DteReviewScreenState();
}

class _DteReviewScreenState extends State<DteReviewScreen> {
  List<SuggestionItem> _items = [];
  List<Warehouse> _warehouses = [];
  Warehouse? _selectedWarehouse;
  bool _loading = true;
  bool _applying = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = ApiService();
      final suggestionsData = await api.get('/documents/${widget.documentId}/suggestions') as List;
      final warehousesData = await api.get('/warehouses') as List;
      setState(() {
        _items = suggestionsData.map((e) => SuggestionItem.fromJson(e)).toList();
        _warehouses = warehousesData.map((e) => Warehouse.fromJson(e)).toList();
        for (final item in _items) {
          if (item.matchedProductId == null && item.suggestions.isNotEmpty) {
            item.matchedProductId = item.suggestions.first.productId;
          }
        }
        _loading = false;
      });
    } catch (_) {
      setState(() { _loading = false; _error = 'Error cargando sugerencias'; });
    }
  }

  Future<void> _updateMatch(SuggestionItem item, String? productId) async {
    final prev = item.matchedProductId;
    setState(() => item.matchedProductId = productId);
    try {
      final api = ApiService();
      await api.patch('/documents/${widget.documentId}/items/${item.itemId}', {
        'product_id': productId,
      });
    } catch (_) {
      if (mounted) setState(() => item.matchedProductId = prev);
    }
  }

  Future<void> _apply() async {
    if (_selectedWarehouse == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona una bodega de destino')),
      );
      return;
    }
    setState(() => _applying = true);
    try {
      final api = ApiService();
      await api.post('/documents/${widget.documentId}/apply', {
        'warehouse_id': _selectedWarehouse!.id,
        'matches': _items
            .where((i) => i.matchedProductId != null)
            .map((i) => {'item_id': i.itemId, 'product_id': i.matchedProductId})
            .toList(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('DTE aplicado al inventario'), backgroundColor: Colors.green),
        );
        context.go('/home');
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Error al aplicar documento');
    } finally {
      if (mounted) setState(() => _applying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Revisar DTE')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: DropdownButtonFormField<Warehouse>(
                    initialValue: _selectedWarehouse,
                    decoration: const InputDecoration(
                      labelText: 'Bodega destino',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.warehouse_outlined),
                    ),
                    items: _warehouses.map((w) => DropdownMenuItem(
                      value: w,
                      child: Text(w.name),
                    )).toList(),
                    onChanged: (w) => setState(() => _selectedWarehouse = w),
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: _items.length,
                    itemBuilder: (ctx, i) {
                      final item = _items[i];
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(item.productName,
                                        style: const TextStyle(fontWeight: FontWeight.w600)),
                                  ),
                                  Text('${item.quantity} u.', style: const TextStyle(color: Colors.grey)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              if (item.suggestions.isEmpty)
                                const Text('Sin sugerencias', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic))
                              else
                                DropdownButton<String?>(
                                  isExpanded: true,
                                  value: item.matchedProductId,
                                  hint: const Text('Vincular producto...'),
                                  items: [
                                    const DropdownMenuItem<String?>(value: null, child: Text('— Sin vincular —')),
                                    ...item.suggestions.map((s) => DropdownMenuItem<String?>(
                                      value: s.productId,
                                      child: Row(
                                        children: [
                                          _ConfidenceBadge(confidence: s.confidence),
                                          const SizedBox(width: 8),
                                          Expanded(child: Text(s.productName, overflow: TextOverflow.ellipsis)),
                                        ],
                                      ),
                                    )),
                                  ],
                                  onChanged: (v) => _updateMatch(item, v),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(_error!, style: const TextStyle(color: Colors.red)),
                  ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: FilledButton.icon(
                    onPressed: _applying ? null : _apply,
                    icon: _applying
                        ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.check_circle_outline),
                    label: const Text('Aplicar al Inventario'),
                    style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                  ),
                ),
              ],
            ),
    );
  }
}

class _ConfidenceBadge extends StatelessWidget {
  final String confidence;
  const _ConfidenceBadge({required this.confidence});

  @override
  Widget build(BuildContext context) {
    final color = confidence == 'exact' ? Colors.green : Colors.orange;
    final label = confidence == 'exact' ? 'Exacto' : 'Parcial';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
    );
  }
}
