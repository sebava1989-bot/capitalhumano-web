# StockIA — Piloto Deploy + Demo Agrícola Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar StockIA completamente desplegado en producción (Railway + Vercel) con datos demo agrícolas realistas, credenciales listas para entregar, y APK Flutter instalada en el dispositivo.

**Architecture:** Script `seed-demo.js` idempotente crea tenant completo (productos, bodegas, usuarios, movimientos históricos) en una sola ejecución. Backend en Railway, panel web en Vercel, Flutter recompilado con URL de producción.

**Tech Stack:** Node.js + Railway, Next.js + Vercel, Supabase PostgreSQL, Flutter + ADB

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `scripts/seed-demo.js` | Crear | Seed completo del tenant demo (idempotente) |
| `package.json` | Modificar | Agrega script `seed:demo` |
| `stockia-app/lib/config/api_config.dart` | Modificar | URL de producción Railway |

---

## Task 1: Script seed-demo.js

**Files:**
- Create: `scripts/seed-demo.js`
- Modify: `package.json`

- [ ] **Step 1: Crear `scripts/seed-demo.js`**

```js
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../src/db');
const { importStock } = require('../src/services/migrationService');

const PRODUCTS = [
  { name: 'Semilla Trigo Invernal',    sku: 'SEM-TRI', unit: 'saco',   min_stock: 20,  quantity: 85 },
  { name: 'Semilla Maíz Híbrido',      sku: 'SEM-MAI', unit: 'saco',   min_stock: 15,  quantity: 42 },
  { name: 'Fertilizante NPK 15-15-15', sku: 'FER-NPK', unit: 'saco',   min_stock: 30,  quantity: 12 },
  { name: 'Urea 46%',                  sku: 'FER-URE', unit: 'saco',   min_stock: 25,  quantity: 8  },
  { name: 'Herbicida Glifosato 48%',   sku: 'HER-GLI', unit: 'litro',  min_stock: 50,  quantity: 180 },
  { name: 'Fungicida Mancozeb',        sku: 'FUN-MAN', unit: 'kilo',   min_stock: 20,  quantity: 55 },
  { name: 'Insecticida Clorpirifos',   sku: 'INS-CLO', unit: 'litro',  min_stock: 10,  quantity: 28 },
  { name: 'Aceite Motor Tractor',      sku: 'ACE-MOT', unit: 'litro',  min_stock: 20,  quantity: 60 },
  { name: 'Combustible Diesel',        sku: 'COM-DIE', unit: 'litro',  min_stock: 500, quantity: 1200 },
  { name: 'Manguera de Riego 1"',      sku: 'MAN-RIE', unit: 'metro',  min_stock: 100, quantity: 450 },
  { name: 'Alambre Galvanizado 14G',   sku: 'ALA-14G', unit: 'rollo',  min_stock: 10,  quantity: 22 },
  { name: 'Sacos de Polipropileno',    sku: 'SAC-POL', unit: 'unidad', min_stock: 200, quantity: 750 },
  { name: 'Guantes de Cuero',          sku: 'GUA-CUE', unit: 'par',    min_stock: 10,  quantity: 18 },
  { name: 'Mascarilla Antipolvo',      sku: 'MAS-POL', unit: 'unidad', min_stock: 20,  quantity: 35 },
  { name: 'Bomba de Mochila 16L',      sku: 'BOM-16L', unit: 'unidad', min_stock: 2,   quantity: 3  },
];

// Movimientos históricos — sólo se insertan en movements (no actualizan stock)
// El stock ya queda correcto tras importStock(). Estos son para reportes/historial.
const MOVEMENTS = [
  { sku: 'HER-GLI', type: 'out', quantity: 20,  responsible: 'Juan Pérez',   days: 6 },
  { sku: 'COM-DIE', type: 'out', quantity: 300, responsible: 'Carlos Soto',  days: 5 },
  { sku: 'SEM-TRI', type: 'in',  quantity: 30,  responsible: 'Juan Pérez',   days: 4 },
  { sku: 'FER-NPK', type: 'out', quantity: 18,  responsible: 'Carlos Soto',  days: 3 },
  { sku: 'FER-URE', type: 'out', quantity: 17,  responsible: 'Juan Pérez',   days: 2 },
  { sku: 'FUN-MAN', type: 'out', quantity: 10,  responsible: 'Carlos Soto',  days: 6 },
  { sku: 'INS-CLO', type: 'out', quantity: 5,   responsible: 'Juan Pérez',   days: 5 },
  { sku: 'ACE-MOT', type: 'out', quantity: 15,  responsible: 'Carlos Soto',  days: 4 },
  { sku: 'SAC-POL', type: 'out', quantity: 100, responsible: 'Juan Pérez',   days: 3 },
  { sku: 'MAN-RIE', type: 'out', quantity: 50,  responsible: 'Carlos Soto',  days: 2 },
  { sku: 'HER-GLI', type: 'out', quantity: 15,  responsible: 'Carlos Soto',  days: 1 },
  { sku: 'COM-DIE', type: 'out', quantity: 200, responsible: 'Juan Pérez',   days: 1 },
  { sku: 'SEM-MAI', type: 'in',  quantity: 20,  responsible: 'Carlos Soto',  days: 3 },
  { sku: 'GUA-CUE', type: 'out', quantity: 5,   responsible: 'Juan Pérez',   days: 4 },
  { sku: 'MAS-POL', type: 'out', quantity: 10,  responsible: 'Carlos Soto',  days: 3 },
  { sku: 'ALA-14G', type: 'out', quantity: 3,   responsible: 'Juan Pérez',   days: 2 },
  { sku: 'BOM-16L', type: 'out', quantity: 1,   responsible: 'Carlos Soto',  days: 1 },
  { sku: 'ACE-MOT', type: 'in',  quantity: 20,  responsible: 'Juan Pérez',   days: 7 },
  { sku: 'FUN-MAN', type: 'in',  quantity: 15,  responsible: 'Carlos Soto',  days: 7 },
  { sku: 'INS-CLO', type: 'in',  quantity: 10,  responsible: 'Juan Pérez',   days: 6 },
];

async function seedDemo() {
  console.log('🌱 Iniciando seed demo AgriDemo SpA...');

  // Idempotente: borrar tenant previo
  await db.query("DELETE FROM tenants WHERE email = 'admin@agridemo.cl'");

  // Crear tenant
  const { rows: [tenant] } = await db.query(
    `INSERT INTO tenants (name, email) VALUES ('AgriDemo SpA', 'admin@agridemo.cl') RETURNING id`
  );
  const tenantId = tenant.id;
  console.log(`  ✓ Tenant creado: ${tenantId}`);

  // Crear bodegas
  const { rows: [bodegaCentral] } = await db.query(
    `INSERT INTO warehouses (tenant_id, name, location)
     VALUES ($1, 'Bodega Central', 'km 12, Ruta 5 Sur') RETURNING id`,
    [tenantId]
  );
  await db.query(
    `INSERT INTO warehouses (tenant_id, name) VALUES ($1, 'Bodega Campo Norte')`,
    [tenantId]
  );
  const warehouseId = bodegaCentral.id;
  console.log('  ✓ Bodegas creadas');

  // Crear usuarios
  const hash = await bcrypt.hash('Demo2026!', 10);
  await db.query(
    `INSERT INTO users (tenant_id, name, email, password, role)
     VALUES ($1, 'Administrador', 'admin@agridemo.cl', $2, 'admin')`,
    [tenantId, hash]
  );
  await db.query(
    `INSERT INTO users (tenant_id, name, email, password, role)
     VALUES ($1, 'Juan Pérez', 'bodeguero@agridemo.cl', $2, 'bodeguero')`,
    [tenantId, hash]
  );
  console.log('  ✓ Usuarios creados');

  // Importar stock inicial (crea productos + stock + movimiento "in" inicial)
  const result = await importStock(tenantId, PRODUCTS);
  console.log(`  ✓ Productos: ${result.created} creados, bodega: ${result.warehouse_used}`);

  // Obtener IDs de productos para los movimientos históricos
  const { rows: productRows } = await db.query(
    'SELECT id, sku FROM products WHERE tenant_id = $1',
    [tenantId]
  );
  const bySkU = Object.fromEntries(productRows.map(p => [p.sku, p.id]));

  // Insertar movimientos históricos directamente (sólo para reportes/historial)
  for (const m of MOVEMENTS) {
    const productId = bySkU[m.sku];
    if (!productId) continue;
    await db.query(
      `INSERT INTO movements
         (tenant_id, product_id, warehouse_id, type, quantity, responsible, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'Movimiento demo', NOW() - ($7 || ' days')::interval)`,
      [tenantId, productId, warehouseId, m.type, m.quantity, m.responsible, String(m.days)]
    );
  }
  console.log(`  ✓ ${MOVEMENTS.length} movimientos históricos insertados`);

  console.log('');
  console.log('✅ Seed completo. Credenciales:');
  console.log('   Panel web  → admin@agridemo.cl     / Demo2026!');
  console.log('   App móvil  → bodeguero@agridemo.cl / Demo2026!');

  await db.pool.end();
}

seedDemo().catch(err => {
  console.error('❌ Seed falló:', err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Agregar script en `package.json`**

Abrir `package.json` y agregar en `"scripts"`:

```json
"seed:demo": "node scripts/seed-demo.js"
```

Resultado final del bloque `scripts`:
```json
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "jest --runInBand",
  "migrate": "node src/db/migrate.js",
  "seed:demo": "node scripts/seed-demo.js"
}
```

- [ ] **Step 3: Probar seed en local**

```bash
cd C:/Users/sebas/stockia-backend
npm run seed:demo
```

Expected output:
```
🌱 Iniciando seed demo AgriDemo SpA...
  ✓ Tenant creado: <uuid>
  ✓ Bodegas creadas
  ✓ Usuarios creados
  ✓ Productos: 15 creados, bodega: Bodega Central
  ✓ 20 movimientos históricos insertados

