import 'package:flutter/material.dart';
import '../models/barbero.dart';
import '../services/barberos_service.dart';

class BarberoFormScreen extends StatefulWidget {
  final String barberiaId;
  final Barbero? barbero;
  const BarberoFormScreen(
      {super.key, required this.barberiaId, this.barbero});
  @override
  State<BarberoFormScreen> createState() => _BarberoFormScreenState();
}

class _BarberoFormScreenState extends State<BarberoFormScreen> {
  final _nombre = TextEditingController();
  bool _activo = true;
  bool _loading = false;
  final _service = BarberosService();

  @override
  void initState() {
    super.initState();
    if (widget.barbero != null) {
      _nombre.text = widget.barbero!.nombre;
      _activo = widget.barbero!.activo;
    }
  }

  Future<void> _guardar() async {
    if (_nombre.text.trim().isEmpty) return;
    setState(() => _loading = true);
    if (widget.barbero == null) {
      await _service.crear(widget.barberiaId, _nombre.text.trim());
    } else {
      await _service.actualizar(
          widget.barbero!.id, _nombre.text.trim(), _activo);
    }
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title: Text(widget.barbero == null
              ? 'Nuevo barbero'
              : 'Editar barbero')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          TextField(
            controller: _nombre,
            decoration: InputDecoration(
              hintText: 'Nombre del barbero',
              filled: true,
              fillColor: const Color(0xFF27272A),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide:
                      const BorderSide(color: Color(0xFFFACC15))),
            ),
          ),
          if (widget.barbero != null) ...[
            const SizedBox(height: 12),
            SwitchListTile(
              title: const Text('Activo',
                  style: TextStyle(color: Colors.white)),
              value: _activo,
              activeColor: const Color(0xFFFACC15),
              onChanged: (v) => setState(() => _activo = v),
              tileColor: const Color(0xFF27272A),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading ? null : _guardar,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFACC15),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                  widget.barbero == null ? 'Agregar barbero' : 'Guardar',
                  style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ]),
      ),
    );
  }
}
