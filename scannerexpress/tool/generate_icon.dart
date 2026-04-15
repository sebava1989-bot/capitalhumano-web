import 'dart:io';
import 'dart:math' as math;

// Genera un PNG 1024x1024 para el ícono de ScannerExpress
// Diseño: cámara blanca centrada + documento en esquina inferior derecha
// Fondo: azul #0071e3

void main() async {
  const size = 1024;
  // ARGB bytes: 4 bytes por pixel
  final pixels = List<int>.filled(size * size * 4, 0);

  // Colores
  const bgR = 0x00, bgG = 0x71, bgB = 0xe3; // #0071e3
  const white = 0xFF;
  const docFold = 0xCC; // blanco ligeramente oscuro para el pliegue

  void setPixel(int x, int y, int r, int g, int b, int a) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    final idx = (y * size + x) * 4;
    pixels[idx] = r;
    pixels[idx + 1] = g;
    pixels[idx + 2] = b;
    pixels[idx + 3] = a;
  }

  bool inRoundedRect(int x, int y, int rx, int ry, int rw, int rh, int radius) {
    if (x < rx || x >= rx + rw || y < ry || y >= ry + rh) return false;
    // esquinas redondeadas
    if (x < rx + radius && y < ry + radius) {
      return math.sqrt(math.pow(x - (rx + radius), 2) + math.pow(y - (ry + radius), 2)) <= radius;
    }
    if (x >= rx + rw - radius && y < ry + radius) {
      return math.sqrt(math.pow(x - (rx + rw - radius), 2) + math.pow(y - (ry + radius), 2)) <= radius;
    }
    if (x < rx + radius && y >= ry + rh - radius) {
      return math.sqrt(math.pow(x - (rx + radius), 2) + math.pow(y - (ry + rh - radius), 2)) <= radius;
    }
    if (x >= rx + rw - radius && y >= ry + rh - radius) {
      return math.sqrt(math.pow(x - (rx + rw - radius), 2) + math.pow(y - (ry + rh - radius), 2)) <= radius;
    }
    return true;
  }

  // 1. Fondo azul con esquinas redondeadas
  for (int y = 0; y < size; y++) {
    for (int x = 0; x < size; x++) {
      if (inRoundedRect(x, y, 0, 0, size, size, 180)) {
        setPixel(x, y, bgR, bgG, bgB, 255);
      }
    }
  }

  // 2. Cuerpo de la cámara (rectángulo blanco redondeado)
  const camX = 180, camY = 260, camW = 664, camH = 440, camR = 70;
  for (int y = 0; y < size; y++) {
    for (int x = 0; x < size; x++) {
      if (inRoundedRect(x, y, camX, camY, camW, camH, camR)) {
        setPixel(x, y, white, white, white, 255);
      }
    }
  }

  // 3. Joroba de la cámara (rectángulo pequeño arriba centrado)
  const humpX = 390, humpY = 200, humpW = 244, humpH = 80, humpR = 30;
  for (int y = 0; y < size; y++) {
    for (int x = 0; x < size; x++) {
      if (inRoundedRect(x, y, humpX, humpY, humpW, humpH, humpR)) {
        setPixel(x, y, white, white, white, 255);
      }
    }
  }

  // 4. Lente: círculo blanco exterior
  const lensX = 512, lensY = 480, lensOuter = 145, lensInner = 100;
  for (int y = 0; y < size; y++) {
    for (int x = 0; x < size; x++) {
      final dist = math.sqrt(math.pow(x - lensX, 2) + math.pow(y - lensY, 2));
      if (dist <= lensOuter) {
        setPixel(x, y, white, white, white, 255);
      }
    }
  }
  // 4b. Lente: círculo azul interior
  for (int y = 0; y < size; y++) {
    for (int x = 0; x < size; x++) {
      final dist = math.sqrt(math.pow(x - lensX, 2) + math.pow(y - lensY, 2));
      if (dist <= lensInner) {
        setPixel(x, y, bgR, bgG, bgB, 255);
      }
    }
  }
  // 4c. Lente: punto blanco interior
  for (int y = 0; y < size; y++) {
    for (int x = 0; x < size; x++) {
      final dist = math.sqrt(math.pow(x - lensX, 2) + math.pow(y - lensY, 2));
      if (dist <= 45) {
        setPixel(x, y, white, white, white, 255);
      }
    }
  }

  // 5. Documento pequeño (esquina inferior derecha, asomando)
  const docX = 620, docY = 580, docW = 230, docH = 290, docR = 18;
  // Sombra suave
  for (int y = 0; y < size; y++) {
    for (int x = 0; x < size; x++) {
      if (inRoundedRect(x, y, docX + 6, docY + 6, docW, docH, docR)) {
        final idx = (y * size + x) * 4;
        if (pixels[idx + 3] > 0) {
          pixels[idx] = (pixels[idx] * 0.85).round();
          pixels[idx + 1] = (pixels[idx + 1] * 0.85).round();
          pixels[idx + 2] = (pixels[idx + 2] * 0.85).round();
        }
      }
    }
  }
  // Cuerpo documento
  for (int y = 0; y < size; y++) {
    for (int x = 0; x < size; x++) {
      if (inRoundedRect(x, y, docX, docY, docW, docH, docR)) {
        setPixel(x, y, white, white, white, 255);
      }
    }
  }
  // Líneas de texto simuladas
  for (int line = 0; line < 4; line++) {
    final lineY = docY + 60 + line * 40;
    final lineW = line == 3 ? 100 : 160;
    for (int y = lineY; y < lineY + 14; y++) {
      for (int x = docX + 30; x < docX + 30 + lineW; x++) {
        if (x >= 0 && x < size && y >= 0 && y < size) {
          setPixel(x, y, bgR, bgG, bgB, 180);
        }
      }
    }
  }

  // Generar PNG raw (formato simple)
  final pngBytes = _encodePng(pixels, size, size);

  final outDir = Directory('assets');
  if (!outDir.existsSync()) outDir.createSync();

  final file = File('assets/icon.png');
  await file.writeAsBytes(pngBytes);
  print('✓ Ícono generado: ${file.path} (${pngBytes.length} bytes)');
}