✅ Seed completo. Credenciales:
   Panel web  → admin@agridemo.cl     / Demo2026!
   App móvil  → bodeguero@agridemo.cl / Demo2026!
```

Correr una segunda vez para verificar idempotencia — mismo output, sin errores.

- [ ] **Step 4: Verificar datos en DB local**

```bash
# Conectarse al DB local (psql o cliente visual) y verificar:
# 1. SELECT count(*) FROM products WHERE tenant_id = '<uuid>'; → 15
# 2. SELECT name, quantity FROM stock JOIN products ON product_id = products.id WHERE stock.tenant_id = '<uuid>';
#    → Verificar FER-NPK = 12 (alerta) y FER-URE = 8 (alerta crítica)
# 3. SELECT count(*) FROM movements WHERE tenant_id = '<uuid>'; → 16 (15 de importStock + 20 directos = 35 total)
```

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-demo.js package.json
git commit -m "feat: script seed-demo — tenant agrícola completo con 15 productos y 20 movimientos"
```

---

## Task 2: Deploy backend en Railway

**Pre-requisito:** Tener cuenta en Railway (railway.app) y el repo `stockia-backend` pusheado a GitHub.

- [ ] **Step 1: Push backend a GitHub si no está al día**

```bash
cd C:/Users/sebas/stockia-backend
git push origin master
```

