# VisionGuard — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una aplicación de escritorio Windows que captura streams RTSP de cámaras EZVIZ, reconoce patentes chilenas en tiempo real, muestra la ficha del vehículo al guardia, y registra todos los movimientos con exportación a Excel.

**Architecture:** Proceso Python 3.11 único con UI PyQt6, captura RTSP con OpenCV, reconocimiento de patentes con EasyOCR en un QThread separado, base de datos SQLite local, exportación openpyxl. Empaquetado como .exe standalone con PyInstaller.

**Tech Stack:** Python 3.11, PyQt6, opencv-python, easyocr, sqlite3, openpyxl, bcrypt, PyInstaller, pytest, pytest-qt

---

## Estructura de Archivos

```
C:\Users\sebas\visionguard\
├── main.py                        ← Punto de entrada, inicializa app PyQt6
├── config.ini                     ← Generado en primera ejecución
├── requirements.txt
├── visionguard.spec               ← PyInstaller spec
│
├── app/
│   ├── __init__.py
│   ├── config.py                  ← Leer/escribir config.ini
│   ├── database.py                ← SQLite: init tablas + CRUD
│   ├── detector.py                ← QThread: OpenCV + EasyOCR + cooldown
│   ├── exporter.py                ← Generar Excel con openpyxl
│   │
│   └── ui/
│       ├── __init__.py
│       ├── main_window.py         ← Ventana principal: video + panel ficha
│       ├── visitor_dialog.py      ← Modal visitante no registrado
│       ├── history_screen.py      ← Historial + exportar Excel
│       └── admin_screen.py        ← CRUD patentes protegido con contraseña
│
├── data/
│   └── fotos/                     ← Fotos JPG de personas (vacío inicial)
│
├── reportes/                      ← Excel exportados (vacío inicial)
│
└── tests/
    ├── __init__.py
    ├── test_config.py
    ├── test_database.py
    ├── test_detector.py
    └── test_exporter.py
```

---

## Task 1: Setup del Proyecto

**Files:**
- Create: `C:\Users\sebas\visionguard\requirements.txt`
- Create: `C:\Users\sebas\visionguard\app\__init__.py`
- Create: `C:\Users\sebas\visionguard\app\ui\__init__.py`
- Create: `C:\Users\sebas\visionguard\tests\__init__.py`

- [ ] **Step 1: Crear estructura de directorios**

```powershell
cd C:\Users\sebas
mkdir visionguard
cd visionguard
mkdir app, app\ui, data, data\fotos, reportes, tests
New-Item app\__init__.py, app\ui\__init__.py, tests\__init__.py -ItemType File
```

- [ ] **Step 2: Crear requirements.txt**

Crear `C:\Users\sebas\visionguard\requirements.txt`:
```
PyQt6==6.7.0
opencv-python==4.10.0.84
easyocr==1.7.2
openpyxl==3.1.5
bcrypt==4.2.0
pytest==8.3.2
pytest-qt==4.4.0
```

- [ ] **Step 3: Crear entorno virtual e instalar dependencias**

```powershell
cd C:\Users\sebas\visionguard
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Expected: todas las dependencias instaladas sin error. EasyOCR descarga modelos la primera vez (~100MB).

- [ ] **Step 4: Verificar instalación**

```powershell
python -c "import cv2; import easyocr; import PyQt6; import openpyxl; import bcrypt; print('OK')"
```

Expected output: `OK`

- [ ] **Step 5: Commit**

```powershell
cd C:\Users\sebas\visionguard
git init
git add .
git commit -m "chore: setup inicial VisionGuard"
```

---

## Task 2: Módulo de Configuración

**Files:**
- Create: `C:\Users\sebas\visionguard\app\config.py`
- Create: `C:\Users\sebas\visionguard\tests\test_config.py`

- [ ] **Step 1: Escribir el test**

Crear `tests\test_config.py`:
```python
import os
import tempfile
import pytest
from app.config import load_config, get_rtsp_url, get_deteccion_params, create_default_config

def test_create_default_config_genera_archivo():
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "config.ini")
        create_default_config(path)
        assert os.path.exists(path)

def test_load_config_valores_por_defecto():
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "config.ini")
        create_default_config(path)
        cfg = load_config(path)
        assert get_rtsp_url(cfg) == "rtsp://admin:password@192.168.1.100:554/h264/ch1/main/av_stream"

def test_get_deteccion_params_valores_por_defecto():
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "config.ini")
        create_default_config(path)
        cfg = load_config(path)
        params = get_deteccion_params(cfg)
        assert params["confianza_minima"] == 0.80
        assert params["cooldown_segundos"] == 120
        assert params["fps_captura"] == 1
```

- [ ] **Step 2: Ejecutar test para verificar que falla**

```powershell
pytest tests\test_config.py -v
```

Expected: FAIL con `ModuleNotFoundError`

- [ ] **Step 3: Implementar app\config.py**

```python
import configparser
import os

DEFAULT_CONFIG = {
    "camara": {
        "rtsp_url": "rtsp://admin:password@192.168.1.100:554/h264/ch1/main/av_stream"
    },
    "admin": {
        "password_hash": ""
    },
    "deteccion": {
        "confianza_minima": "0.80",
        "cooldown_segundos": "120",
        "fps_captura": "1"
    }
}


def create_default_config(config_path: str) -> None:
    cfg = configparser.ConfigParser()
    for section, values in DEFAULT_CONFIG.items():
        cfg[section] = values
    with open(config_path, "w") as f:
        cfg.write(f)


def load_config(config_path: str) -> configparser.ConfigParser:
    if not os.path.exists(config_path):
        create_default_config(config_path)
    cfg = configparser.ConfigParser()
    cfg.read(config_path)
    return cfg


def get_rtsp_url(cfg: configparser.ConfigParser) -> str:
    return cfg.get("camara", "rtsp_url")


def get_admin_password_hash(cfg: configparser.ConfigParser) -> str:
    return cfg.get("admin", "password_hash")


def set_admin_password_hash(cfg: configparser.ConfigParser, config_path: str, hash_value: str) -> None:
    cfg.set("admin", "password_hash", hash_value)
    with open(config_path, "w") as f:
        cfg.write(f)


def get_deteccion_params(cfg: configparser.ConfigParser) -> dict:
    return {
        "confianza_minima": cfg.getfloat("deteccion", "confianza_minima"),
        "cooldown_segundos": cfg.getint("deteccion", "cooldown_segundos"),
        "fps_captura": cfg.getint("deteccion", "fps_captura"),
    }
```

- [ ] **Step 4: Ejecutar tests para verificar que pasan**

```powershell
pytest tests\test_config.py -v
```

Expected: 3 tests PASSED

- [ ] **Step 5: Commit**

```powershell
git add app\config.py tests\test_config.py
git commit -m "feat: módulo de configuración config.ini"
```

---

## Task 3: Base de Datos SQLite

**Files:**
- Create: `C:\Users\sebas\visionguard\app\database.py`
- Create: `C:\Users\sebas\visionguard\tests\test_database.py`

- [ ] **Step 1: Escribir los tests**

Crear `tests\test_database.py`:
```python
import os
import tempfile
import pytest
from app.database import Database


@pytest.fixture
def db():
    with tempfile.TemporaryDirectory() as tmp:
        db_path = os.path.join(tmp, "test.db")
        fotos_dir = os.path.join(tmp, "fotos")
        os.makedirs(fotos_dir)
        database = Database(db_path, fotos_dir)
        yield database
        database.close()


def test_init_crea_tablas(db):
    vehiculos = db.list_vehiculos()
    assert isinstance(vehiculos, list)


