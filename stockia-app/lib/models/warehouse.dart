class Warehouse {
  final String id;
  final String name;

  Warehouse({required this.id, required this.name});

  factory Warehouse.fromJson(Map<String, dynamic> j) =>
      Warehouse(id: j['id'], name: j['name']);
}