- [ ] **Step 2: Crear proyecto en Railway**

1. Ir a [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Seleccionar el repositorio `stockia-backend`
3. Railway detecta automáticamente Node.js

- [ ] **Step 3: Configurar variables de entorno en Railway**

En Railway → proyecto → Variables, agregar:

```
DATABASE_URL=<connection string de Supabase prod>
JWT_SECRET=stockia-prod-secret-2026
NODE_ENV=production
PORT=3001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=contacto@tuamigospa.cl
SMTP_PASS=<tu app password de Gmail>
SMTP_FROM=StockIA <contacto@tuamigospa.cl>
```

> El `DATABASE_URL` de Supabase prod se obtiene en: Supabase → proyecto → Settings → Database → Connection string → URI (modo "Transaction").

- [ ] **Step 4: Configurar start command en Railway**

En Railway → Settings → Deploy → Start Command:
```
node src/server.js
```

- [ ] **Step 5: Correr migración en producción**

En Railway → proyecto → deployment activo → "Open terminal" (o usar Railway CLI):

```bash
npm run migrate
```

Expected: tablas creadas en Supabase prod sin errores.

- [ ] **Step 6: Correr seed demo en producción**

Desde la misma terminal de Railway:

```bash
npm run seed:demo
```

Expected: output de seed completo con ✅.

- [ ] **Step 7: Verificar health endpoint**

Anotar la URL que asignó Railway (aparece en la sección Deployments, algo como `stockia-backend-production.up.railway.app`).

```bash
curl https://<tu-url-railway>/health
```

Expected:
```json
{"status":"ok"}
```

---

## Task 3: Deploy panel web en Vercel

**Pre-requisito:** Tener la URL de Railway del Task 2 (ej: `https://stockia-backend-production.up.railway.app`).

- [ ] **Step 1: Push panel web a GitHub**

```bash
cd C:/Users/sebas/stockia-web
git push origin master
```

- [ ] **Step 2: Crear proyecto en Vercel**

1. Ir a [vercel.com](https://vercel.com) → Add New → Project
2. Importar repositorio `stockia-web`
3. Vercel detecta Next.js automáticamente

- [ ] **Step 3: Configurar variable de entorno en Vercel**

En Vercel → proyecto → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://<tu-url-railway>/v1
```

Aplicar a: Production, Preview, Development.

- [ ] **Step 4: Deploy**

Click "Deploy". Vercel compilará el Next.js y asignará una URL (ej: `stockia-web.vercel.app`).

- [ ] **Step 5: Verificar login**

Abrir la URL de Vercel en el navegador → ir a `/login` → entrar con:
- Email: `admin@agridemo.cl`
- Password: `Demo2026!`

Expected: dashboard carga con alertas de stock (FER-NPK y FER-URE en rojo).

- [ ] **Step 6: Anotar URLs finales**

```
Panel web: https://<proyecto>.vercel.app
API:       https://<proyecto>.up.railway.app/v1
```

---

## Task 4: Flutter APK con URL de producción

**Files:**
- Modify: `C:/Users/sebas/stockia-app/lib/config/api_config.dart`

- [ ] **Step 1: Cambiar baseUrl en `api_config.dart`**

Abrir `C:/Users/sebas/stockia-app/lib/config/api_config.dart` y reemplazar:

```dart
class ApiConfig {
  static const String baseUrl = 'https://<tu-url-railway>/v1';
}
```

Reemplazar `<tu-url-railway>` con la URL real de Railway obtenida en Task 2 Step 7.

- [ ] **Step 2: Compilar APK**

```bash
cd C:/Users/sebas/stockia-app
flutter build apk --debug
```

Expected: `Built build/app/outputs/flutter-apk/app-debug.apk`

- [ ] **Step 3: Instalar en Xiaomi 14T**

Conectar el Xiaomi 14T por USB con depuración USB activada:

```bash
adb devices
```

Expected: el dispositivo aparece listado.

```bash
adb install -r build/app/outputs/flutter-apk/app-debug.apk
```

Expected: `Success`

- [ ] **Step 4: Verificar login en app**

Abrir la app en el Xiaomi → login con:
- Email: `bodeguero@agridemo.cl`
- Password: `Demo2026!`

Expected: pantalla Home con tab Alertas mostrando FER-NPK y FER-URE como críticos, tab Movimientos con historial.

- [ ] **Step 5: Commit**

```bash
cd C:/Users/sebas/stockia-app
git add lib/config/api_config.dart
git commit -m "feat: apuntar app a URL de producción Railway"
```

---

## Self-Review

**Spec coverage:**
- ✅ Backend en Railway → Task 2
- ✅ Panel web en Vercel → Task 3
- ✅ Supabase prod + migración → Task 2 Step 5
- ✅ Script seed:demo idempotente → Task 1
- ✅ Tenant AgriDemo SpA → Task 1 (PRODUCTS array)
- ✅ 15 productos agrícolas → Task 1 (PRODUCTS array)
- ✅ Alertas críticas FER-NPK y FER-URE → Task 1 (min_stock > quantity)
- ✅ 20 movimientos históricos → Task 1 (MOVEMENTS array)
- ✅ 2 usuarios (admin + bodeguero) → Task 1
- ✅ 2 bodegas → Task 1
- ✅ APK Flutter con URL producción → Task 4
- ✅ Credenciales claras → Task 1 Step 3 output + Task 2 Step 6 + Task 3 Step 5

**Placeholder scan:** `<tu-url-railway>` y `<proyecto>` son placeholders esperados — el ejecutor los reemplaza con los valores reales que Railway/Vercel asignan durante el deploy.

**Type consistency:** `importStock(tenantId, PRODUCTS)` coincide con la firma de `migrationService.js`. `db.query` y `db.pool.end()` coinciden con `src/db/index.js`.
