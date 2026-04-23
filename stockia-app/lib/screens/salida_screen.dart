import 'package:flutter/material.dart';
import '../models/product.dart';
import '../models/warehouse.dart';
import '../services/api_service.dart';

class SalidaScreen extends StatefulWidget {
  const SalidaScreen({super.key});
  @override
  State<SalidaScreen> createState() => _SalidaScreenState();
}

class _SalidaScreenState extends State<SalidaScreen> {
  final _formKey = GlobalKey<FormState>();
  final _responsibleCtrl = TextEditingController();
  final _quantityCtrl = TextEditingController();
  final _searchCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  List<Product> _products = [];
  List<Product> _filtered = [];
  List<Warehouse> _warehouses = [];

  Product? _selected;
  Warehouse? _selectedWarehouse;
  bool _loading = true;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
    _searchCtrl.addListener(_filter);
  }

  @override
  void dispose() {
    _responsibleCtrl.dispose();
    _quantityCtrl.dispose();
    _searchCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = ApiService();
      final productsData = await api.get('/products') as List;
      final warehousesData = await api.get('/warehouses') as List;
      setState(() {
        _products = productsData.map((e) => Product.fromJson(e)).where((p) => p.active).toList();
        _filtered = _products;
        _warehouses = warehousesData.map((e) => Warehouse.fromJson(e)).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() { _loading = false; _error = 'Error cargando datos'; });
    }
  }

  void _filter() {
    final q = _searchCtrl.text.toLowerCase();
    setState(() {
      _filtered = _products.where((p) =>
        p.name.toLowerCase().contains(q) || p.sku.toLowerCase().contains(q)
      ).toList();
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selected == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona un producto')),
      );
      return;
    }
    if (_selectedWarehouse == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona una bodega')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final api = ApiService();
      await api.post('/movements/out', {
        'product_id': _selected!.id,
        'warehouse_id': _selectedWarehouse!.id,
        'quantity': int.parse(_quantityCtrl.text),
        'responsible': _responsibleCtrl.text.trim(),
        if (_notesCtrl.text.isNotEmpty) 'notes': _notesCtrl.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Salida registrada exitosamente'), backgroundColor: Colors.green),
        );
        Navigator.of(context).pop();
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Error de conexión');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registrar Salida')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_selected == null) ...[
                    TextField(
                      controller: _searchCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Buscar producto',
                        prefixIcon: Icon(Icons.search),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 200,
                      child: Card(
                        child: ListView.builder(
                          itemCount: _filtered.length,
                          itemBuilder: (ctx, i) {
                            final p = _filtered[i];
                            return ListTile(
                              title: Text(p.name),
                              subtitle: Text('SKU: ${p.sku}'),
                              onTap: () => setState(() {
                                _selected = p;
                                _searchCtrl.clear();
                              }),
                            );
                          },
                        ),
                      ),
                    ),
                  ] else ...[
                    Card(
                      color: Theme.of(context).colorScheme.primaryContainer,
                      child: ListTile(
                        title: Text(_selected!.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('SKU: ${_selected!.sku} · ${_selected!.unit}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => setState(() => _selected = null),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  DropdownButtonFormField<Warehouse>(
                    initialValue: _selectedWarehouse,
                    decoration: const InputDecoration(
                      labelText: 'Bodega',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.warehouse_outlined),
                    ),
                    items: _warehouses.map((w) => DropdownMenuItem(
                      value: w,
                      child: Text(w.name),
                    )).toList(),
                    onChanged: (w) => setState(() => _selectedWarehouse = w),
                    validator: (v) => v == null ? 'Selecciona bodega' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _quantityCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Cantidad',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.numbers),
                    ),
                    validator: (v) {
                      final n = int.tryParse(v ?? '');
                      if (n == null || n <= 0) return 'Cantidad válida requerida';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _responsibleCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Responsable',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    validator: (v) => (v?.isNotEmpty ?? false) ? null : 'Requerido',
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _notesCtrl,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Notas (opcional)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.notes_outlined),
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!, style: const TextStyle(color: Colors.red), textAlign: TextAlign.center),
                  ],
                  const SizedBox(height: 24),
                  FilledButton.icon(
                    onPressed: _submitting ? null : _submit,
                    icon: _submitting
                        ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.arrow_upward),
                    label: const Text('Confirmar Salida'),
                    style: FilledButton.styleFrom(backgroundColor: Colors.red[400]),
                  ),
                ],
              ),
            ),
    );
  }
}