def test_add_y_get_vehiculo(db):
    db.add_vehiculo({
        "patente": "AB12CD",
        "nombre": "Juan Pérez",
        "rut": "12.345.678-9",
        "empresa": "Sodexo",
        "telefono": "9 1234 5678",
        "foto_path": "",
        "autorizado": 1,
        "notas": ""
    })
    v = db.get_vehiculo("AB12CD")
    assert v is not None
    assert v["nombre"] == "Juan Pérez"
    assert v["autorizado"] == 1


def test_get_vehiculo_no_existente_retorna_none(db):
    assert db.get_vehiculo("ZZ99ZZ") is None


def test_update_vehiculo(db):
    db.add_vehiculo({"patente": "AB12CD", "nombre": "Juan", "rut": "", "empresa": "", "telefono": "", "foto_path": "", "autorizado": 1, "notas": ""})
    db.update_vehiculo("AB12CD", {"nombre": "Juan Actualizado", "empresa": "Nueva"})
    v = db.get_vehiculo("AB12CD")
    assert v["nombre"] == "Juan Actualizado"


def test_delete_vehiculo(db):
    db.add_vehiculo({"patente": "AB12CD", "nombre": "Juan", "rut": "", "empresa": "", "telefono": "", "foto_path": "", "autorizado": 1, "notas": ""})
    db.delete_vehiculo("AB12CD")
    assert db.get_vehiculo("AB12CD") is None


def test_add_y_get_movimientos(db):
    db.add_movimiento("AB12CD", "entrada", foto_captura="", registrado_por="camara")
    db.add_movimiento("AB12CD", "salida", foto_captura="", registrado_por="guardia")
    movs = db.get_movimientos_por_fecha("2026-05-06")
    assert isinstance(movs, list)


def test_add_visitante_temporal(db):
    db.add_visitante_temporal({
        "patente": "XY99ZZ",
        "nombre": "Visitante",
        "rut": "",
        "empresa": "Externa",
        "motivo": "Reunión",
        "fecha": "2026-05-06"
    })
    movs = db.get_movimientos_por_fecha("2026-05-06")
    assert isinstance(movs, list)


def test_count_movimientos_hoy(db):
    db.add_movimiento("AB12CD", "entrada", foto_captura="", registrado_por="camara")
    count = db.count_movimientos_hoy()
    assert count >= 1
```

- [ ] **Step 2: Ejecutar tests para verificar que fallan**

```powershell
pytest tests\test_database.py -v
```

Expected: FAIL con `ModuleNotFoundError`

- [ ] **Step 3: Implementar app\database.py**

```python
import sqlite3
import os
from datetime import date, datetime
from typing import Optional


