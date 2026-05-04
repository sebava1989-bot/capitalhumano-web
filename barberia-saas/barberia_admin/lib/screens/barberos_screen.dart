import 'package:flutter/material.dart';
import '../models/barbero.dart';
import '../services/barberos_service.dart';
import 'barbero_form_screen.dart';

class BarberosScreen extends StatefulWidget {
  final String barberiaId;
  const BarberosScreen({super.key, required this.barberiaId});
  @override
  State<BarberosScreen> createState() => _BarberosScreenState();
}

class _BarberosScreenState extends State<BarberosScreen> {
  final _service = BarberosService();
  List<Barbero> _barberos = [];
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
      _barberos = data;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Barberos')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFFACC15),
        foregroundColor: Colors.black,
        onPressed: () async {
          await Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) =>
                      BarberoFormScreen(barberiaId: widget.barberiaId)));
          _load();
        },
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFFACC15)))
          : _barberos.isEmpty
              ? const Center(
                  child: Text('Sin barberos. Presiona + para agregar.',
                      style: TextStyle(color: Color(0xFFA1A1AA))))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _barberos.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final b = _barberos[i];
                    return ListTile(
                      tileColor: const Color(0xFF27272A),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      leading: const CircleAvatar(
                        backgroundColor: Color(0xFF3F3F46),
                        child: Icon(Icons.person,
                            color: Color(0xFFA1A1AA)),
                      ),
                      title: Text(b.nombre,
                          style: const TextStyle(color: Colors.white)),
                      subtitle: Text(
                          b.activo ? 'Activo' : 'Inactivo',
                          style: TextStyle(
                              color: b.activo
                                  ? Colors.greenAccent
                                  : Colors.redAccent,
                              fontSize: 12)),
                      trailing: IconButton(
                        icon: const Icon(Icons.edit_outlined,
                            color: Color(0xFFA1A1AA)),
                        onPressed: () async {
                          await Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => BarberoFormScreen(
                                      barberiaId: widget.barberiaId,
                                      barbero: b)));
                          _load();
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
