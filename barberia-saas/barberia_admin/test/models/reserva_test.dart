import 'package:flutter_test/flutter_test.dart';
import 'package:barberia_admin/models/reserva.dart';

void main() {
  test('Reserva.fromJson parsea campos correctamente', () {
    final json = {
      'id': 'r1',
      'barberia_id': 'b1',
      'cliente_nombre': 'Juan',
      'fecha_hora': '2026-04-28T15:00:00',
      'estado': 'pendiente',
      'precio_final': 8500.0,
      'barberos': {'nombre': 'Pedro'},
      'servicios': {'nombre': 'Corte', 'duracion_min': 30},
    };
    final r = Reserva.fromJson(json);
    expect(r.id, 'r1');
    expect(r.clienteNombre, 'Juan');
    expect(r.estado, 'pendiente');
    expect(r.precioFinal, 8500.0);
    expect(r.barberoNombre, 'Pedro');
    expect(r.servicioNombre, 'Corte');
    expect(r.duracionMin, 30);
  });

  test('Reserva.fromJson maneja campos nulos', () {
    final json = {
      'id': 'r2',
      'barberia_id': 'b1',
      'cliente_nombre': null,
      'fecha_hora': '2026-04-28T10:00:00',
      'estado': 'confirmada',
    };
    final r = Reserva.fromJson(json);
    expect(r.clienteNombre, 'Sin nombre');
    expect(r.barberoNombre, null);
    expect(r.precioFinal, null);
  });
}