class Database:
    def __init__(self, db_path: str, fotos_dir: str):
        self.db_path = db_path
        self.fotos_dir = fotos_dir
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_tables()

    def _init_tables(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS vehiculos (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                patente     TEXT UNIQUE NOT NULL,
                nombre      TEXT NOT NULL,
                rut         TEXT DEFAULT '',
                empresa     TEXT DEFAULT '',
                telefono    TEXT DEFAULT '',
                foto_path   TEXT DEFAULT '',
                autorizado  INTEGER DEFAULT 1,
                notas       TEXT DEFAULT '',
                creado_en   TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS movimientos (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                patente          TEXT NOT NULL,
                tipo             TEXT NOT NULL CHECK(tipo IN ('entrada', 'salida')),
                fecha            TEXT NOT NULL,
                hora             TEXT NOT NULL,
                foto_captura     TEXT DEFAULT '',
                registrado_por   TEXT DEFAULT 'camara',
                created_at       TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS visitantes_temporales (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                patente  TEXT NOT NULL,
                nombre   TEXT NOT NULL,
                rut      TEXT DEFAULT '',
                empresa  TEXT DEFAULT '',
                motivo   TEXT DEFAULT '',
                fecha    TEXT NOT NULL
            );
        """)
        self.conn.commit()

    def get_vehiculo(self, patente: str) -> Optional[dict]:
        row = self.conn.execute(
            "SELECT * FROM vehiculos WHERE patente = ?", (patente.upper(),)
        ).fetchone()
        return dict(row) if row else None

    def list_vehiculos(self) -> list:
        rows = self.conn.execute("SELECT * FROM vehiculos ORDER BY nombre").fetchall()
        return [dict(r) for r in rows]

    def add_vehiculo(self, data: dict) -> None:
        self.conn.execute(
            """INSERT INTO vehiculos (patente, nombre, rut, empresa, telefono, foto_path, autorizado, notas)
               VALUES (:patente, :nombre, :rut, :empresa, :telefono, :foto_path, :autorizado, :notas)""",
            {**{"rut": "", "empresa": "", "telefono": "", "foto_path": "", "autorizado": 1, "notas": ""}, **data,
             "patente": data["patente"].upper()}
        )
        self.conn.commit()

    def update_vehiculo(self, patente: str, data: dict) -> None:
        fields = ", ".join(f"{k} = :{k}" for k in data)
        self.conn.execute(
            f"UPDATE vehiculos SET {fields} WHERE patente = :_patente",
            {**data, "_patente": patente.upper()}
        )
        self.conn.commit()

    def delete_vehiculo(self, patente: str) -> None:
        self.conn.execute("DELETE FROM vehiculos WHERE patente = ?", (patente.upper(),))
        self.conn.commit()

    def add_movimiento(self, patente: str, tipo: str, foto_captura: str = "", registrado_por: str = "camara") -> None:
        now = datetime.now()
        self.conn.execute(
            """INSERT INTO movimientos (patente, tipo, fecha, hora, foto_captura, registrado_por)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (patente.upper(), tipo, now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S"), foto_captura, registrado_por)
        )
        self.conn.commit()

    def get_movimientos_por_fecha(self, fecha: str) -> list:
        rows = self.conn.execute(
            "SELECT * FROM movimientos WHERE fecha = ? ORDER BY hora", (fecha,)
        ).fetchall()
        return [dict(r) for r in rows]

    def count_movimientos_hoy(self) -> int:
        hoy = date.today().strftime("%Y-%m-%d")
        row = self.conn.execute(
            "SELECT COUNT(*) FROM movimientos WHERE fecha = ?", (hoy,)
        ).fetchone()
        return row[0]

    def add_visitante_temporal(self, data: dict) -> None:
        self.conn.execute(
            """INSERT INTO visitantes_temporales (patente, nombre, rut, empresa, motivo, fecha)
               VALUES (:patente, :nombre, :rut, :empresa, :motivo, :fecha)""",
            {**{"rut": "", "empresa": "", "motivo": ""}, **data,
             "patente": data["patente"].upper()}
        )
        self.conn.commit()

    def close(self):
        self.conn.close()
```

- [ ] **Step 4: Ejecutar tests para verificar que pasan**

```powershell
pytest tests\test_database.py -v
```

Expected: 8 tests PASSED

- [ ] **Step 5: Commit**

```powershell
git add app\database.py tests\test_database.py
git commit -m "feat: capa de base de datos SQLite con CRUD completo"
```

---

## Task 4: Exportador Excel

**Files:**
- Create: `C:\Users\sebas\visionguard\app\exporter.py`
- Create: `C:\Users\sebas\visionguard\tests\test_exporter.py`

- [ ] **Step 1: Escribir el test**

Crear `tests\test_exporter.py`:
```python
import os
import tempfile
import pytest
from app.exporter import export_to_excel


MOVIMIENTOS_MOCK = [
    {"patente": "AB12CD", "nombre": "Juan Pérez", "empresa": "Sodexo", "tipo": "entrada", "hora": "08:15:00", "fecha": "2026-05-06"},
    {"patente": "AB12CD", "nombre": "Juan Pérez", "empresa": "Sodexo", "tipo": "salida",  "hora": "12:30:00", "fecha": "2026-05-06"},
    {"patente": "XY99ZZ", "nombre": "Visitante",  "empresa": "",       "tipo": "entrada", "hora": "09:45:00", "fecha": "2026-05-06"},
]


def test_export_crea_archivo():
    with tempfile.TemporaryDirectory() as tmp:
        output_path = os.path.join(tmp, "reporte_2026-05-06.xlsx")
        export_to_excel(MOVIMIENTOS_MOCK, "2026-05-06", output_path)
        assert os.path.exists(output_path)


def test_export_archivo_no_vacio():
    with tempfile.TemporaryDirectory() as tmp:
        output_path = os.path.join(tmp, "reporte_2026-05-06.xlsx")
        export_to_excel(MOVIMIENTOS_MOCK, "2026-05-06", output_path)
        assert os.path.getsize(output_path) > 0


def test_export_lista_vacia_no_falla():
    with tempfile.TemporaryDirectory() as tmp:
        output_path = os.path.join(tmp, "reporte_vacio.xlsx")
        export_to_excel([], "2026-05-06", output_path)
        assert os.path.exists(output_path)
```

- [ ] **Step 2: Ejecutar tests para verificar que fallan**

```powershell
pytest tests\test_exporter.py -v
```

Expected: FAIL con `ModuleNotFoundError`

- [ ] **Step 3: Implementar app\exporter.py**

```python
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment


def export_to_excel(movimientos: list, fecha: str, output_path: str) -> str:
    wb = Workbook()
    ws = wb.active
    ws.title = f"Accesos {fecha}"

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="0A2A6E", end_color="0A2A6E", fill_type="solid")
    center = Alignment(horizontal="center")

    headers = ["Patente", "Nombre", "Empresa", "Tipo", "Hora"]
    col_widths = [12, 28, 24, 12, 12]

    for col, (h, w) in enumerate(zip(headers, col_widths), start=1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center
        ws.column_dimensions[cell.column_letter].width = w

    for row_idx, mov in enumerate(movimientos, start=2):
        ws.cell(row=row_idx, column=1, value=mov.get("patente", ""))
        ws.cell(row=row_idx, column=2, value=mov.get("nombre", ""))
        ws.cell(row=row_idx, column=3, value=mov.get("empresa", ""))
        ws.cell(row=row_idx, column=4, value=mov.get("tipo", "").capitalize())
        ws.cell(row=row_idx, column=5, value=mov.get("hora", "")[:5])

    os.makedirs(os.path.dirname(output_path), exist_ok=True) if os.path.dirname(output_path) else None
    wb.save(output_path)
    return output_path
```

- [ ] **Step 4: Ejecutar tests para verificar que pasan**

```powershell
pytest tests\test_exporter.py -v
```

Expected: 3 tests PASSED

- [ ] **Step 5: Commit**

```powershell
git add app\exporter.py tests\test_exporter.py
git commit -m "feat: exportador Excel con encabezados con colores corporativos"
```

---

## Task 5: Motor de Detección LPR

**Files:**
- Create: `C:\Users\sebas\visionguard\app\detector.py`
- Create: `C:\Users\sebas\visionguard\tests\test_detector.py`

- [ ] **Step 1: Escribir el test**

Crear `tests\test_detector.py`:
```python
import pytest
from app.detector import extract_patente, normalizar_patente, is_patente_chilena


def test_detecta_patente_nueva_formato():
    # Formato nuevo: 2 letras + 2 números + 2 letras (ej: AB12CD)
    assert is_patente_chilena("AB12CD") is True


def test_detecta_patente_antigua_formato():
    # Formato antiguo: 3 letras + 3 números (ej: ABC123)
    assert is_patente_chilena("ABC123") is True


def test_rechaza_texto_no_patente():
    assert is_patente_chilena("HOLA") is False
    assert is_patente_chilena("12345") is False
    assert is_patente_chilena("AB1CD") is False


def test_normalizar_patente_quita_guiones():
    assert normalizar_patente("AB-12-CD") == "AB12CD"
    assert normalizar_patente("ABC-123") == "ABC123"
    assert normalizar_patente("AB·12·CD") == "AB12CD"


def test_extract_patente_de_resultados_easyocr():
    # EasyOCR retorna lista de [bbox, text, confidence]
    resultados_mock = [
        ([[0,0],[0,0],[0,0],[0,0]], "AB12CD", 0.92),
        ([[0,0],[0,0],[0,0],[0,0]], "ENTRADA", 0.88),
        ([[0,0],[0,0],[0,0],[0,0]], "ABC123", 0.85),
    ]
    patente, confianza = extract_patente(resultados_mock, confianza_minima=0.80)
    assert patente in ("AB12CD", "ABC123")
    assert confianza >= 0.80


def test_extract_patente_retorna_none_si_no_hay():
    resultados_mock = [
        ([[0,0],[0,0],[0,0],[0,0]], "EMPRESA SA", 0.91),
    ]
    resultado = extract_patente(resultados_mock, confianza_minima=0.80)
    assert resultado is None


def test_extract_patente_ignora_baja_confianza():
    resultados_mock = [
        ([[0,0],[0,0],[0,0],[0,0]], "AB12CD", 0.65),
    ]
    resultado = extract_patente(resultados_mock, confianza_minima=0.80)
    assert resultado is None
```

- [ ] **Step 2: Ejecutar tests para verificar que fallan**

```powershell
pytest tests\test_detector.py -v
```

Expected: FAIL con `ModuleNotFoundError`

- [ ] **Step 3: Implementar app\detector.py**

```python
import re
import time
import os
import cv2
import easyocr
import numpy as np
from datetime import datetime
from PyQt6.QtCore import QThread, pyqtSignal
from typing import Optional, Tuple

PATRON_NUEVA = re.compile(r'^[A-Z]{2}\d{2}[A-Z]{2}$')
PATRON_ANTIGUA = re.compile(r'^[A-Z]{3}\d{3}$')
CARACTERES_AMBIGUOS = str.maketrans({'O': '0', 'I': '1', 'S': '5', 'B': '8'})


def normalizar_patente(texto: str) -> str:
    texto = texto.upper().strip()
    for ch in ['-', '·', '.', ' ', '_']:
        texto = texto.replace(ch, '')
    return texto


def is_patente_chilena(texto: str) -> bool:
    t = normalizar_patente(texto)
    return bool(PATRON_NUEVA.match(t) or PATRON_ANTIGUA.match(t))


def extract_patente(resultados: list, confianza_minima: float = 0.80) -> Optional[Tuple[str, float]]:
    for (_bbox, texto, confianza) in resultados:
        if confianza < confianza_minima:
            continue
        normalizado = normalizar_patente(texto)
        if is_patente_chilena(normalizado):
            return (normalizado, confianza)
    return None


class LPRDetector(QThread):
    plate_detected = pyqtSignal(str, object)   # (patente, frame_numpy)
    frame_ready = pyqtSignal(object)            # frame_numpy para mostrar en UI
    connection_error = pyqtSignal(str)          # mensaje de error

    def __init__(self, rtsp_url: str, confianza_minima: float = 0.80,
                 cooldown_segundos: int = 120, fps_captura: int = 1):
        super().__init__()
        self.rtsp_url = rtsp_url
        self.confianza_minima = confianza_minima
        self.cooldown_segundos = cooldown_segundos
        self.fps_captura = fps_captura
        self._running = False
        self._cooldown: dict[str, float] = {}
        self.reader = easyocr.Reader(['es', 'en'], gpu=False)

    def run(self):
        self._running = True
        cap = cv2.VideoCapture(self.rtsp_url)
        if not cap.isOpened():
            self.connection_error.emit(f"No se pudo conectar a: {self.rtsp_url}")
            return

        last_capture = 0.0
        interval = 1.0 / self.fps_captura

        while self._running:
            ret, frame = cap.read()
            if not ret:
                self.connection_error.emit("Se perdió la conexión con la cámara")
                break

            self.frame_ready.emit(frame.copy())

            now = time.time()
            if now - last_capture >= interval:
                last_capture = now
                self._procesar_frame(frame)

        cap.release()

    def _procesar_frame(self, frame: np.ndarray):
        resultados = self.reader.readtext(frame)
        detectado = extract_patente(resultados, self.confianza_minima)
        if detectado is None:
            return

        patente, _ = detectado
        if self._en_cooldown(patente):
            return

        self._cooldown[patente] = time.time()
        self.plate_detected.emit(patente, frame.copy())

    def _en_cooldown(self, patente: str) -> bool:
        ultimo = self._cooldown.get(patente)
        if ultimo is None:
            return False
        return (time.time() - ultimo) < self.cooldown_segundos

    def stop(self):
        self._running = False
        self.wait()

    def save_frame(self, frame: np.ndarray, output_dir: str, patente: str) -> str:
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{patente}_{timestamp}.jpg"
        path = os.path.join(output_dir, filename)
        cv2.imwrite(path, frame)
        return path
```

- [ ] **Step 4: Ejecutar tests para verificar que pasan**

```powershell
pytest tests\test_detector.py -v
```

Expected: 6 tests PASSED

- [ ] **Step 5: Commit**

```powershell
git add app\detector.py tests\test_detector.py
git commit -m "feat: motor LPR con EasyOCR, patrones chilenos y cooldown"
```

---

## Task 6: Ventana Principal

**Files:**
- Create: `C:\Users\sebas\visionguard\app\ui\main_window.py`

- [ ] **Step 1: Implementar main_window.py**

Crear `app\ui\main_window.py`:
```python
import os
import cv2
import numpy as np
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QHBoxLayout, QVBoxLayout,
    QLabel, QPushButton, QStatusBar, QFrame, QMessageBox
)
from PyQt6.QtGui import QImage, QPixmap, QFont
from PyQt6.QtCore import Qt, QSize

STYLE = """
QMainWindow { background: #0a2a6e; }
QWidget#central { background: #0a2a6e; }
QLabel#video_label { background: #000; border: 2px solid #1565c0; }
QFrame#panel_ficha { background: #0d3580; border: 2px solid #1565c0; border-radius: 8px; }
QLabel { color: white; }
QLabel#lbl_patente { font-size: 28px; font-weight: bold; color: #FFD700; }
QLabel#lbl_nombre { font-size: 16px; font-weight: bold; }
QLabel#lbl_estado_ok { color: #4caf50; font-size: 14px; font-weight: bold; }
QLabel#lbl_estado_no { color: #f44336; font-size: 14px; font-weight: bold; }
QPushButton#btn_entrada {
    background: #1976d2; color: white; border-radius: 6px;
    padding: 10px; font-size: 14px; font-weight: bold;
}
QPushButton#btn_entrada:hover { background: #1565c0; }
QPushButton#btn_salida {
    background: #388e3c; color: white; border-radius: 6px;
    padding: 10px; font-size: 14px; font-weight: bold;
}
QPushButton#btn_salida:hover { background: #2e7d32; }
QPushButton#btn_historial {
    background: #555; color: white; border-radius: 4px; padding: 6px 12px;
}
QPushButton#btn_admin {
    background: #333; color: #aaa; border-radius: 4px; padding: 6px 12px;
}
QStatusBar { background: #061a4a; color: #aaa; }
"""


class MainWindow(QMainWindow):
    def __init__(self, db, config, detector, fotos_dir, reportes_dir):
        super().__init__()
        self.db = db
        self.config = config
        self.detector = detector
        self.fotos_dir = fotos_dir
        self.reportes_dir = reportes_dir
        self.current_patente = None
        self.current_frame = None

        self.setWindowTitle("VisionGuard — Control de Acceso Vehicular")
        self.setMinimumSize(1100, 650)
        self.setStyleSheet(STYLE)

        self._build_ui()
        self._connect_signals()
        self.detector.start()

    def _build_ui(self):
        central = QWidget(objectName="central")
        self.setCentralWidget(central)
        root = QHBoxLayout(central)
        root.setContentsMargins(10, 10, 10, 10)
        root.setSpacing(10)

        # --- Video ---
        self.video_label = QLabel(objectName="video_label")
        self.video_label.setMinimumSize(640, 480)
        self.video_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.video_label.setText("Conectando cámara...")
        root.addWidget(self.video_label, stretch=3)

        # --- Panel ficha ---
        panel = QFrame(objectName="panel_ficha")
        panel.setFixedWidth(320)
        panel_layout = QVBoxLayout(panel)
        panel_layout.setContentsMargins(16, 16, 16, 16)
        panel_layout.setSpacing(8)

        titulo = QLabel("ÚLTIMO ACCESO DETECTADO")
        titulo.setAlignment(Qt.AlignmentFlag.AlignCenter)
        titulo.setFont(QFont("Arial", 10, QFont.Weight.Bold))
        panel_layout.addWidget(titulo)

        self.foto_label = QLabel()
        self.foto_label.setFixedSize(180, 180)
        self.foto_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.foto_label.setStyleSheet("border: 2px solid #1565c0; background: #061a4a;")
        self._set_foto(None)
        panel_layout.addWidget(self.foto_label, alignment=Qt.AlignmentFlag.AlignCenter)

        self.lbl_patente = QLabel("---", objectName="lbl_patente")
        self.lbl_patente.setAlignment(Qt.AlignmentFlag.AlignCenter)
        panel_layout.addWidget(self.lbl_patente)

        self.lbl_nombre = QLabel("Sin detección", objectName="lbl_nombre")
        self.lbl_nombre.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.lbl_nombre.setWordWrap(True)
        panel_layout.addWidget(self.lbl_nombre)

        self.lbl_rut = QLabel("")
        self.lbl_rut.setAlignment(Qt.AlignmentFlag.AlignCenter)
        panel_layout.addWidget(self.lbl_rut)

        self.lbl_empresa = QLabel("")
        self.lbl_empresa.setAlignment(Qt.AlignmentFlag.AlignCenter)
        panel_layout.addWidget(self.lbl_empresa)

        self.lbl_estado = QLabel("")
        self.lbl_estado.setAlignment(Qt.AlignmentFlag.AlignCenter)
        panel_layout.addWidget(self.lbl_estado)

        panel_layout.addStretch()

        self.btn_entrada = QPushButton("▶  REGISTRAR ENTRADA", objectName="btn_entrada")
        self.btn_entrada.setEnabled(False)
        self.btn_entrada.clicked.connect(self._on_registrar_entrada)
        panel_layout.addWidget(self.btn_entrada)

        self.btn_salida = QPushButton("◀  REGISTRAR SALIDA", objectName="btn_salida")
        self.btn_salida.setEnabled(False)
        self.btn_salida.clicked.connect(self._on_registrar_salida)
        panel_layout.addWidget(self.btn_salida)

        panel_layout.addSpacing(8)

        self.btn_historial = QPushButton("📋  Ver Historial", objectName="btn_historial")
        self.btn_historial.clicked.connect(self._on_ver_historial)
        panel_layout.addWidget(self.btn_historial)

        self.btn_admin = QPushButton("⚙  Administración", objectName="btn_admin")
        self.btn_admin.clicked.connect(self._on_admin)
        panel_layout.addWidget(self.btn_admin)

        root.addWidget(panel, stretch=0)

        # --- Status bar ---
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self._update_status_bar()

    def _connect_signals(self):
        self.detector.frame_ready.connect(self._on_frame_ready)
        self.detector.plate_detected.connect(self._on_plate_detected)
        self.detector.connection_error.connect(self._on_camera_error)

    def _on_frame_ready(self, frame):
        self.current_frame = frame
        h, w, ch = frame.shape
        img = QImage(frame.data, w, h, ch * w, QImage.Format.Format_BGR888)
        pix = QPixmap.fromImage(img).scaled(
            self.video_label.size(), Qt.AspectRatioMode.KeepAspectRatio,
            Qt.TransformationMode.SmoothTransformation
        )
        self.video_label.setPixmap(pix)

    def _on_plate_detected(self, patente: str, frame):
        self.current_patente = patente
        vehiculo = self.db.get_vehiculo(patente)

        if vehiculo is None:
            from app.ui.visitor_dialog import VisitorDialog
            dlg = VisitorDialog(patente, self)
            if dlg.exec():
                data = dlg.get_data()
                self.db.add_visitante_temporal({**data, "fecha": __import__("datetime").date.today().strftime("%Y-%m-%d")})
                foto_path = self.detector.save_frame(frame, self.fotos_dir, patente) if frame is not None else ""
                self.db.add_movimiento(patente, "entrada", foto_captura=foto_path, registrado_por="guardia")
                self._update_status_bar()
            return

        self._mostrar_ficha(vehiculo)
        self.btn_entrada.setEnabled(True)
        self.btn_salida.setEnabled(True)

    def _mostrar_ficha(self, vehiculo: dict):
        self.lbl_patente.setText(vehiculo["patente"])
        self.lbl_nombre.setText(vehiculo["nombre"])
        self.lbl_rut.setText(f"RUT: {vehiculo.get('rut','')}")
        self.lbl_empresa.setText(vehiculo.get("empresa", ""))

        if vehiculo.get("autorizado", 1):
            self.lbl_estado.setObjectName("lbl_estado_ok")
            self.lbl_estado.setText("✅  AUTORIZADO")
        else:
            self.lbl_estado.setObjectName("lbl_estado_no")
            self.lbl_estado.setText("🚫  NO AUTORIZADO")
        self.lbl_estado.setStyle(self.lbl_estado.style())

        foto = vehiculo.get("foto_path", "")
        self._set_foto(foto if foto and os.path.exists(foto) else None)

    def _set_foto(self, path: str):
        if path:
            pix = QPixmap(path).scaled(180, 180, Qt.AspectRatioMode.KeepAspectRatio,
                                       Qt.TransformationMode.SmoothTransformation)
            self.foto_label.setPixmap(pix)
        else:
            self.foto_label.setText("Sin foto")

    def _on_registrar_entrada(self):
        if not self.current_patente:
            return
        foto_path = self.detector.save_frame(self.current_frame, self.fotos_dir, self.current_patente) if self.current_frame is not None else ""
        self.db.add_movimiento(self.current_patente, "entrada", foto_captura=foto_path, registrado_por="guardia")
        self._update_status_bar()
        self.btn_entrada.setEnabled(False)
        self.btn_salida.setEnabled(False)

    def _on_registrar_salida(self):
        if not self.current_patente:
            return
        foto_path = self.detector.save_frame(self.current_frame, self.fotos_dir, self.current_patente) if self.current_frame is not None else ""
        self.db.add_movimiento(self.current_patente, "salida", foto_captura=foto_path, registrado_por="guardia")
        self._update_status_bar()
        self.btn_entrada.setEnabled(False)
        self.btn_salida.setEnabled(False)

    def _update_status_bar(self):
        count = self.db.count_movimientos_hoy()
        from datetime import datetime
        ts = datetime.now().strftime("%H:%M:%S")
        self.status_bar.showMessage(f"  Movimientos hoy: {count}   |   Última actualización: {ts}")

    def _on_ver_historial(self):
        from app.ui.history_screen import HistoryScreen
        screen = HistoryScreen(self.db, self.reportes_dir, self)
        screen.exec()

    def _on_admin(self):
        from app.ui.admin_screen import AdminScreen
        screen = AdminScreen(self.db, self.config, self.fotos_dir, self)
        screen.exec()

    def _on_camera_error(self, msg: str):
        self.video_label.setText(f"⚠  Error de cámara\n{msg}")

    def closeEvent(self, event):
        self.detector.stop()
        super().closeEvent(event)
```

- [ ] **Step 2: Verificar importaciones manualmente**

```powershell
python -c "from app.ui.main_window import MainWindow; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```powershell
git add app\ui\main_window.py
git commit -m "feat: ventana principal con video RTSP y panel de ficha de vehículo"
```

---

## Task 7: Modal Visitante No Registrado

**Files:**
- Create: `C:\Users\sebas\visionguard\app\ui\visitor_dialog.py`

- [ ] **Step 1: Implementar visitor_dialog.py**

Crear `app\ui\visitor_dialog.py`:
```python
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel,
    QLineEdit, QPushButton, QFormLayout
)
from PyQt6.QtCore import Qt

STYLE = """
QDialog { background: #0a2a6e; }
QLabel { color: white; }
QLabel#lbl_titulo { font-size: 16px; font-weight: bold; color: #FFD700; }
QLabel#lbl_patente { font-size: 22px; font-weight: bold; color: #FFD700; }
QLineEdit {
    background: #0d3580; color: white; border: 1px solid #1565c0;
    border-radius: 4px; padding: 6px; font-size: 13px;
}
QPushButton#btn_registrar {
    background: #1976d2; color: white; border-radius: 6px;
    padding: 10px; font-size: 14px; font-weight: bold;
}
QPushButton#btn_cancelar {
    background: #555; color: white; border-radius: 6px;
    padding: 10px; font-size: 14px;
}
"""


class VisitorDialog(QDialog):
    def __init__(self, patente: str, parent=None):
        super().__init__(parent)
        self.patente = patente
        self.setWindowTitle("Visitante No Registrado")
        self.setFixedSize(420, 380)
        self.setStyleSheet(STYLE)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(12)

        lbl_titulo = QLabel("⚠  PATENTE NO REGISTRADA", objectName="lbl_titulo")
        lbl_titulo.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(lbl_titulo)

        lbl_pat = QLabel(self.patente, objectName="lbl_patente")
        lbl_pat.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(lbl_pat)

        lbl_inst = QLabel("Complete los datos del visitante:")
        lbl_inst.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(lbl_inst)

        form = QFormLayout()
        form.setSpacing(8)

        self.inp_nombre = QLineEdit()
        self.inp_nombre.setPlaceholderText("Nombre completo")
        form.addRow(QLabel("Nombre:"), self.inp_nombre)

        self.inp_rut = QLineEdit()
        self.inp_rut.setPlaceholderText("12.345.678-9")
        form.addRow(QLabel("RUT:"), self.inp_rut)

        self.inp_empresa = QLineEdit()
        self.inp_empresa.setPlaceholderText("Empresa (opcional)")
        form.addRow(QLabel("Empresa:"), self.inp_empresa)

        self.inp_motivo = QLineEdit()
        self.inp_motivo.setPlaceholderText("Motivo de visita")
        form.addRow(QLabel("Motivo:"), self.inp_motivo)

        layout.addLayout(form)
        layout.addStretch()

        btns = QHBoxLayout()
        btn_registrar = QPushButton("REGISTRAR VISITA", objectName="btn_registrar")
        btn_registrar.clicked.connect(self._on_registrar)
        btn_cancelar = QPushButton("CANCELAR", objectName="btn_cancelar")
        btn_cancelar.clicked.connect(self.reject)
        btns.addWidget(btn_registrar)
        btns.addWidget(btn_cancelar)
        layout.addLayout(btns)

    def _on_registrar(self):
        if not self.inp_nombre.text().strip():
            self.inp_nombre.setFocus()
            return
        self.accept()

    def get_data(self) -> dict:
        return {
            "patente": self.patente,
            "nombre": self.inp_nombre.text().strip(),
            "rut": self.inp_rut.text().strip(),
            "empresa": self.inp_empresa.text().strip(),
            "motivo": self.inp_motivo.text().strip(),
        }
```

- [ ] **Step 2: Verificar importación**

```powershell
python -c "from app.ui.visitor_dialog import VisitorDialog; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```powershell
git add app\ui\visitor_dialog.py
git commit -m "feat: modal de registro de visitante no registrado"
```

---

## Task 8: Pantalla Historial

**Files:**
- Create: `C:\Users\sebas\visionguard\app\ui\history_screen.py`

- [ ] **Step 1: Implementar history_screen.py**

Crear `app\ui\history_screen.py`:
```python
import os
from datetime import date
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel,
    QPushButton, QTableWidget, QTableWidgetItem,
    QDateEdit, QHeaderView, QMessageBox
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QColor

STYLE = """
QDialog { background: #0a2a6e; }
QLabel { color: white; font-size: 14px; }
QLabel#lbl_titulo { font-size: 18px; font-weight: bold; }
QTableWidget {
    background: #0d3580; color: white;
    gridline-color: #1565c0; border: 1px solid #1565c0;
    selection-background-color: #1976d2;
}
QHeaderView::section { background: #0a2a6e; color: #FFD700; font-weight: bold; padding: 6px; }
QDateEdit { background: #0d3580; color: white; border: 1px solid #1565c0; padding: 4px; border-radius: 4px; }
QPushButton#btn_buscar { background: #1976d2; color: white; border-radius: 4px; padding: 6px 14px; }
QPushButton#btn_exportar { background: #388e3c; color: white; border-radius: 4px; padding: 6px 14px; font-weight: bold; }
QPushButton#btn_cerrar { background: #555; color: white; border-radius: 4px; padding: 6px 14px; }
"""


class HistoryScreen(QDialog):
    def __init__(self, db, reportes_dir: str, parent=None):
        super().__init__(parent)
        self.db = db
        self.reportes_dir = reportes_dir
        self.setWindowTitle("Historial de Accesos")
        self.resize(860, 540)
        self.setStyleSheet(STYLE)
        self._build_ui()
        self._cargar_movimientos(date.today().strftime("%Y-%m-%d"))

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(10)

        lbl = QLabel("Historial de Accesos", objectName="lbl_titulo")
        layout.addWidget(lbl)

        toolbar = QHBoxLayout()
        toolbar.addWidget(QLabel("Fecha:"))
        self.date_edit = QDateEdit(QDate.currentDate())
        self.date_edit.setCalendarPopup(True)
        self.date_edit.setDisplayFormat("dd/MM/yyyy")
        toolbar.addWidget(self.date_edit)

        btn_buscar = QPushButton("Buscar", objectName="btn_buscar")
        btn_buscar.clicked.connect(self._on_buscar)
        toolbar.addWidget(btn_buscar)
        toolbar.addStretch()

        btn_exportar = QPushButton("📥  Exportar Excel", objectName="btn_exportar")
        btn_exportar.clicked.connect(self._on_exportar)
        toolbar.addWidget(btn_exportar)

        layout.addLayout(toolbar)

        self.tabla = QTableWidget(0, 5)
        self.tabla.setHorizontalHeaderLabels(["Patente", "Nombre", "Empresa", "Tipo", "Hora"])
        self.tabla.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        self.tabla.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.Stretch)
        self.tabla.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.tabla.setAlternatingRowColors(True)
        layout.addWidget(self.tabla)

        self.lbl_total = QLabel("Total: 0 registros")
        layout.addWidget(self.lbl_total)

        btn_cerrar = QPushButton("Cerrar", objectName="btn_cerrar")
        btn_cerrar.clicked.connect(self.accept)
        layout.addWidget(btn_cerrar, alignment=Qt.AlignmentFlag.AlignRight)

    def _cargar_movimientos(self, fecha: str):
        movimientos = self.db.get_movimientos_por_fecha(fecha)
        self.tabla.setRowCount(0)
        for mov in movimientos:
            row = self.tabla.rowCount()
            self.tabla.insertRow(row)
            vehiculo = self.db.get_vehiculo(mov["patente"])
            nombre = vehiculo["nombre"] if vehiculo else "(visitante)"
            empresa = vehiculo.get("empresa", "") if vehiculo else ""
            valores = [mov["patente"], nombre, empresa, mov["tipo"].capitalize(), mov["hora"][:5]]
            for col, val in enumerate(valores):
                item = QTableWidgetItem(val)
                item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
                if mov["tipo"] == "entrada":
                    item.setForeground(QColor("#4caf50"))
                else:
                    item.setForeground(QColor("#ef5350"))
                self.tabla.setItem(row, col, item)

        self.lbl_total.setText(f"Total: {len(movimientos)} registros")
        self._movimientos_actuales = movimientos
        self._fecha_actual = fecha

    def _on_buscar(self):
        fecha = self.date_edit.date().toString("yyyy-MM-dd")
        self._cargar_movimientos(fecha)

    def _on_exportar(self):
        from app.exporter import export_to_excel
        movimientos = self._movimientos_actuales
        fecha = self._fecha_actual

        enriched = []
        for mov in movimientos:
            vehiculo = self.db.get_vehiculo(mov["patente"])
            enriched.append({
                **mov,
                "nombre": vehiculo["nombre"] if vehiculo else "(visitante)",
                "empresa": vehiculo.get("empresa", "") if vehiculo else "",
            })

        os.makedirs(self.reportes_dir, exist_ok=True)
        output_path = os.path.join(self.reportes_dir, f"reporte_{fecha}.xlsx")
        export_to_excel(enriched, fecha, output_path)
        QMessageBox.information(self, "Exportación Exitosa", f"Archivo guardado en:\n{output_path}")
