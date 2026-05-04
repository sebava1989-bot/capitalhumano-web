import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/reserva.dart';
import '../services/reservas_service.dart';

class ReservaDetailScreen extends StatefulWidget {
  final Reserva reserva;
  const ReservaDetailScreen({super.key, required this.reserva});
  @override
  State<ReservaDetailScreen> createState() => _ReservaDetailScreenState();
}

class _ReservaDetailScreenState extends State<ReservaDetailScreen> {
  late String _estado;
  bool _loading = false;
  final _service = ReservasService();

  @override
  void initState() {
    super.initState();
    _estado = widget.reserva.estado;
  }

  Future<void> _cambiarEstado(String nuevoEstado) async {
    setState(() => _loading = true);
    await _service.updateEstado(widget.reserva.id, nuevoEstado);
    if (!mounted) return;
    setState(() {
      _estado = nuevoEstado;
      _loading = false;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          content: Text('Reserva $nuevoEstado'),
          backgroundColor: const Color(0xFF27272A)),
    );
  }

  Future<void> _mostrarDialogoCompletar() async {
    final codigoCtrl = TextEditingController();
    if (!mounted) return;

    final confirmar = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF27272A),
        title: const Text('Completar cita',
            style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '¿El cliente fue referido por alguien?',
              style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 14),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: codigoCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Código de referido (opcional)',
                hintStyle: const TextStyle(color: Color(0xFF71717A)),
                filled: true,
                fillColor: const Color(0xFF3F3F46),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar',
                style: TextStyle(color: Color(0xFFA1A1AA))),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFACC15),
              foregroundColor: Colors.black,
            ),
            child: const Text('Confirmar',
                style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmar != true || !mounted) return;

    setState(() => _loading = true);
    final codigo = codigoCtrl.text.trim().isEmpty ? null : codigoCtrl.text.trim();
    final result = await _service.completarReserva(widget.reserva.id, codigo);
    if (!mounted) return;
    setState(() {
      if (result.ok) _estado = 'completada';
      _loading = false;
    });

    if (!result.ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(result.errorCodigo ?? 'Error al completar'),
            backgroundColor: Colors.redAccent),
      );
      return;
    }

    if (result.errorCodigo != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(result.errorCodigo!),
            backgroundColor: Colors.orange),
      );
    } else if (result.descuentoAplicado) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Cita completada — descuento ${result.descuentoPct}% aplicado al cliente'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Cita completada'),
            backgroundColor: Color(0xFF27272A)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.reserva;
    final fmt = DateFormat("EEEE d/MM/yyyy 'a las' HH:mm", 'es');
    return Scaffold(
      appBar: AppBar(title: const Text('Detalle reserva')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _InfoTile('Cliente', r.clienteNombre),
          if (r.clienteTelefono != null)
            _InfoTile('Teléfono', r.clienteTelefono!),
          if (r.clienteEmail != null) _InfoTile('Email', r.clienteEmail!),
          _InfoTile('Servicio', r.servicioNombre ?? '-'),
          _InfoTile('Barbero', r.barberoNombre ?? '-'),
          _InfoTile('Fecha', fmt.format(r.fechaHora)),
          if (r.duracionMin != null)
            _InfoTile('Duración', '${r.duracionMin} min'),
          if (r.precioFinal != null)
            _InfoTile('\$Precio',
                '\$${NumberFormat('#,###').format(r.precioFinal)}'),
          _InfoTile('Estado', _estado),
          const SizedBox(height: 32),
          if (_loading)
            const Center(
                child:
                    CircularProgressIndicator(color: Color(0xFFFACC15)))
          else
            _Botones(
              estado: _estado,
              onCambiar: _cambiarEstado,
              onCompletar: _mostrarDialogoCompletar,
            ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;
  const _InfoTile(this.label, this.value);
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(children: [
          SizedBox(
              width: 100,
              child: Text(label,
                  style: const TextStyle(color: Color(0xFFA1A1AA)))),
          Expanded(
              child: Text(value,
                  style: const TextStyle(color: Colors.white))),
        ]),
      );
}

class _Botones extends StatelessWidget {
  final String estado;
  final void Function(String) onCambiar;
  final VoidCallback onCompletar;
  const _Botones({
    required this.estado,
    required this.onCambiar,
    required this.onCompletar,
  });

  @override
  Widget build(BuildContext context) {
    if (estado == 'pendiente') {
      return Column(children: [
        _Btn('Confirmar', Colors.greenAccent, () => onCambiar('confirmada')),
        const SizedBox(height: 12),
        _Btn('Cancelar', Colors.redAccent, () => onCambiar('cancelada')),
      ]);
    }
    if (estado == 'confirmada') {
      return Column(children: [
        _Btn('Completar cita', const Color(0xFFFACC15), onCompletar),
        const SizedBox(height: 12),
        _Btn('Cancelar', Colors.redAccent, () => onCambiar('cancelada')),
      ]);
    }
    return Center(
      child: Text('Reserva $estado',
          style: const TextStyle(
              color: Color(0xFFA1A1AA),
              fontStyle: FontStyle.italic)),
    );
  }
}

class _Btn extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _Btn(this.label, this.color, this.onTap);
  @override
  Widget build(BuildContext context) => SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: onTap,
          style: ElevatedButton.styleFrom(
            backgroundColor: color,
            foregroundColor: Colors.black,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
          ),
          child: Text(label,
              style: const TextStyle(fontWeight: FontWeight.bold)),
        ),
      );
}
