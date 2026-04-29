import 'package:flutter/material.dart';
import '../models/cliente.dart';
import '../services/clientes_service.dart';
import 'cliente_detail_screen.dart';

class ClientesScreen extends StatefulWidget {
  final String barberiaId;
  const ClientesScreen({super.key, required this.barberiaId});
  @override
  State<ClientesScreen> createState() => _ClientesScreenState();
}

class _ClientesScreenState extends State<ClientesScreen> {
  final _service = ClientesService();
  List<Cliente> _todos = [];
  List<Cliente> _filtrados = [];
  String _segmento = 'todos';
  String _busqueda = '';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final clientes = await _service.getClientes(widget.barberiaId);
    if (!mounted) return;
    setState(() {
      _todos = clientes;
      _loading = false;
    });
    _filtrar();
  }

  void _filtrar() {
    setState(() {
      _filtrados = _todos.where((c) {
        final matchSeg =
            _segmento == 'todos' || c.segmento == _segmento;
        final q = _busqueda.toLowerCase();
        final matchQ = q.isEmpty ||
            c.nombre.toLowerCase().contains(q) ||
            (c.telefono?.contains(q) ?? false);
        return matchSeg && matchQ;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Clientes'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFFACC15)))
          : Column(children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Buscar por nombre o teléfono',
                    prefixIcon: const Icon(Icons.search,
                        color: Color(0xFFA1A1AA)),
                    filled: true,
                    fillColor: const Color(0xFF27272A),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none),
                  ),
                  onChanged: (v) {
                    _busqueda = v;
                    _filtrar();
                  },
                ),
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: ['todos', 'frecuente', 'nuevo', 'inactivo']
                      .map((s) {
                    final sel = _segmento == s;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(s),
                        selected: sel,
                        onSelected: (_) {
                          _segmento = s;
                          _filtrar();
                        },
                        selectedColor: const Color(0xFFFACC15)
                            .withValues(alpha: 0.2),
                        labelStyle: TextStyle(
                            color: sel
                                ? const Color(0xFFFACC15)
                                : const Color(0xFFA1A1AA)),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: _filtrados.isEmpty
                    ? const Center(
                        child: Text('Sin clientes',
                            style:
                                TextStyle(color: Color(0xFFA1A1AA))))
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _filtrados.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 8),
                        itemBuilder: (_, i) {
                          final c = _filtrados[i];
                          return ListTile(
                            tileColor: const Color(0xFF27272A),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                            title: Text(c.nombre,
                                style: const TextStyle(
                                    color: Colors.white)),
                            subtitle: Text(
                                '${c.totalVisitas} visitas · \$${c.gastoTotal.toStringAsFixed(0)}',
                                style: const TextStyle(
                                    color: Color(0xFFA1A1AA),
                                    fontSize: 12)),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: _segColor(c.segmento)
                                    .withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(c.segmento,
                                  style: TextStyle(
                                      color: _segColor(c.segmento),
                                      fontSize: 11)),
                            ),
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ClienteDetailScreen(
                                    cliente: c,
                                    barberiaId: widget.barberiaId),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ]),
    );
  }

  Color _segColor(String s) {
    switch (s) {
      case 'frecuente':
        return Colors.greenAccent;
      case 'inactivo':
        return Colors.redAccent;
      default:
        return const Color(0xFFFACC15);
    }
  }
}
