import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/cliente.dart';
import '../models/alianza.dart';
import '../services/clientes_service.dart';
import '../services/alianzas_service.dart';

class ClienteDetailScreen extends StatefulWidget {
  final Cliente cliente;
  final String barberiaId;
  const ClienteDetailScreen(
      {super.key, required this.cliente, required this.barberiaId});
  @override
  State<ClienteDetailScreen> createState() => _ClienteDetailScreenState();
}

class _ClienteDetailScreenState extends State<ClienteDetailScreen> {
  final _cService = ClientesService();
  final _aService = AlianzasService();
  List<Alianza> _alianzas = [];
  List<Map<String, dynamic>> _historial = [];
  late List<String> _asignadas;

  @override
  void initState() {
    super.initState();
    _asignadas = List.from(widget.cliente.alianzasAsignadas);
    _load();
  }

  Future<void> _load() async {
    final results = await Future.wait([
      _aService.getAll(widget.barberiaId),
      _cService.getHistorial(widget.cliente.id),
    ]);
    if (!mounted) return;
    setState(() {
      _alianzas = results[0] as List<Alianza>;
      _historial = results[1] as List<Map<String, dynamic>>;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.cliente;
    return Scaffold(
      appBar: AppBar(title: Text(c.nombre)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (c.telefono != null) _InfoRow('Teléfono', c.telefono!),
          if (c.email != null) _InfoRow('Email', c.email!),
          if (c.referralCode != null && c.referralCode!.isNotEmpty)
            _InfoRow('Código ref.', c.referralCode!),
          const SizedBox(height: 16),
          Row(children: [
            _MiniStat('Visitas', '${c.totalVisitas}'),
            const SizedBox(width: 12),
            _MiniStat('Gasto total',
                '\$${NumberFormat('#,###').format(c.gastoTotal)}'),
            const SizedBox(width: 12),
            _MiniStat('Segmento', c.segmento),
          ]),
          const SizedBox(height: 24),
          const Text('Alianzas asignadas',
              style: TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          _alianzas.isEmpty
              ? const Text('Cargando...',
                  style: TextStyle(color: Color(0xFFA1A1AA)))
              : Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _alianzas.map((a) {
                    final asignada = _asignadas.contains(a.id);
                    return FilterChip(
                      label: Text(
                          '${a.nombre}${a.descuentoPct != null ? " (${a.descuentoPct}%)" : ""}'),
                      selected: asignada,
                      onSelected: (v) async {
                        if (v) {
                          await _cService.asignarAlianza(c.id, a.id);
                        } else {
                          await _cService.quitarAlianza(c.id, a.id);
                        }
                        if (mounted) {
                          setState(() {
                            if (v) {
                              _asignadas.add(a.id);
                            } else {
                              _asignadas.remove(a.id);
                            }
                          });
                        }
                      },
                      selectedColor: const Color(0xFFFACC15)
                          .withValues(alpha: 0.2),
                      labelStyle: TextStyle(
                          color: asignada
                              ? const Color(0xFFFACC15)
                              : const Color(0xFFA1A1AA),
                          fontSize: 12),
                    );
                  }).toList(),
                ),
          const SizedBox(height: 24),
          const Text('Últimas visitas',
              style: TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (_historial.isEmpty)
            const Text('Sin historial',
                style: TextStyle(color: Color(0xFFA1A1AA)))
          else
            ..._historial.map((h) {
              final fecha = DateFormat('dd/MM/yyyy HH:mm').format(
                  DateTime.parse(h['fecha_hora'] as String).toLocal());
              final servicio =
                  (h['servicios'] as Map?)?['nombre'] as String? ?? '-';
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF27272A),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(children: [
                    Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(servicio,
                                style: const TextStyle(
                                    color: Colors.white)),
                            Text(fecha,
                                style: const TextStyle(
                                    color: Color(0xFFA1A1AA),
                                    fontSize: 12)),
                          ]),
                    ),
                    Text(h['estado'] as String? ?? '',
                        style: const TextStyle(
                            color: Color(0xFFA1A1AA), fontSize: 12)),
                  ]),
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(children: [
          SizedBox(
              width: 110,
              child: Text(label,
                  style: const TextStyle(color: Color(0xFFA1A1AA)))),
          Expanded(
              child: Text(value,
                  style: const TextStyle(color: Colors.white))),
        ]),
      );
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  const _MiniStat(this.label, this.value);
  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
              color: const Color(0xFF27272A),
              borderRadius: BorderRadius.circular(10)),
          child: Column(children: [
            Text(value,
                style: const TextStyle(
                    color: Color(0xFFFACC15),
                    fontWeight: FontWeight.bold,
                    fontSize: 16)),
            const SizedBox(height: 2),
            Text(label,
                style: const TextStyle(
                    color: Color(0xFFA1A1AA), fontSize: 11)),
          ]),
        ),
      );
}
