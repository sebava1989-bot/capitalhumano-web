import 'package:flutter/material.dart';
import '../models/alianza.dart';
import '../services/alianzas_service.dart';
import 'alianza_form_screen.dart';

class AlianzasScreen extends StatefulWidget {
  final String barberiaId;
  const AlianzasScreen({super.key, required this.barberiaId});
  @override
  State<AlianzasScreen> createState() => _AlianzasScreenState();
}

class _AlianzasScreenState extends State<AlianzasScreen> {
  final _service = AlianzasService();
  List<Alianza> _alianzas = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await _service.getAll(widget.barberiaId);
    if (!mounted) return;
    setState(() {
      _alianzas = data;
      _loading = false;
    });
  }

  Future<void> _eliminar(Alianza a) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF27272A),
        title: const Text('¿Eliminar alianza?',
            style: TextStyle(color: Colors.white)),
        content: Text('Se eliminará "${a.nombre}".',
            style: const TextStyle(color: Color(0xFFA1A1AA))),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancelar')),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Eliminar',
                  style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    if (confirm == true) {
      await _service.eliminar(a.id);
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Alianzas')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFFACC15),
        foregroundColor: Colors.black,
        onPressed: () async {
          await Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) =>
                      AlianzaFormScreen(barberiaId: widget.barberiaId)));
          _load();
        },
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFFACC15)))
          : _alianzas.isEmpty
              ? const Center(
                  child: Text('Sin alianzas. Presiona + para crear.',
                      style: TextStyle(color: Color(0xFFA1A1AA))))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _alianzas.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final a = _alianzas[i];
                    return ListTile(
                      tileColor: const Color(0xFF27272A),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      title: Text(a.nombre,
                          style: const TextStyle(color: Colors.white)),
                      subtitle: Text(
                        '${a.descuentoPct != null ? "${a.descuentoPct}% descuento" : "Sin descuento"} · ${a.activo ? "Activa" : "Inactiva"}',
                        style: const TextStyle(
                            color: Color(0xFFA1A1AA), fontSize: 12),
                      ),
                      trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.edit_outlined,
                                  color: Color(0xFFA1A1AA)),
                              onPressed: () async {
                                await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (_) => AlianzaFormScreen(
                                            barberiaId: widget.barberiaId,
                                            alianza: a)));
                                _load();
                              },
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline,
                                  color: Colors.redAccent),
                              onPressed: () => _eliminar(a),
                            ),
                          ]),
                    );
                  },
                ),
    );
  }
}
