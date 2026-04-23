class Movement {
  final String id;
  final String type;
  final int quantity;
  final String productName;
  final String? responsible;
  final DateTime createdAt;

  Movement({
    required this.id,
    required this.type,
    required this.quantity,
    required this.productName,
    this.responsible,
    required this.createdAt,
  });

  bool get isOut => type == 'out';

  factory Movement.fromJson(Map<String, dynamic> j) => Movement(
        id: j['id'],
        type: j['type'],
        quantity: (j['quantity'] as num).toInt(),
        productName: j['product_name'] ?? '',
        responsible: j['responsible'],
        createdAt: DateTime.parse(j['created_at']),
      );
}
