class Product {
  final String id;
  final String name;
  final String sku;
  final String unit;
  final int minStock;
  final bool active;

  Product({
    required this.id,
    required this.name,
    required this.sku,
    required this.unit,
    required this.minStock,
    required this.active,
  });

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j['id'],
        name: j['name'],
        sku: j['sku'] ?? '',
        unit: j['unit'] ?? 'unidad',
        minStock: (j['min_stock'] as num?)?.toInt() ?? 0,
        active: j['active'] ?? true,
      );
}
