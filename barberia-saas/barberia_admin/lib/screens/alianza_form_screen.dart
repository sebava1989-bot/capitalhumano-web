import 'package:flutter/material.dart';
import '../models/alianza.dart';
import '../services/alianzas_service.dart';

class AlianzaFormScreen extends StatefulWidget {
  final String barberiaId;
  final Alianza? alianza;
  const AlianzaFormScreen(
      {super.key, required this.barberiaId, this.alianza});
  @override
  State<AlianzaFormScreen> createState() => _AlianzaFormScreenState();
}

class _AlianzaFormScreenState extends State<AlianzaFormScreen> {
  final _nombre = TextEditingController();
  final _descuento = TextEditingController();
  final _codigo = TextEditingController();
  final _maxUsos = TextEditingController();
  bool _activo = true;
  bool _loading = false;
  final _service = AlianzasService();

  @override
  void initState() {
    super.initState();
    if (widget.alianza != null) {
      final a = widget.alianza!;
      _nombre.text = a.nombre;
      _descuento.text = a.descuentoPct?.toString() ?? '';
      _codigo.text = a.codigoAcceso ?? '';
      _maxUsos.text = a.maxUsosPorCliente?.toString() ?? '';
      _activo = a.activo;
    }
  }

  Future<void> _guardar() async {
    if (_nombre.text.trim().isEmpty) return;
    setState(() => _loading = true);
    final a = Alianza(
      id: widget.alianza?.id ?? '',
      nombre: _nombre.text.trim(),
      descuentoPct: int.tryParse(_descuento.text),
      activo: _activo,
      codigoAcceso: _codigo.text.trim().isEmpty ? null : _codigo.text.trim(),
      maxUsosPorCliente: int.tryParse(_maxUsos.text),
    );
    if (widget.alianza == null) {
      await _service.crear(a, widget.barberiaId);
    } else {
      await _service.actualizar(widget.alianza!.id, a);
    }
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final esNueva = widget.alianza == null;
    return Scaffold(
      appBar:
          AppBar(title: Text(esNueva ? 'Nueva alianza' : 'Editar alianza')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _campo(_nombre, 'Nombre de la alianza'),
          const SizedBox(height: 12),
          _campo(_descuento, 'Descuento %',
              tipo: TextInputType.number),
          const SizedBox(height: 12),
          _campo(_codigo, 'Código de acceso (opcional)'),
          const SizedBox(height: 12),
          _campo(_maxUsos, 'Máx. usos por cliente (opcional)',
              tipo: TextInputType.number),
          const SizedBox(height: 12),
          SwitchListTile(
            title: const Text('Activa',
                style: TextStyle(color: Colors.white)),
            value: _activo,
            activeColor: const Color(0xFFFACC15),
            onChanged: (v) => setState(() => _activo = v),
            tileColor: const Color(0xFF27272A),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
          ),
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
              child: _loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.black))
                  : Text(
                      esNueva ? 'Crear alianza' : 'Guardar cambios',
                      style:
                          const TextStyle(fontWeight: FontWeight.bold)),
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