```

- [ ] **Step 2: Verificar importación**

```powershell
python -c "from app.ui.history_screen import HistoryScreen; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```powershell
git add app\ui\history_screen.py
git commit -m "feat: pantalla historial con filtro por fecha y exportación Excel"
```

---

## Task 9: Pantalla Administración

**Files:**
- Create: `C:\Users\sebas\visionguard\app\ui\admin_screen.py`

- [ ] **Step 1: Implementar admin_screen.py**

Crear `app\ui\admin_screen.py`:
```python
import os
import shutil
import bcrypt
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QTableWidget, QTableWidgetItem, QHeaderView,
    QFormLayout, QCheckBox, QTextEdit, QFileDialog, QMessageBox,
    QInputDialog, QStackedWidget, QWidget
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QPixmap

STYLE = """
QDialog { background: #0a2a6e; }
QWidget { background: #0a2a6e; }
QLabel { color: white; }
QLabel#lbl_titulo { font-size: 18px; font-weight: bold; color: #FFD700; }
QLineEdit, QTextEdit {
    background: #0d3580; color: white; border: 1px solid #1565c0;
    border-radius: 4px; padding: 6px;
}
QCheckBox { color: white; }
QTableWidget {
    background: #0d3580; color: white; gridline-color: #1565c0;
    border: 1px solid #1565c0; selection-background-color: #1976d2;
}
QHeaderView::section { background: #0a2a6e; color: #FFD700; font-weight: bold; padding: 4px; }
QPushButton { background: #1976d2; color: white; border-radius: 4px; padding: 6px 12px; }
QPushButton#btn_eliminar { background: #c62828; }
QPushButton#btn_cancelar { background: #555; }
"""


