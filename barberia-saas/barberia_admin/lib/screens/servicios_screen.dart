import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/servicio.dart';
import '../services/servicios_service.dart';
import 'servicio_form_screen.dart';

class ServiciosScreen extends StatefulWidget {
  final String barberiaId;
  const ServiciosScreen({super.key, required this.barberiaId});
  @override
  State<ServiciosScreen> createState() => _ServiciosScreenState();
}

class _ServiciosScreenState extends State<ServiciosScreen> {
  final _service = ServiciosService();
  List<Servicio> _servicios = [];
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
      _servicios = data;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Servicios')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFFACC15),
        foregroundColor: Colors.black,
        onPressed: () async {
          await Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (_) =>
                      ServicioFormScreen(barberiaId: widget.barberiaId)));
          _load();
        },
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFFACC15)))
          : _servicios.isEmpty
              ? const Center(
                  child: Text('Sin servicios. Presiona + para agregar.',
                      style: TextStyle(color: Color(0xFFA1A1AA))))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _servicios.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final s = _servicios[i];
                    return ListTile(
                      tileColor: const Color(0xFF27272A),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      title: Text(s.nombre,
                          style: const TextStyle(color: Colors.white)),
                      subtitle: Text(
                          '${s.duracionMin} min · \$${NumberFormat('#,###').format(s.precio)}',
                          style: const TextStyle(
                              color: Color(0xFFA1A1AA), fontSize: 12)),
                      trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (!s.activo)
                              const Text('Inactivo',
                                  style: TextStyle(
                                      color: Colors.redAccent,
                                      fontSize: 11)),
                            IconButton(
                              icon: const Icon(Icons.edit_outlined,
                                  color: Color(0xFFA1A1AA)),
                              onPressed: () async {
                                await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (_) => ServicioFormScreen(
                                            barberiaId: widget.barberiaId,
                                            servicio: s)));
                                _load();
                              },
                            ),
                          ]),
                    );
                  },
                ),
    );
  }
}