// PNG encoder mínimo sin dependencias externas
List<int> _encodePng(List<int> rgba, int width, int height) {
  // Convertir RGBA a RGBA raw por filas con filtro None (0)
  final rawRows = <int>[];
  for (int y = 0; y < height; y++) {
    rawRows.add(0); // filter type None
    for (int x = 0; x < width; x++) {
      final idx = (y * width + x) * 4;
      rawRows.add(rgba[idx]);     // R
      rawRows.add(rgba[idx + 1]); // G
      rawRows.add(rgba[idx + 2]); // B
      rawRows.add(rgba[idx + 3]); // A
    }
  }

  final compressed = _zlibDeflate(rawRows);

  final out = <int>[];

  // PNG signature
  out.addAll([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  final ihdr = <int>[];
  ihdr.addAll(_int32(width));
  ihdr.addAll(_int32(height));
  ihdr.addAll([8, 6, 0, 0, 0]); // 8-bit RGBA
  _writeChunk(out, 'IHDR', ihdr);

  // IDAT chunk
  _writeChunk(out, 'IDAT', compressed);

  // IEND chunk
  _writeChunk(out, 'IEND', []);

  return out;
}

void _writeChunk(List<int> out, String type, List<int> data) {
  out.addAll(_int32(data.length));
  final typeBytes = type.codeUnits;
  out.addAll(typeBytes);
  out.addAll(data);
  final crc = _crc32([...typeBytes, ...data]);
  out.addAll(_int32(crc));
}

List<int> _int32(int v) => [
  (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF
];

// CRC32
final _crcTable = _buildCrcTable();
List<int> _buildCrcTable() {
  final table = List<int>.filled(256, 0);
  for (int n = 0; n < 256; n++) {
    int c = n;
    for (int k = 0; k < 8; k++) {
      c = (c & 1) != 0 ? 0xEDB88320 ^ (c >> 1) : c >> 1;
    }
    table[n] = c;
  }
  return table;
}

int _crc32(List<int> data) {
  int crc = 0xFFFFFFFF;
  for (final b in data) {
    crc = _crcTable[(crc ^ b) & 0xFF] ^ (crc >> 8);
  }
  return (crc ^ 0xFFFFFFFF) & 0xFFFFFFFF;
}

// Zlib/Deflate mínimo (store only, sin compresión)
List<int> _zlibDeflate(List<int> data) {
  final out = <int>[];
  // zlib header: CM=8, CINFO=7, FCHECK
  out.addAll([0x78, 0x01]);

  // deflate: bloques BTYPE=00 (no compression), max 65535 bytes cada uno
  int offset = 0;
  while (offset < data.length) {
    final blockSize = math.min(65535, data.length - offset);
    final isLast = (offset + blockSize >= data.length) ? 1 : 0;
    out.add(isLast); // BFINAL + BTYPE=00
    out.add(blockSize & 0xFF);
    out.add((blockSize >> 8) & 0xFF);
    out.add((~blockSize) & 0xFF);
    out.add(((~blockSize) >> 8) & 0xFF);
    out.addAll(data.sublist(offset, offset + blockSize));
    offset += blockSize;
  }

  // Adler-32 checksum
  int s1 = 1, s2 = 0;
  for (final b in data) {
    s1 = (s1 + b) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  final adler = (s2 << 16) | s1;
  out.addAll(_int32(adler));

  return out;
}
