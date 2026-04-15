class Document {
  final String id;
  final String name;
  final String? folderId;
  final int pages;
  final String pdfLocalPath;
  final String? pdfCloudUrl;
  final String? ocrText;
  final DateTime createdAt;
  final DateTime updatedAt;

  Document({
    required this.id,
    required this.name,
    this.folderId,
    required this.pages,
    required this.pdfLocalPath,
    this.pdfCloudUrl,
    this.ocrText,
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'folder_id': folderId,
    'pages': pages,
    'pdf_local_path': pdfLocalPath,
    'pdf_cloud_url': pdfCloudUrl,
    'ocr_text': ocrText,
    'created_at': createdAt.millisecondsSinceEpoch,
    'updated_at': updatedAt.millisecondsSinceEpoch,
  };

  factory Document.fromMap(Map<String, dynamic> map) => Document(
    id: map['id'] as String,
    name: map['name'] as String,
    folderId: map['folder_id'] as String?,
    pages: map['pages'] as int,
    pdfLocalPath: map['pdf_local_path'] as String,
    pdfCloudUrl: map['pdf_cloud_url'] as String?,
    ocrText: map['ocr_text'] as String?,
    createdAt: DateTime.fromMillisecondsSinceEpoch(map['created_at'] as int),
    updatedAt: DateTime.fromMillisecondsSinceEpoch(map['updated_at'] as int),
  );

  Document copyWith({
    String? name,
    String? folderId,
    String? pdfCloudUrl,
    String? ocrText,
    DateTime? updatedAt,
  }) => Document(
    id: id,
    name: name ?? this.name,
    folderId: folderId ?? this.folderId,
    pages: pages,
    pdfLocalPath: pdfLocalPath,
    pdfCloudUrl: pdfCloudUrl ?? this.pdfCloudUrl,
    ocrText: ocrText ?? this.ocrText,
    createdAt: createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
}
