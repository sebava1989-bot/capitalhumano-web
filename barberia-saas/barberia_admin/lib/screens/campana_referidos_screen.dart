import 'package:flutter/material.dart';
import '../services/campana_referidos_service.dart';

class CampanaReferidosScreen extends StatefulWidget {
  final String barberiaId;
  const CampanaReferidosScreen({super.key, required this.barberiaId});
  @override
  State<CampanaReferidosScreen> createState() => _CampanaReferidosScreenState();
}

class _CampanaReferidosScreenState extends State<CampanaReferidosScreen> {
  final _service = CampanaReferidosService();
  bool _loading = true;
  bool _saving = false;

  bool _activo = true;
  int _descuentoReferido = 10;
  int _premioReferidor = 10;
  bool _acumulable = true;
  int _maxPct = 50;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final config = await _service.getConfig(widget.barberiaId);
    if (!mounted || config == null) {
      setState(() => _loading = false);
      return;
    }
    setState(() {
      _activo = config.activo;
      _descuentoReferido = config.descuentoReferidoPct;
      _premioReferidor = config.premioReferidorPct;
      _acumulable = config.acumulable;
      _maxPct = config.maxPctPorServicio;
      _loading = false;
    });
  }

  Future<void> _guardar() async {
    setState(() => _saving = true);
    await _service.guardarConfig(
      widget.barberiaId,
      CampanaReferidosConfig(
        activo: _activo,
        descuentoReferidoPct: _descuentoReferido,
        premioReferidorPct: _premioReferidor,
        acumulable: _acumulable,
        maxPctPorServicio: _maxPct,
      ),
    );
    if (!mounted) return;
    setState(() => _saving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Campaña guardada'),
        backgroundColor: Color(0xFF27272A),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: Color(0xFFFACC15))),
      );
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Campaña de Referidos')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _SectionTitle('Estado'),
          _Card(
            child: SwitchListTile(
              title: const Text('Campaña activa',
                  style: TextStyle(color: Colors.white)),
              subtitle: Text(
                _activo ? 'Los códigos de referido están habilitados' : 'Campaña pausada',
                style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 12),
              ),
              value: _activo,
              activeColor: const Color(0xFFFACC15),
              onChanged: (v) => setState(() => _activo = v),
            ),
          ),
          const SizedBox(height: 20),
          _SectionTitle('Descuentos'),
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _PctField(
                  label: '% descuento para el referido',
                  hint: 'Descuento retroactivo en su primer corte',
                  value: _descuentoReferido,
                  onChanged: (v) => setState(() => _descuentoReferido = v),
                ),
                const Divider(color: Color(0xFF3F3F46)),
                _PctField(
                  label: '% premio para el referidor',
                  hint: 'Ganancia por cada referido exitoso',
                  value: _premioReferidor,
                  onChanged: (v) => setState(() => _premioReferidor = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _SectionTitle('Acumulación'),
          _Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Premios acumulables',
                      style: TextStyle(color: Colors.white)),
                  subtitle: const Text(
                    'El referidor acumula premios de múltiples referidos',
                    style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 12),
                  ),
                  value: _acumulable,
                  activeColor: const Color(0xFFFACC15),
                  onChanged: (v) => setState(() => _acumulable = v),
                ),
                if (_acumulable) ...[
                  const Divider(color: Color(0xFF3F3F46)),
                  _PctField(
                    label: 'Máximo % por servicio',
                    hint: '100% = aplica todo el acumulado en un solo corte',
                    value: _maxPct,
                    onChanged: (v) => setState(() => _maxPct = v),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _saving ? null : _guardar,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFACC15),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: _saving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.black))
                  : const Text('Guardar',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(text.toUpperCase(),
            style: const TextStyle(
                color: Color(0xFFA1A1AA), fontSize: 12, letterSpacing: 1)),
      );
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});
  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: const Color(0xFF27272A),
          borderRadius: BorderRadius.circular(12),
        ),
        child: child,
      );
}

class _PctField extends StatelessWidget {
  final String label;
  final String hint;
  final int value;
  final void Function(int) onChanged;
  const _PctField({
    required this.label,
    required this.hint,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: const TextStyle(color: Colors.white, fontSize: 14)),
                  const SizedBox(height: 2),
                  Text(hint,
                      style: const TextStyle(
                          color: Color(0xFFA1A1AA), fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(width: 12),
            SizedBox(
              width: 70,
              child: TextFormField(
                initialValue: value.toString(),
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  suffixText: '%',
                  suffixStyle: const TextStyle(color: Color(0xFFA1A1AA)),
                  filled: true,
                  fillColor: const Color(0xFF3F3F46),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                ),
                onChanged: (v) {
                  final n = int.tryParse(v) ?? value;
                  onChanged(n.clamp(1, 100));
                },
              ),
            ),
          ],
        ),
      );
}
