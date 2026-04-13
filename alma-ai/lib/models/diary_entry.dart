class DiaryEntry {
  final int mood; // 1-5
  final String text;
  final DateTime timestamp;

  const DiaryEntry({
    required this.mood,
    required this.text,
    required this.timestamp,
  });

  factory DiaryEntry.fromJson(Map<String, dynamic> json) => DiaryEntry(
        mood: json['mood'] as int,
        text: json['text'] as String? ?? '',
        timestamp: DateTime.parse(json['timestamp'] as String),
      );

  Map<String, dynamic> toJson() => {
        'mood': mood,
        'text': text,
        'timestamp': timestamp.toIso8601String(),
      };
}
