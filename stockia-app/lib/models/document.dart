class Document {
  final String id;
  final String folio;
  final String supplier;
  final double total;
  final String status;
  final DateTime createdAt;

  Document({
    required this.id,
    required this.folio,
    required this.supplier,
    required this.total,
    required this.status,
    required this.createdAt,
  });

  bool get isPending => status == 'pending';
  bool get isApplied => status == 'applied';

  factory Document.fromJson(Map<String, dynamic> j) => Document(
        id: j['id'],
        folio: j['folio']?.toString() ?? '',
        supplier: j['supplier'] ?? '',
        total: (j['total'] as num?)?.toDouble() ?? 0,
        status: j['status'] ?? 'pending',
        createdAt: DateTime.parse(j['created_at']),
      );
}
