class StockAlert {
  final String productId;
  final String productName;
  final String sku;
  final int minStock;
  final int currentStock;
  final String warehouseName;

  StockAlert({
    required this.productId,
    required this.productName,
    required this.sku,
    required this.minStock,
    required this.currentStock,
    required this.warehouseName,
  });

  bool get isCritical => currentStock == 0 || currentStock < minStock ~/ 2;

  factory StockAlert.fromJson(Map<String, dynamic> j) => StockAlert(
        productId: j['product_id'],
        productName: j['product_name'],
        sku: j['sku'] ?? '',
        minStock: (j['min_stock'] as num).toInt(),
        currentStock: (j['current_stock'] as num).toInt(),
        warehouseName: j['warehouse_name'],
      );
}
