# VisionGuard — Sistema de Control de Acceso Vehicular con LPR
**Fecha:** 2026-05-06
**Cliente:** Vision Security SpA
**Autor:** Sebastián Vargas / Tu Amigo Digital SpA

---

## 1. Resumen del Proyecto

Software de escritorio Windows para control de acceso vehicular en instalaciones de clientes de Vision Security. Captura el stream de una cámara EZVIZ vía RTSP, reconoce patentes chilenas en tiempo real usando IA (EasyOCR), consulta una base de datos local de vehículos registrados, muestra la ficha del conductor al guardia, y registra todos los movimientos de entrada/salida con exportación a Excel.

---

## 2. Requisitos Funcionales

### 2.1 Reconocimiento de Patentes
- Captura 1 fotograma por segundo del stream RTSP de la cámara EZVIZ
- Detecta patentes chilenas con formato `BBNN·NN` (nuevas) y `BBB·NNN` (antiguas)
- Solo procesa detecciones con confianza ≥ 80%
- Aplica cooldown de 2 minutos por patente para evitar registros duplicados
- Guarda el fotograma de la detección como evidencia del movimiento

### 2.2 Pantalla Principal (Monitor del Guardia)
- Muestra video en vivo de la cámara EZVIZ (stream RTSP)
- Panel lateral con ficha del último vehículo detectado:
  - Foto de la persona registrada
  - Patente detectada
  - Nombre completo
  - RUT
  - Empresa
  - Estado (Autorizado / No autorizado)
- Botones manuales: [REGISTRAR ENTRADA] y [REGISTRAR SALIDA]
- Barra inferior con contador de movimientos del día y timestamp de última detección

### 2.3 Vehículo No Registrado
- Si la patente detectada no existe en la base de datos, se abre automáticamente un formulario modal
- El guardia completa: nombre, RUT, empresa, motivo de visita
- El registro se guarda en la tabla `visitantes_temporales` y en `movimientos`
- El guardia puede cancelar si la detección fue un error

### 2.4 Historial y Reportes
- Pantalla de historial con tabla de movimientos filtrables por fecha
- Columnas: Patente, Nombre, Empresa, Entrada, Salida
- Botón [Exportar Excel] genera archivo `.xlsx` en `C:\VisionGuard\reportes\`
- Nombre del archivo: `reporte_YYYY-MM-DD.xlsx`
- Base de datos histórica permanente (sin límite de fechas)

### 2.5 Administración de Patentes
- Pantalla protegida con contraseña (configurada en `config.ini`)
- CRUD completo: agregar, editar y eliminar vehículos registrados
- Campos por vehículo: patente, nombre, RUT, empresa, teléfono, foto, autorizado (sí/no), notas
- Foto se almacena como archivo JPG en `C:\VisionGuard\data\fotos\`

---

## 3. Requisitos No Funcionales

- **Sin internet:** funciona completamente offline en la red local del cliente
- **Rendimiento:** el procesamiento de 1 fps no debe superar 50% de CPU en hardware mínimo
- **Hardware mínimo cliente:** Windows 10, 8 GB RAM, cámara EZVIZ en la misma red LAN/WiFi
- **Distribución:** un único instalador `.exe` sin necesidad de instalar Python ni dependencias externas
- **Peso estimado del instalador:** 400–600 MB (incluye modelos EasyOCR)

---

## 4. Arquitectura

### Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Interfaz de usuario | PyQt6 |
| Captura de video | OpenCV (RTSP) |
| Reconocimiento de patentes | EasyOCR |
| Base de datos | SQLite (via sqlite3) |
| Exportación Excel | openpyxl |
| Empaquetado | PyInstaller |
| Lenguaje | Python 3.11 |

### Componentes Internos

```
VisionGuard.exe
├── Motor de Video (hilo separado)
│   ├── OpenCV: captura RTSP
│   └── EasyOCR: detección de patentes
├── Interfaz PyQt6
│   ├── Pantalla principal (monitor guardia)
│   ├── Modal visitante no registrado
│   ├── Historial y reportes
│   └── Administración de patentes
└── Capa de datos
    ├── SQLite (visionguard.db)
    └── openpyxl (exportación)
```

### Estructura de Archivos en PC del Cliente

```
C:\VisionGuard\
├── VisionGuard.exe
├── config.ini                    ← IP cámara, contraseña admin
├── data\
│   ├── visionguard.db            ← base de datos SQLite
│   └── fotos\                    ← fotos JPG de personas registradas
│       ├── ABC123.jpg
│       └── DEF456.jpg
└── reportes\                     ← Excel exportados por fecha
    └── reporte_2026-05-06.xlsx
```

---

## 5. Base de Datos

### Tabla `vehiculos`
```sql
CREATE TABLE vehiculos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    patente     TEXT UNIQUE NOT NULL,
    nombre      TEXT NOT NULL,
    rut         TEXT,
    empresa     TEXT,
    telefono    TEXT,
    foto_path   TEXT,
    autorizado  INTEGER DEFAULT 1,
    notas       TEXT,
    creado_en   TEXT DEFAULT (datetime('now'))
);
```

### Tabla `movimientos`
```sql
CREATE TABLE movimientos (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    patente          TEXT NOT NULL,
    tipo             TEXT NOT NULL CHECK(tipo IN ('entrada', 'salida')),
    fecha            TEXT NOT NULL,
    hora             TEXT NOT NULL,
    foto_captura     TEXT,
    registrado_por   TEXT DEFAULT 'camara',
    created_at       TEXT DEFAULT (datetime('now'))
);
```

### Tabla `visitantes_temporales`
```sql
CREATE TABLE visitantes_temporales (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    patente  TEXT NOT NULL,
    nombre   TEXT NOT NULL,
    rut      TEXT,
    empresa  TEXT,
    motivo   TEXT,
    fecha    TEXT NOT NULL
);
```

---

## 6. Flujo de Detección

```
1. OpenCV captura 1 fotograma por segundo del RTSP
2. EasyOCR analiza el fotograma
3. ¿Se detectó texto con patrón de patente chilena y confianza ≥ 80%?
   → No: descartar, continuar al siguiente fotograma
   → Sí:
4. ¿La misma patente fue registrada hace menos de 2 minutos?
   → Sí: ignorar (evita duplicados de auto estacionado)
   → No:
5. ¿La patente existe en tabla vehiculos?
   → Sí: mostrar ficha en panel lateral + esperar acción del guardia
   → No: abrir modal de visitante no registrado
6. Guardia presiona [ENTRADA] o [SALIDA] (o completa formulario)
7. Guardar registro en tabla movimientos
```

---

## 7. Configuración (config.ini)

```ini
[camara]
rtsp_url = rtsp://admin:password@192.168.1.100:554/h264/ch1/main/av_stream

[admin]
password_hash = <bcrypt hash de la contraseña>

[deteccion]
confianza_minima = 0.80
cooldown_segundos = 120
fps_captura = 1
```

---

## 8. Lo Que Está Fuera de Alcance (v1.0)

- Soporte para múltiples cámaras por instalación
- Notificaciones por WhatsApp o email
- Consulta a registros externos (Registro Civil, SII)
- Panel web remoto para Vision Security
- Soporte para macOS o Linux

---

## 9. Criterios de Éxito

- El software detecta patentes chilenas con al menos 85% de precisión en condiciones de luz normal
- El guardia puede ver la ficha del vehículo en menos de 3 segundos desde que el auto aparece en cámara
- Los reportes Excel se generan correctamente con todos los movimientos del día
- El instalador `.exe` funciona en Windows 10/11 sin configuración adicional
