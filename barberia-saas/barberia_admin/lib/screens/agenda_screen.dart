import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/reserva.dart';
import '../services/reservas_service.dart';
import 'reserva_detail_screen.dart';

class AgendaScreen extends StatefulWidget {
  final String barberiaId;
  const AgendaScreen({super.key, required this.barberiaId});
  @override
  State<AgendaScreen> createState() => _AgendaScreenState();
}

class _AgendaScreenState extends State<AgendaScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _service = ReservasService();
  int _refresh = 0;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hoy = DateTime.now();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Agenda'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => setState(() => _refresh++),
          )
        ],
        bottom: TabBar(
          controller: _tabs,
          labelColor: const Color(0xFFFACC15),
          unselectedLabelColor: const Color(0xFFA1A1AA),
          indicatorColor: const Color(0xFFFACC15),
          tabs: const [
            Tab(text: 'Hoy'),
            Tab(text: 'Mañana'),
            Tab(text: 'Esta semana'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _ReservasList(
              key: ValueKey('hoy$_refresh'),
              future: _service.getByFecha(widget.barberiaId, hoy),
              onTap: _abrir),
          _ReservasList(
              key: ValueKey('manana$_refresh'),
              future: _service.getByFecha(
                  widget.barberiaId, hoy.add(const Duration(days: 1))),
              onTap: _abrir),
          _ReservasList(
              key: ValueKey('semana$_refresh'),
              future: _service.getSemana(widget.barberiaId, hoy),
              onTap: _abrir),
        ],
      ),
    );
  }

  void _abrir(Reserva r) async {
    await Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => ReservaDetailScreen(reserva: r)));
    setState(() => _refresh++);
  }
}

class _ReservasList extends StatelessWidget {
  final Future<List<Reserva>> future;
  final void Function(Reserva) onTap;

  const _ReservasList({super.key, required this.future, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Reserva>>(
      future: future,
      builder: (ctx, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(
              child: CircularProgressIndicator(color: Color(0xFFFACC15)));
        }
        final reservas = snap.data ?? [];
        if (reservas.isEmpty) {
          return const Center(
              child: Text('Sin reservas',
                  style: TextStyle(color: Color(0xFFA1A1AA))));
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: reservas.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, i) => _ReservaCard(
              reserva: reservas[i], onTap: () => onTap(reservas[i])),
        );
      },
    );
  }
}

class _ReservaCard extends StatelessWidget {
  final Reserva reserva;
  final VoidCallback onTap;
  const _ReservaCard({required this.reserva, required this.onTap});

  Color get _estadoColor {
    switch (reserva.estado) {
      case 'confirmada':
        return Colors.greenAccent;
      case 'completada':
        return const Color(0xFFA1A1AA);
      case 'cancelada':
        return Colors.redAccent;
      default:
        return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    final hora = DateFormat('HH:mm').format(reserva.fechaHora);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF27272A),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(children: [
          SizedBox(
            width: 48,
            child: Text(hora,
                style: const TextStyle(
                    color: Color(0xFFFACC15),
                    fontWeight: FontWeight.bold,
                    fontSize: 15)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(reserva.clienteNombre,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600)),
                  Text(
                      '${reserva.servicioNombre ?? '-'} · ${reserva.barberoNombre ?? '-'}',
                      style: const TextStyle(
                          color: Color(0xFFA1A1AA), fontSize: 13)),
                ]),
          ),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _estadoColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(reserva.estado,
                style: TextStyle(color: _estadoColor, fontSize: 12)),
          ),
        ]),
      ),
    );
  }
}
