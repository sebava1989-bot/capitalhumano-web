import 'package:flutter/material.dart';
import '../models/servicio.dart';
import '../services/servicios_service.dart';

class ServicioFormScreen extends StatefulWidget {
  final String barberiaId;
  final Servicio? servicio;
  const ServicioFormScreen(
      {super.key, required this.barberiaId, this.servicio});
  @override
  State<ServicioFormScreen> createState() => _ServicioFormScreenState();
}

class _ServicioFormScreenState extends State<ServicioFormScreen> {
  final _nombre = TextEditingController();
  final _duracion = TextEditingController();
  final _precio = TextEditingController();
  bool _activo = true;
  bool _loading = false;
  final _service = ServiciosService();

  @override
  void initState() {
    super.initState();
    if (widget.servicio != null) {
      final s = widget.servicio!;
      _nombre.text = s.nombre;
      _duracion.text = s.duracionMin.toString();
      _precio.text = s.precio.toStringAsFixed(0);
      _activo = s.activo;
    }
  }

  Future<void> _guardar() async {
    if (_nombre.text.trim().isEmpty) return;
    final dur = int.tryParse(_duracion.text) ?? 30;
    final precio = double.tryParse(_precio.text) ?? 0;
    setState(() => _loading = true);
    if (widget.servicio == null) {
      await _service.crear(
          widget.barberiaId, _nombre.text.trim(), dur, precio);
    } else {
      await _service.actualizar(
          widget.servicio!.id, _nombre.text.trim(), dur, precio, _activo);
    }
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title: Text(widget.servicio == null
              ? 'Nuevo servicio'
              : 'Editar servicio')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _campo(_nombre, 'Nombre del servicio'),
          const SizedBox(height: 12),
          _campo(_duracion, 'Duración (minutos)',
              tipo: TextInputType.number),
          const SizedBox(height: 12),
          _campo(_precio, 'Precio (\$)', tipo: TextInputType.number),
          if (widget.servicio != null) ...[
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
                  widget.servicio == null ? 'Crear servicio' : 'Guardar',
                  style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _campo(TextEditingController c, String hint,
          {TextInputType tipo = TextInputType.text}) =>
      TextField(
        controller: c,
        keyboardType: tipo,
        decoration: InputDecoration(
          hintText: hint,
          filled: true,
          fillColor: const Color(0xFF27272A),
          border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFFACC15)),
          ),
        ),
      );
}
