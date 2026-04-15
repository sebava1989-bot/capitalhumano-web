class Folder {
  final String id;
  final String name;
  final DateTime createdAt;

  Folder({required this.id, required this.name, required this.createdAt});

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'created_at': createdAt.millisecondsSinceEpoch,
  };

  factory Folder.fromMap(Map<String, dynamic> map) => Folder(
    id: map['id'] as String,
    name: map['name'] as String,
    createdAt: DateTime.fromMillisecondsSinceEpoch(map['created_at'] as int),
  );
}