class AdminScreen(QDialog):
    def __init__(self, db, config, fotos_dir: str, parent=None):
        super().__init__(parent)
        self.db = db
        self.config = config
        self.fotos_dir = fotos_dir
        self.foto_nueva = None

        self.setWindowTitle("Administración de Patentes")
        self.resize(900, 600)
        self.setStyleSheet(STYLE)

        if not self._verificar_password():
            self.reject()
            return

        self._build_ui()
        self._cargar_vehiculos()

    def _verificar_password(self) -> bool:
        from app.config import get_admin_password_hash
        stored_hash = get_admin_password_hash(self.config)
        if not stored_hash:
            return True  # Sin contraseña configurada, acceso libre
        password, ok = QInputDialog.getText(
            self, "Contraseña de Administrador",
            "Ingrese la contraseña:", QLineEdit.EchoMode.Password
        )
        if not ok:
            return False
        return bcrypt.checkpw(password.encode(), stored_hash.encode())

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(10)

        lbl = QLabel("Administración de Vehículos Registrados", objectName="lbl_titulo")
        layout.addWidget(lbl)

        self.stacked = QStackedWidget()
        layout.addWidget(self.stacked)

        # Página 0: lista
        lista_page = QWidget()
        lista_layout = QVBoxLayout(lista_page)

        toolbar = QHBoxLayout()
        btn_nuevo = QPushButton("+ Nuevo Vehículo")
        btn_nuevo.clicked.connect(self._on_nuevo)
        toolbar.addWidget(btn_nuevo)
        toolbar.addStretch()
        lista_layout.addLayout(toolbar)

        self.tabla = QTableWidget(0, 5)
        self.tabla.setHorizontalHeaderLabels(["Patente", "Nombre", "Empresa", "RUT", "Autorizado"])
        self.tabla.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        self.tabla.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.tabla.cellDoubleClicked.connect(self._on_editar_fila)
        lista_layout.addWidget(self.tabla)

        btn_cerrar = QPushButton("Cerrar", objectName="btn_cancelar")
        btn_cerrar.clicked.connect(self.accept)
        lista_layout.addWidget(btn_cerrar, alignment=Qt.AlignmentFlag.AlignRight)

        self.stacked.addWidget(lista_page)

        # Página 1: formulario
        form_page = QWidget()
        form_layout = QVBoxLayout(form_page)

        self.lbl_form_titulo = QLabel("Nuevo Vehículo")
        form_layout.addWidget(self.lbl_form_titulo)

        form = QFormLayout()
        form.setSpacing(8)
        self.inp_patente = QLineEdit()
        self.inp_nombre = QLineEdit()
        self.inp_rut = QLineEdit()
        self.inp_empresa = QLineEdit()
        self.inp_telefono = QLineEdit()
        self.inp_notas = QTextEdit()
        self.inp_notas.setMaximumHeight(60)
        self.chk_autorizado = QCheckBox("Vehículo Autorizado")
        self.chk_autorizado.setChecked(True)
        form.addRow("Patente*:", self.inp_patente)
        form.addRow("Nombre*:", self.inp_nombre)
        form.addRow("RUT:", self.inp_rut)
        form.addRow("Empresa:", self.inp_empresa)
        form.addRow("Teléfono:", self.inp_telefono)
        form.addRow("Notas:", self.inp_notas)
        form.addRow("", self.chk_autorizado)
        form_layout.addLayout(form)

        foto_row = QHBoxLayout()
        self.lbl_foto_preview = QLabel("Sin foto")
        self.lbl_foto_preview.setFixedSize(80, 80)
        self.lbl_foto_preview.setStyleSheet("border: 1px solid #1565c0;")
        self.lbl_foto_preview.setAlignment(Qt.AlignmentFlag.AlignCenter)
        btn_foto = QPushButton("Seleccionar Foto")
        btn_foto.clicked.connect(self._on_seleccionar_foto)
        foto_row.addWidget(self.lbl_foto_preview)
        foto_row.addWidget(btn_foto)
        foto_row.addStretch()
        form_layout.addLayout(foto_row)

        btns_form = QHBoxLayout()
        btn_guardar = QPushButton("Guardar")
        btn_guardar.clicked.connect(self._on_guardar)
        self.btn_eliminar = QPushButton("Eliminar", objectName="btn_eliminar")
        self.btn_eliminar.clicked.connect(self._on_eliminar)
        btn_volver = QPushButton("Volver", objectName="btn_cancelar")
        btn_volver.clicked.connect(lambda: self.stacked.setCurrentIndex(0))
        btns_form.addWidget(btn_guardar)
        btns_form.addWidget(self.btn_eliminar)
        btns_form.addStretch()
        btns_form.addWidget(btn_volver)
        form_layout.addLayout(btns_form)
        form_layout.addStretch()

        self.stacked.addWidget(form_page)

    def _cargar_vehiculos(self):
        vehiculos = self.db.list_vehiculos()
        self.tabla.setRowCount(0)
        for v in vehiculos:
            row = self.tabla.rowCount()
            self.tabla.insertRow(row)
            for col, val in enumerate([v["patente"], v["nombre"], v["empresa"], v["rut"],
                                        "Sí" if v["autorizado"] else "No"]):
                item = QTableWidgetItem(str(val))
                item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
                self.tabla.setItem(row, col, item)

    def _on_nuevo(self):
        self._editing_patente = None
        self._limpiar_form()
        self.lbl_form_titulo.setText("Nuevo Vehículo")
        self.btn_eliminar.setVisible(False)
        self.inp_patente.setReadOnly(False)
        self.stacked.setCurrentIndex(1)

    def _on_editar_fila(self, row: int, _col: int):
        patente = self.tabla.item(row, 0).text()
        v = self.db.get_vehiculo(patente)
        if not v:
            return
        self._editing_patente = patente
        self._limpiar_form()
        self.lbl_form_titulo.setText(f"Editar — {patente}")
        self.btn_eliminar.setVisible(True)
        self.inp_patente.setText(v["patente"])
        self.inp_patente.setReadOnly(True)
        self.inp_nombre.setText(v["nombre"])
        self.inp_rut.setText(v.get("rut", ""))
        self.inp_empresa.setText(v.get("empresa", ""))
        self.inp_telefono.setText(v.get("telefono", ""))
        self.inp_notas.setPlainText(v.get("notas", ""))
        self.chk_autorizado.setChecked(bool(v.get("autorizado", 1)))
        foto = v.get("foto_path", "")
        if foto and os.path.exists(foto):
            pix = QPixmap(foto).scaled(80, 80, Qt.AspectRatioMode.KeepAspectRatio)
            self.lbl_foto_preview.setPixmap(pix)
        self.stacked.setCurrentIndex(1)

    def _limpiar_form(self):
        self.foto_nueva = None
        for w in [self.inp_patente, self.inp_nombre, self.inp_rut,
                  self.inp_empresa, self.inp_telefono]:
            w.clear()
        self.inp_notas.clear()
        self.chk_autorizado.setChecked(True)
        self.lbl_foto_preview.setText("Sin foto")
        self.lbl_foto_preview.setPixmap(QPixmap())

    def _on_seleccionar_foto(self):
        path, _ = QFileDialog.getOpenFileName(self, "Seleccionar foto", "", "Imágenes (*.jpg *.jpeg *.png)")
        if path:
            self.foto_nueva = path
            pix = QPixmap(path).scaled(80, 80, Qt.AspectRatioMode.KeepAspectRatio)
            self.lbl_foto_preview.setPixmap(pix)

    def _on_guardar(self):
        patente = self.inp_patente.text().strip().upper()
        nombre = self.inp_nombre.text().strip()
        if not patente or not nombre:
            QMessageBox.warning(self, "Campos requeridos", "Patente y Nombre son obligatorios.")
            return

        foto_path = ""
        if self.foto_nueva:
            os.makedirs(self.fotos_dir, exist_ok=True)
            ext = os.path.splitext(self.foto_nueva)[1]
            dest = os.path.join(self.fotos_dir, f"{patente}{ext}")
            shutil.copy2(self.foto_nueva, dest)
            foto_path = dest

        data = {
            "patente": patente, "nombre": nombre,
            "rut": self.inp_rut.text().strip(),
            "empresa": self.inp_empresa.text().strip(),
            "telefono": self.inp_telefono.text().strip(),
            "notas": self.inp_notas.toPlainText().strip(),
            "autorizado": 1 if self.chk_autorizado.isChecked() else 0,
        }
        if foto_path:
            data["foto_path"] = foto_path

        if self._editing_patente:
            self.db.update_vehiculo(self._editing_patente, data)
        else:
            self.db.add_vehiculo(data)

        self._cargar_vehiculos()
        self.stacked.setCurrentIndex(0)

    def _on_eliminar(self):
        if not self._editing_patente:
            return
        resp = QMessageBox.question(self, "Confirmar", f"¿Eliminar {self._editing_patente}?")
        if resp == QMessageBox.StandardButton.Yes:
            self.db.delete_vehiculo(self._editing_patente)
            self._cargar_vehiculos()
            self.stacked.setCurrentIndex(0)
