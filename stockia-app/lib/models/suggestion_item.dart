class ProductSuggestion {
  final String productId;
  final String productName;
  final String sku;
  final String confidence;
  final double score;

  ProductSuggestion({
    required this.productId,
    required this.productName,
    required this.sku,
    required this.confidence,
    required this.score,
  });

  factory ProductSuggestion.fromJson(Map<String, dynamic> j) => ProductSuggestion(
        productId: j['product_id'],
        productName: j['product_name'],
        sku: j['sku'] ?? '',
        confidence: j['confidence'],
        score: (j['score'] as num).toDouble(),
      );
}

class SuggestionItem {
  final String itemId;
  final String productName;
  final int quantity;
  final double unitPrice;
  String? matchedProductId;
  final List<ProductSuggestion> suggestions;

  SuggestionItem({
    required this.itemId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    this.matchedProductId,
    required this.suggestions,
  });

  factory SuggestionItem.fromJson(Map<String, dynamic> j) => SuggestionItem(
        itemId: j['item_id'],
        productName: j['product_name'],
        quantity: (j['quantity'] as num).toInt(),
        unitPrice: (j['unit_price'] as num).toDouble(),
        matchedProductId: j['matched_product_id'],
        suggestions: (j['suggestions'] as List)
            .map((s) => ProductSuggestion.fromJson(s))
            .toList(),
      );
}
