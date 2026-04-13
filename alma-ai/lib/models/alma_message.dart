class AlmaMessage {
  final String role; // 'user' | 'assistant'
  final String content;
  final DateTime timestamp;

  const AlmaMessage({
    required this.role,
    required this.content,
    required this.timestamp,
  });

  bool get isAlma => role == 'assistant';

  factory AlmaMessage.fromJson(Map<String, dynamic> json) => AlmaMessage(
        role: json['role'] as String,
        content: json['content'] as String,
        timestamp: DateTime.parse(json['timestamp'] as String),
      );

  Map<String, dynamic> toJson() => {
        'role': role,
        'content': content,
        'timestamp': timestamp.toIso8601String(),
      };
}