```

- [ ] **Step 2: Verificar importación**

```powershell
python -c "from app.ui.admin_screen import AdminScreen; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```powershell
git add app\ui\admin_screen.py
git commit -m "feat: pantalla administración CRUD de vehículos con foto y protección por contraseña"
```

---

## Task 10: Integración Final — main.py

**Files:**
- Create: `C:\Users\sebas\visionguard\main.py`

- [ ] **Step 1: Implementar main.py**

Crear `C:\Users\sebas\visionguard\main.py`:
```python
import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "config.ini")
DB_PATH = os.path.join(BASE_DIR, "data", "visionguard.db")
FOTOS_DIR = os.path.join(BASE_DIR, "data", "fotos")
REPORTES_DIR = os.path.join(BASE_DIR, "reportes")

from PyQt6.QtWidgets import QApplication
from app.config import load_config, get_rtsp_url, get_deteccion_params
from app.database import Database
from app.detector import LPRDetector
from app.ui.main_window import MainWindow


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("VisionGuard")

    os.makedirs(FOTOS_DIR, exist_ok=True)
    os.makedirs(REPORTES_DIR, exist_ok=True)

    cfg = load_config(CONFIG_PATH)
    db = Database(DB_PATH, FOTOS_DIR)
    params = get_deteccion_params(cfg)
    rtsp_url = get_rtsp_url(cfg)

    detector = LPRDetector(
        rtsp_url=rtsp_url,
        confianza_minima=params["confianza_minima"],
        cooldown_segundos=params["cooldown_segundos"],
        fps_captura=params["fps_captura"],
    )

    window = MainWindow(db=db, config=cfg, detector=detector,
                        fotos_dir=FOTOS_DIR, reportes_dir=REPORTES_DIR)
    window.show()

    exit_code = app.exec()
    db.close()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Ejecutar la aplicación para verificar que levanta**

