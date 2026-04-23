import 'package:flutter_test/flutter_test.dart';
import 'package:stockia_app/models/stock_alert.dart';
import 'package:stockia_app/models/movement.dart';
import 'package:stockia_app/models/product.dart';
import 'package:stockia_app/models/warehouse.dart';
import 'package:stockia_app/models/document.dart';
import 'package:stockia_app/models/suggestion_item.dart';

void main() {
  group('StockAlert.fromJson', () {
    test('parses all fields', () {
      final alert = StockAlert.fromJson({
        'product_id': 'p1',
        'product_name': 'Tornillo M8',
        'sku': 'TOR-M8',
        'min_stock': 10,
        'current_stock': 3,
        'warehouse_name': 'Principal',
      });
      expect(alert.productName, 'Tornillo M8');
      expect(alert.currentStock, 3);
      expect(alert.isCritical, isTrue);
    });
  });

  group('Movement.fromJson', () {
    test('parses type and quantity', () {
      final m = Movement.fromJson({
        'id': 'm1',
        'type': 'out',
        'quantity': 5,
        'product_name': 'Cemento',
        'responsible': 'Juan',
        'created_at': '2026-04-23T10:00:00.000Z',
      });
      expect(m.type, 'out');
      expect(m.quantity, 5);
      expect(m.isOut, isTrue);
    });
  });

  group('Product.fromJson', () {
    test('parses id and name', () {
      final p = Product.fromJson({
        'id': 'p1',
        'name': 'Tornillo M8',
        'sku': 'TOR-M8',
        'unit': 'unidad',
        'min_stock': 10,
        'active': true,
      });
      expect(p.id, 'p1');
      expect(p.unit, 'unidad');
    });
  });

  group('Warehouse.fromJson', () {
    test('parses id and name', () {
      final w = Warehouse.fromJson({'id': 'w1', 'name': 'Bodega Norte'});
      expect(w.name, 'Bodega Norte');
    });
  });

  group('Document.fromJson', () {
    test('parses status', () {
      final d = Document.fromJson({
        'id': 'd1',
        'folio': '12345',
        'supplier': 'Proveedor SA',
        'total': 500000,
        'status': 'pending',
        'created_at': '2026-04-23T10:00:00.000Z',
      });
      expect(d.status, 'pending');
      expect(d.isPending, isTrue);
    });
  });

  group('SuggestionItem.fromJson', () {
    test('parses suggestions list', () {
      final si = SuggestionItem.fromJson({
        'item_id': 'i1',
        'product_name': 'Tornillo M8 x 25mm',
        'quantity': 100,
        'unit_price': 50,
        'matched_product_id': null,
        'suggestions': [
          {'product_id': 'p1', 'product_name': 'Tornillo M8', 'sku': 'TOR', 'confidence': 'exact', 'score': 1.0},
        ],
      });
      expect(si.suggestions.length, 1);
      expect(si.suggestions[0].confidence, 'exact');
    });
  });
}
