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

  @override
  Widget build(BuildContext context) {
    final r = widget.reserva;
    final fmt =
        DateFormat("EEEE d/MM/yyyy 'a las' HH:mm", 'es');
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
            _Botones(estado: _estado, onCambiar: _cambiarEstado),
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
  const _Botones({required this.estado, required this.onCambiar});

  @override
  Widget build(BuildContext context) {
    if (estado == 'pendiente') {
      return Column(children: [
        _Btn('Confirmar', Colors.greenAccent,
            () => onCambiar('confirmada')),
        const SizedBox(height: 12),
        _Btn('Cancelar', Colors.redAccent, () => onCambiar('cancelada')),
      ]);
    }
    if (estado == 'confirmada') {
      return Column(children: [
        _Btn('Completar', const Color(0xFFFACC15),
            () => onCambiar('completada')),
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