```powershell
cd C:\Users\sebas\visionguard
python main.py
```

Expected: La ventana VisionGuard abre. El video mostrará "Conectando cámara..." hasta que se configure la IP real en config.ini. Cerrar la ventana sin errores.

- [ ] **Step 3: Ejecutar todos los tests**

```powershell
pytest tests\ -v
```

Expected: 17+ tests PASSED, 0 FAILED

- [ ] **Step 4: Commit**

```powershell
git add main.py
git commit -m "feat: integración final y punto de entrada de VisionGuard"
```

---

## Task 11: Configurar Cámara EZVIZ Real

**Files:**
- Modify: `C:\Users\sebas\visionguard\config.ini`

- [ ] **Step 1: Obtener credenciales RTSP de la cámara EZVIZ**

En la cámara EZVIZ, el RTSP por defecto es:
```
rtsp://admin:PASSWORD@IP_CAMARA:554/h264/ch1/main/av_stream
```

Donde:
- `PASSWORD` = contraseña de la cámara (configurada en la app EZVIZ al instalar)
- `IP_CAMARA` = IP local asignada por el router (buscar en la app EZVIZ → Dispositivos → Info)

- [ ] **Step 2: Editar config.ini con los datos reales**

```ini
[camara]
rtsp_url = rtsp://admin:TU_PASSWORD@192.168.1.XXX:554/h264/ch1/main/av_stream

[admin]
password_hash =

[deteccion]
confianza_minima = 0.80
cooldown_segundos = 120
fps_captura = 1
```

- [ ] **Step 3: Verificar conexión RTSP**

```powershell
python -c "
import cv2
cap = cv2.VideoCapture('rtsp://admin:TU_PASSWORD@192.168.1.XXX:554/h264/ch1/main/av_stream')
print('Conectado:', cap.isOpened())
cap.release()
"
```

Expected: `Conectado: True`

- [ ] **Step 4: Ejecutar la aplicación con la cámara real**

```powershell
python main.py
```

Expected: Video en vivo de la cámara aparece en la ventana principal.

---

## Task 12: Empaquetado como .exe con PyInstaller

**Files:**
- Create: `C:\Users\sebas\visionguard\visionguard.spec`

- [ ] **Step 1: Instalar PyInstaller**

```powershell
pip install pyinstaller
```

- [ ] **Step 2: Generar spec inicial**

```powershell
cd C:\Users\sebas\visionguard
pyinstaller --name VisionGuard --windowed --onedir main.py
```

- [ ] **Step 3: Editar visionguard.spec para incluir modelos EasyOCR**

Reemplazar el contenido de `VisionGuard.spec` con:
```python
# -*- mode: python ; coding: utf-8 -*-
import os
import easyocr

block_cipher = None

easyocr_path = os.path.dirname(easyocr.__file__)

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        (os.path.join(easyocr_path, 'character'), 'easyocr/character'),
        (os.path.join(easyocr_path, 'dict'), 'easyocr/dict'),
    ],
    hiddenimports=['easyocr', 'cv2', 'PyQt6'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz, a.scripts, [],
    exclude_binaries=True,
    name='VisionGuard',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    icon=None,
)

coll = COLLECT(
    exe, a.binaries, a.zipfiles, a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='VisionGuard',
)
```

- [ ] **Step 4: Construir el ejecutable**

```powershell
pyinstaller VisionGuard.spec
```

Expected: Carpeta `dist\VisionGuard\` con `VisionGuard.exe` y todas las dependencias.

- [ ] **Step 5: Probar el .exe generado**

```powershell
.\dist\VisionGuard\VisionGuard.exe
```

Expected: La aplicación abre correctamente sin necesidad de Python instalado.

- [ ] **Step 6: Commit final**

```powershell
git add visionguard.spec requirements.txt
git commit -m "feat: configuración PyInstaller para empaquetado .exe standalone"
```

---

## Self-Review

**Cobertura del spec:**
- ✅ 2.1 Reconocimiento patentes: Task 5 (detector.py con EasyOCR, patrones chilenos, cooldown)
- ✅ 2.2 Pantalla principal: Task 6 (main_window.py con video + ficha + botones)
- ✅ 2.3 Visitante no registrado: Task 7 (visitor_dialog.py)
- ✅ 2.4 Historial y reportes: Task 8 (history_screen.py) + Task 4 (exporter.py)
- ✅ 2.5 Administración patentes: Task 9 (admin_screen.py con CRUD + foto + contraseña)
- ✅ Sin internet / local: toda la arquitectura es local SQLite + RTSP
- ✅ .exe instalable: Task 12 (PyInstaller)
- ✅ config.ini: Task 2 (config.py) + Task 11

**Sin placeholders:** verificado — todos los pasos tienen código completo.

**Consistencia de tipos:** `Database`, `LPRDetector`, `MainWindow` usan nombres y firmas consistentes en todas las tareas.
