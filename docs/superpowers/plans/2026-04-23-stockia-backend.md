# StockIA Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the StockIA REST API with Node.js + Express + PostgreSQL that soporta multi-tenancy, autenticación JWT, gestión de inventario y procesamiento de DTE XML.

**Architecture:** Monolito modular con Express. Cada dominio tiene su propio router y servicio. Multi-tenancy por row-level con `tenant_id`. Base de datos PostgreSQL con migraciones SQL puras.

**Tech Stack:** Node.js 20, Express 4, PostgreSQL 15, pg, jsonwebtoken, bcrypt, fast-xml-parser, Jest, Supertest

---

## File Structure

```
stockia-backend/
├── src/
│   ├── server.js                  # Entry point — inicia HTTP server
│   ├── app.js                     # Express app — middlewares y rutas
│   ├── db/
│   │   ├── index.js               # Pool de conexión pg
│   │   └── migrate.js             # Ejecuta migraciones SQL
│   ├── migrations/
│   │   ├── 001_tenants.sql
│   │   ├── 002_users.sql
│   │   ├── 003_products.sql
│   │   ├── 004_warehouses.sql
│   │   ├── 005_stock.sql
│   │   ├── 006_movements.sql
│   │   ├── 007_documents.sql
│   │   └── 008_document_items.sql
│   ├── middleware/
│   │   ├── auth.js                # Verifica JWT, adjunta req.user
│   │   └── tenant.js              # Adjunta req.tenantId al request
│   ├── routes/
│   │   ├── auth.js                # POST /auth/register, /auth/login, /auth/refresh
│   │   ├── products.js            # CRUD /products
│   │   ├── warehouses.js          # CRUD /warehouses + transfer
│   │   ├── stock.js               # GET /stock, /stock/alerts
│   │   ├── movements.js           # POST /movements/in, /movements/out, GET /movements
│   │   ├── documents.js           # DTE XML import y apply
│   │   ├── reports.js             # GET /reports/*
│   │   └── users.js               # Admin /users
│   └── services/
│       ├── authService.js         # Lógica register/login/token
│       ├── stockService.js        # Lógica stock + alertas
│       ├── movementService.js     # Lógica entradas/salidas/transferencias
│       └── dteService.js          # Parseo XML DTE + matching productos
├── tests/
│   ├── setup.js                   # Configuración global Jest + DB test
│   ├── auth.test.js
│   ├── products.test.js
│   ├── stock.test.js
│   ├── movements.test.js
│   └── dte.test.js
├── .env.example
├── package.json
└── jest.config.js
```

---

## Task 1: Project Setup

**Files:**
- Create: `stockia-backend/package.json`
- Create: `stockia-backend/src/server.js`
- Create: `stockia-backend/src/app.js`
- Create: `stockia-backend/.env.example`
- Create: `stockia-backend/jest.config.js`

- [ ] **Step 1: Crear directorio e inicializar proyecto**

```bash
mkdir stockia-backend && cd stockia-backend
npm init -y
```

- [ ] **Step 2: Instalar dependencias**

```bash
npm install express pg bcrypt jsonwebtoken uuid fast-xml-parser express-rate-limit cors dotenv
npm install --save-dev jest supertest nodemon
```

- [ ] **Step 3: Crear `.env.example`**

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/stockia
JWT_SECRET=change_this_secret_key_min_32_chars
JWT_REFRESH_SECRET=change_this_refresh_secret_key
NODE_ENV=development
```

- [ ] **Step 4: Crear `jest.config.js`**

```js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterFramework: ['./tests/setup.js'], // Jest key: setupFilesAfterFramework
  testTimeout: 10000,
};
```

- [ ] **Step 5: Crear `src/app.js`**

```js
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const warehousesRoutes = require('./routes/warehouses');
const stockRoutes = require('./routes/stock');
const movementsRoutes = require('./routes/movements');
const documentsRoutes = require('./routes/documents');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.use('/v1/auth', authRoutes);
app.use('/v1/products', productsRoutes);
app.use('/v1/warehouses', warehousesRoutes);
app.use('/v1/stock', stockRoutes);
app.use('/v1/movements', movementsRoutes);
app.use('/v1/documents', documentsRoutes);
app.use('/v1/reports', reportsRoutes);
app.use('/v1/users', usersRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
```

- [ ] **Step 6: Crear `src/server.js`**

```js
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`StockIA API running on port ${PORT}`));
```

- [ ] **Step 7: Actualizar `package.json` scripts**

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --runInBand",
    "migrate": "node src/db/migrate.js"
  }
}
```

- [ ] **Step 8: Verificar que el servidor arranca**

```bash
cp .env.example .env
node src/server.js
```
Esperado: `StockIA API running on port 3000`

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: project setup — Express + pg + JWT stack"
```

---

## Task 2: Database Connection + Migrations

**Files:**
- Create: `src/db/index.js`
- Create: `src/db/migrate.js`
- Create: `src/migrations/001_tenants.sql` ... `008_document_items.sql`

- [ ] **Step 1: Crear `src/db/index.js`**

```js
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => console.error('DB pool error', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
```

- [ ] **Step 2: Crear `src/db/migrate.js`**

```js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        run_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const dir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT id FROM migrations WHERE filename = $1', [file]
      );
      if (rows.length > 0) { console.log(`skip: ${file}`); continue; }

      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
      console.log(`ran: ${file}`);
    }
    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 3: Crear `src/migrations/001_tenants.sql`**

```sql
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  rut VARCHAR(20) UNIQUE,
  plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free','starter','pro','enterprise')),
  email VARCHAR(255) UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 4: Crear `src/migrations/002_users.sql`**

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'bodeguero' CHECK (role IN ('admin','bodeguero')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);
```

- [ ] **Step 5: Crear `src/migrations/003_products.sql`**

```sql
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  category VARCHAR(100),
  unit VARCHAR(50) NOT NULL DEFAULT 'unidad',
  min_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, sku)
);
```

- [ ] **Step 6: Crear `src/migrations/004_warehouses.sql`**

```sql
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 7: Crear `src/migrations/005_stock.sql`**

```sql
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, product_id, warehouse_id)
);
```

- [ ] **Step 8: Crear `src/migrations/006_movements.sql`**

```sql
CREATE TABLE IF NOT EXISTS movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('in','out','transfer')),
  quantity DECIMAL(10,2) NOT NULL,
  responsible VARCHAR(255),
  document_id UUID,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 9: Crear `src/migrations/007_documents.sql`**

```sql
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('dte_xml','manual')),
  supplier VARCHAR(255),
  folio VARCHAR(100),
  date DATE,
  xml_hash VARCHAR(64) UNIQUE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 10: Crear `src/migrations/008_document_items.sql`**

```sql
CREATE TABLE IF NOT EXISTS document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2),
  matched_product_id UUID REFERENCES products(id)
);
```

- [ ] **Step 11: Ejecutar migraciones**

```bash
npm run migrate
```
Esperado:
```
ran: 001_tenants.sql
ran: 002_users.sql
...
ran: 008_document_items.sql
Migrations complete.
```

- [ ] **Step 12: Commit**

```bash
git add .
git commit -m "feat: database migrations — 8 tables con multi-tenancy"
```

---

## Task 3: Middleware Auth + Tenant

**Files:**
- Create: `src/middleware/auth.js`
- Create: `src/middleware/tenant.js`
- Create: `tests/setup.js`

- [ ] **Step 1: Crear `src/middleware/auth.js`**

```js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    req.tenantId = payload.tenantId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol admin' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };
```

- [ ] **Step 2: Crear `tests/setup.js`**

```js
require('dotenv').config({ path: '.env.test' });

afterAll(async () => {
  const { pool } = require('../src/db');
  await pool.end();
});
```

- [ ] **Step 3: Crear `.env.test`**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/stockia_test
JWT_SECRET=test_secret_key_min_32_chars_here
JWT_REFRESH_SECRET=test_refresh_secret_key_here
NODE_ENV=test
```

- [ ] **Step 4: Escribir test para middleware auth**

Crear `tests/auth.middleware.test.js`:

```js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

describe('Auth Middleware', () => {
  test('rechaza request sin token', async () => {
    const res = await request(app).get('/v1/products');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token requerido');
  });

  test('rechaza token inválido', async () => {
    const res = await request(app)
      .get('/v1/products')
      .set('Authorization', 'Bearer tokenfalso');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token inválido');
  });

  test('permite request con token válido', async () => {
    const token = jwt.sign(
      { userId: 'test-id', tenantId: 'tenant-id', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/v1/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).not.toBe(401);
  });
});
```

- [ ] **Step 5: Ejecutar test (debe fallar — rutas no existen aún)**

```bash
npm test tests/auth.middleware.test.js
```
Esperado: FAIL — "Cannot find module './routes/products'"

- [ ] **Step 6: Crear stubs de rutas para que tests pasen**

Crear cada archivo de ruta con un stub mínimo. Ejemplo `src/routes/products.js`:

```js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', (req, res) => res.json({ products: [] }));

module.exports = router;
```

Repetir para: `warehouses.js`, `stock.js`, `movements.js`, `documents.js`, `reports.js`, `users.js` con el mismo patrón (router.use(authMiddleware) + GET / → json vacío).

Para `src/routes/auth.js` sin middleware:
```js
const express = require('express');
const router = express.Router();
router.post('/register', (req, res) => res.json({}));
router.post('/login', (req, res) => res.json({}));
router.post('/refresh', (req, res) => res.json({}));
module.exports = router;
```

- [ ] **Step 7: Ejecutar tests — deben pasar**

```bash
npm test tests/auth.middleware.test.js
```
Esperado: PASS (3 tests)

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: auth middleware + tenant isolation + route stubs"
```

---

## Task 4: Auth — Register + Login

**Files:**
- Create: `src/services/authService.js`
- Modify: `src/routes/auth.js`
- Create: `tests/auth.test.js`

- [ ] **Step 1: Escribir tests de auth**

```js
// tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

beforeAll(async () => {
  await db.query('DELETE FROM users WHERE email LIKE $1', ['%@test.stockia%']);
  await db.query('DELETE FROM tenants WHERE email LIKE $1', ['%@test.stockia%']);
});

describe('POST /v1/auth/register', () => {
  test('registra empresa y admin exitosamente', async () => {
    const res = await request(app).post('/v1/auth/register').send({
      companyName: 'Ferretería Test',
      rut: '76123456-7',
      email: 'admin@test.stockia.cl',
      password: 'Password123!',
      warehouseName: 'Bodega Principal',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.role).toBe('admin');
  });

  test('rechaza email duplicado', async () => {
    const res = await request(app).post('/v1/auth/register').send({
      companyName: 'Otra Empresa',
      email: 'admin@test.stockia.cl',
      password: 'Password123!',
      warehouseName: 'Bodega',
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya existe/i);
  });
});

describe('POST /v1/auth/login', () => {
  test('login exitoso devuelve tokens', async () => {
    const res = await request(app).post('/v1/auth/login').send({
      email: 'admin@test.stockia.cl',
      password: 'Password123!',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('rechaza contraseña incorrecta', async () => {
    const res = await request(app).post('/v1/auth/login').send({
      email: 'admin@test.stockia.cl',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Ejecutar tests — deben fallar**

```bash
npm test tests/auth.test.js
```
Esperado: FAIL

- [ ] **Step 3: Crear `src/services/authService.js`**

```js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

async function register({ companyName, rut, email, password, warehouseName }) {
  const existing = await db.query('SELECT id FROM tenants WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const err = new Error('Email ya existe'); err.status = 409; throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const tenantRes = await db.query(
    `INSERT INTO tenants (name, rut, email) VALUES ($1, $2, $3) RETURNING id`,
    [companyName, rut || null, email]
  );
  const tenantId = tenantRes.rows[0].id;

  const userRes = await db.query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'admin') RETURNING id, name, email, role`,
    [tenantId, 'Administrador', email, passwordHash]
  );
  const user = userRes.rows[0];

  await db.query(
    `INSERT INTO warehouses (tenant_id, name) VALUES ($1, $2)`,
    [tenantId, warehouseName || 'Bodega Principal']
  );

  const { token, refreshToken } = generateTokens(user.id, tenantId, user.role);
  return { token, refreshToken, user };
}

async function login({ email, password }) {
  const res = await db.query(
    `SELECT u.id, u.name, u.email, u.role, u.password_hash, u.tenant_id
     FROM users u
     JOIN tenants t ON t.id = u.tenant_id
     WHERE u.email = $1 AND u.active = true AND t.active = true`,
    [email]
  );
  if (res.rows.length === 0) {
    const err = new Error('Credenciales inválidas'); err.status = 401; throw err;
  }
  const user = res.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Credenciales inválidas'); err.status = 401; throw err;
  }
  const { token, refreshToken } = generateTokens(user.id, user.tenant_id, user.role);
  return { token, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

function generateTokens(userId, tenantId, role) {
  const token = jwt.sign(
    { userId, tenantId, role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  const refreshToken = jwt.sign(
    { userId, tenantId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
  return { token, refreshToken };
}

module.exports = { register, login };
```

- [ ] **Step 4: Actualizar `src/routes/auth.js`**

```js
const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

router.post('/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken requerido' });
  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { generateTokens } = require('../services/authService');
    // re-export generateTokens
    const token = jwt.sign(
      { userId: payload.userId, tenantId: payload.tenantId, role: payload.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token });
  } catch {
    res.status(401).json({ error: 'refreshToken inválido' });
  }
});

module.exports = router;
```

- [ ] **Step 5: Ejecutar tests — deben pasar**

```bash
npm test tests/auth.test.js
```
Esperado: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: auth register + login con JWT y bcrypt"
```

---

## Task 5: Products CRUD

**Files:**
- Modify: `src/routes/products.js`
- Create: `tests/products.test.js`

- [ ] **Step 1: Escribir tests de productos**

```js
// tests/products.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const db = require('../src/db');

let token, tenantId;

beforeAll(async () => {
  const tenantRes = await db.query(
    `INSERT INTO tenants (name, email) VALUES ('Test Corp', 'products@test.stockia.cl') RETURNING id`
  );
  tenantId = tenantRes.rows[0].id;
  token = jwt.sign({ userId: 'u1', tenantId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await db.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
});

describe('Products CRUD', () => {
  let productId;

  test('POST /v1/products — crea producto', async () => {
    const res = await request(app)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tornillo M8', sku: 'TOR-M8', unit: 'unidad', min_stock: 20 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Tornillo M8');
    productId = res.body.id;
  });

  test('GET /v1/products — lista productos del tenant', async () => {
    const res = await request(app)
      .get('/v1/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(p => p.id === productId)).toBe(true);
  });

  test('PUT /v1/products/:id — actualiza producto', async () => {
    const res = await request(app)
      .put(`/v1/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ min_stock: 50 });
    expect(res.status).toBe(200);
    expect(res.body.min_stock).toBe('50.00');
  });

  test('DELETE /v1/products/:id — desactiva producto', async () => {
    const res = await request(app)
      .delete(`/v1/products/${productId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const { rows } = await db.query('SELECT active FROM products WHERE id = $1', [productId]);
    expect(rows[0].active).toBe(false);
  });
});
```

- [ ] **Step 2: Ejecutar tests — deben fallar**

```bash
npm test tests/products.test.js
```
Esperado: FAIL

- [ ] **Step 3: Implementar `src/routes/products.js`**

```js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../db');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, sku, category, unit, min_stock, active, created_at
       FROM products WHERE tenant_id = $1 AND active = true ORDER BY name`,
      [req.tenantId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, sku, category, unit, min_stock } = req.body;
  if (!name) return res.status(400).json({ error: 'name requerido' });
  try {
    const { rows } = await db.query(
      `INSERT INTO products (tenant_id, name, sku, category, unit, min_stock)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.tenantId, name, sku || null, category || null, unit || 'unidad', min_stock || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, sku, category, unit, min_stock } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        sku = COALESCE($2, sku),
        category = COALESCE($3, category),
        unit = COALESCE($4, unit),
        min_stock = COALESCE($5, min_stock)
       WHERE id = $6 AND tenant_id = $7 RETURNING *`,
      [name, sku, category, unit, min_stock, req.params.id, req.tenantId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE products SET active = false WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [req.params.id, req.tenantId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 4: Ejecutar tests — deben pasar**

```bash
npm test tests/products.test.js
```
Esperado: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: products CRUD con tenant isolation"
```

---

## Task 6: Stock + Movements

**Files:**
- Create: `src/services/stockService.js`
- Create: `src/services/movementService.js`
- Modify: `src/routes/stock.js`
- Modify: `src/routes/movements.js`
- Create: `tests/movements.test.js`

- [ ] **Step 1: Escribir tests de movimientos**

```js
// tests/movements.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const db = require('../src/db');

let token, tenantId, productId, warehouseId;

beforeAll(async () => {
  const t = await db.query(
    `INSERT INTO tenants (name, email) VALUES ('Stock Corp', 'stock@test.stockia.cl') RETURNING id`
  );
  tenantId = t.rows[0].id;
  token = jwt.sign({ userId: 'u1', tenantId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const p = await db.query(
    `INSERT INTO products (tenant_id, name, unit, min_stock) VALUES ($1, 'Cemento', 'saco', 10) RETURNING id`,
    [tenantId]
  );
  productId = p.rows[0].id;

  const w = await db.query(
    `INSERT INTO warehouses (tenant_id, name) VALUES ($1, 'Bodega Test') RETURNING id`,
    [tenantId]
  );
  warehouseId = w.rows[0].id;
});

afterAll(async () => {
  await db.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
});

describe('Movements', () => {
  test('POST /v1/movements/in — registra entrada y actualiza stock', async () => {
    const res = await request(app)
      .post('/v1/movements/in')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: productId, warehouse_id: warehouseId, quantity: 50, responsible: 'Juan' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('in');

    const { rows } = await db.query(
      'SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2',
      [productId, warehouseId]
    );
    expect(parseFloat(rows[0].quantity)).toBe(50);
  });

  test('POST /v1/movements/out — descuenta del stock', async () => {
    const res = await request(app)
      .post('/v1/movements/out')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: productId, warehouse_id: warehouseId, quantity: 10, responsible: 'Pedro' });
    expect(res.status).toBe(201);

    const { rows } = await db.query(
      'SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2',
      [productId, warehouseId]
    );
    expect(parseFloat(rows[0].quantity)).toBe(40);
  });

  test('POST /v1/movements/out — rechaza si stock insuficiente', async () => {
    const res = await request(app)
      .post('/v1/movements/out')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: productId, warehouse_id: warehouseId, quantity: 999 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/stock insuficiente/i);
  });

  test('GET /v1/stock/alerts — devuelve productos bajo mínimo', async () => {
    await db.query(
      `UPDATE products SET min_stock = 100 WHERE id = $1`,
      [productId]
    );
    const res = await request(app)
      .get('/v1/stock/alerts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.some(a => a.product_id === productId)).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar tests — deben fallar**

```bash
npm test tests/movements.test.js
```
Esperado: FAIL

- [ ] **Step 3: Crear `src/services/movementService.js`**

```js
const db = require('../db');

async function registerMovement({ tenantId, productId, warehouseId, type, quantity, responsible, documentId, notes, createdBy }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    if (type === 'out' || type === 'transfer') {
      const { rows } = await client.query(
        'SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2 AND tenant_id = $3',
        [productId, warehouseId, tenantId]
      );
      const current = rows.length > 0 ? parseFloat(rows[0].quantity) : 0;
      if (current < quantity) {
        const err = new Error('Stock insuficiente'); err.status = 400; throw err;
      }
    }

    const movRes = await client.query(
      `INSERT INTO movements (tenant_id, product_id, warehouse_id, type, quantity, responsible, document_id, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [tenantId, productId, warehouseId, type, quantity, responsible || null, documentId || null, notes || null, createdBy || null]
    );

    const delta = type === 'in' ? quantity : -quantity;
    await client.query(
      `INSERT INTO stock (tenant_id, product_id, warehouse_id, quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, product_id, warehouse_id)
       DO UPDATE SET quantity = stock.quantity + $4, updated_at = NOW()`,
      [tenantId, productId, warehouseId, delta]
    );

    await client.query('COMMIT');
    return movRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { registerMovement };
```

- [ ] **Step 4: Actualizar `src/routes/movements.js`**

```js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { registerMovement } = require('../services/movementService');
const db = require('../db');

router.use(authMiddleware);

router.post('/in', async (req, res) => {
  const { product_id, warehouse_id, quantity, responsible, notes } = req.body;
  if (!product_id || !warehouse_id || !quantity) {
    return res.status(400).json({ error: 'product_id, warehouse_id y quantity son requeridos' });
  }
  try {
    const movement = await registerMovement({
      tenantId: req.tenantId, productId: product_id, warehouseId: warehouse_id,
      type: 'in', quantity, responsible, notes, createdBy: req.user.userId,
    });
    res.status(201).json(movement);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/out', async (req, res) => {
  const { product_id, warehouse_id, quantity, responsible, notes, document_ref } = req.body;
  if (!product_id || !warehouse_id || !quantity) {
    return res.status(400).json({ error: 'product_id, warehouse_id y quantity son requeridos' });
  }
  try {
    const movement = await registerMovement({
      tenantId: req.tenantId, productId: product_id, warehouseId: warehouse_id,
      type: 'out', quantity, responsible, notes, createdBy: req.user.userId,
    });
    res.status(201).json(movement);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const { from, to, product_id, type } = req.query;
  try {
    let q = `SELECT m.*, p.name as product_name FROM movements m
             JOIN products p ON p.id = m.product_id
             WHERE m.tenant_id = $1`;
    const params = [req.tenantId];
    if (from) { params.push(from); q += ` AND m.created_at >= $${params.length}`; }
    if (to) { params.push(to); q += ` AND m.created_at <= $${params.length}`; }
    if (product_id) { params.push(product_id); q += ` AND m.product_id = $${params.length}`; }
    if (type) { params.push(type); q += ` AND m.type = $${params.length}`; }
    q += ' ORDER BY m.created_at DESC LIMIT 500';
    const { rows } = await db.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 5: Actualizar `src/routes/stock.js`**

```js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../db');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.*, p.name as product_name, p.sku, p.unit, p.min_stock, w.name as warehouse_name
       FROM stock s
       JOIN products p ON p.id = s.product_id
       JOIN warehouses w ON w.id = s.warehouse_id
       WHERE s.tenant_id = $1
       ORDER BY p.name`,
      [req.tenantId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.product_id, p.name as product_name, p.sku, p.min_stock,
              s.quantity as current_stock, w.name as warehouse_name
       FROM stock s
       JOIN products p ON p.id = s.product_id
       JOIN warehouses w ON w.id = s.warehouse_id
       WHERE s.tenant_id = $1 AND s.quantity <= p.min_stock AND p.active = true
       ORDER BY s.quantity ASC`,
      [req.tenantId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:product_id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.*, w.name as warehouse_name
       FROM stock s JOIN warehouses w ON w.id = s.warehouse_id
       WHERE s.tenant_id = $1 AND s.product_id = $2`,
      [req.tenantId, req.params.product_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 6: Ejecutar tests — deben pasar**

```bash
npm test tests/movements.test.js
```
Esperado: PASS (4 tests)

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: stock y movements con transacciones atómicas"
```

---

## Task 7: DTE XML Import

**Files:**
- Create: `src/services/dteService.js`
- Modify: `src/routes/documents.js`
- Create: `tests/dte.test.js`
- Create: `tests/fixtures/factura_sample.xml`

- [ ] **Step 1: Crear XML de prueba `tests/fixtures/factura_sample.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<DTE version="1.0">
  <Documento>
    <Encabezado>
      <IdDoc>
        <TipoDTE>33</TipoDTE>
        <Folio>12345</Folio>
        <FchEmis>2026-04-23</FchEmis>
      </IdDoc>
      <Emisor>
        <RznSoc>Distribuidora Aceros SA</RznSoc>
        <RUTEmisor>76543210-K</RUTEmisor>
      </Emisor>
    </Encabezado>
    <Detalle>
      <NroLinDet>1</NroLinDet>
      <NmbItem>Tornillo M8 x 25mm</NmbItem>
      <QtyItem>100</QtyItem>
      <PrcItem>150</PrcItem>
    </Detalle>
    <Detalle>
      <NroLinDet>2</NroLinDet>
      <NmbItem>Perno 1/2 galvanizado</NmbItem>
      <QtyItem>50</QtyItem>
      <PrcItem>320</PrcItem>
    </Detalle>
  </Documento>
</DTE>
```

- [ ] **Step 2: Escribir tests DTE**

```js
// tests/dte.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const db = require('../src/db');

let token, tenantId, documentId;

beforeAll(async () => {
  const t = await db.query(
    `INSERT INTO tenants (name, email) VALUES ('DTE Corp', 'dte@test.stockia.cl') RETURNING id`
  );
  tenantId = t.rows[0].id;
  token = jwt.sign({ userId: 'u1', tenantId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await db.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
});

describe('DTE XML Import', () => {
  test('POST /v1/documents/import-xml — parsea XML y extrae items', async () => {
    const xmlContent = fs.readFileSync(
      path.join(__dirname, 'fixtures/factura_sample.xml'), 'utf8'
    );
    const res = await request(app)
      .post('/v1/documents/import-xml')
      .set('Authorization', `Bearer ${token}`)
      .send({ xml: xmlContent });
    expect(res.status).toBe(201);
    expect(res.body.folio).toBe('12345');
    expect(res.body.supplier).toBe('Distribuidora Aceros SA');
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0].product_name).toBe('Tornillo M8 x 25mm');
    expect(parseFloat(res.body.items[0].quantity)).toBe(100);
    documentId = res.body.id;
  });

  test('POST /v1/documents/import-xml — rechaza XML duplicado', async () => {
    const xmlContent = fs.readFileSync(
      path.join(__dirname, 'fixtures/factura_sample.xml'), 'utf8'
    );
    const res = await request(app)
      .post('/v1/documents/import-xml')
      .set('Authorization', `Bearer ${token}`)
      .send({ xml: xmlContent });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya fue procesado/i);
  });

  test('GET /v1/documents/:id/items — devuelve items del documento', async () => {
    const res = await request(app)
      .get(`/v1/documents/${documentId}/items`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});
```

- [ ] **Step 3: Ejecutar tests — deben fallar**

```bash
npm test tests/dte.test.js
```
Esperado: FAIL

- [ ] **Step 4: Crear `src/services/dteService.js`**

```js
const crypto = require('crypto');
const { XMLParser } = require('fast-xml-parser');
const db = require('../db');

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: true });

function parseXML(xmlString) {
  const parsed = parser.parse(xmlString);
  const doc = parsed?.DTE?.Documento;
  if (!doc) throw Object.assign(new Error('XML DTE inválido'), { status: 400 });

  const header = doc.Encabezado;
  const folio = String(header?.IdDoc?.Folio || '');
  const date = header?.IdDoc?.FchEmis || null;
  const supplier = header?.Emisor?.RznSoc || header?.Emisor?.RUTEmisor || 'Desconocido';

  const rawDetails = doc.Detalle;
  const details = Array.isArray(rawDetails) ? rawDetails : [rawDetails];

  const items = details.filter(Boolean).map(d => ({
    product_name: String(d.NmbItem || ''),
    quantity: parseFloat(d.QtyItem) || 0,
    unit_price: parseFloat(d.PrcItem) || null,
  }));

  return { folio, date, supplier, items };
}

async function importXML(tenantId, xmlString) {
  const hash = crypto.createHash('sha256').update(xmlString).digest('hex');

  const existing = await db.query('SELECT id FROM documents WHERE xml_hash = $1', [hash]);
  if (existing.rows.length > 0) {
    throw Object.assign(new Error('Este documento ya fue procesado'), { status: 409 });
  }

  const { folio, date, supplier, items } = parseXML(xmlString);

  const docRes = await db.query(
    `INSERT INTO documents (tenant_id, type, supplier, folio, date, xml_hash)
     VALUES ($1, 'dte_xml', $2, $3, $4, $5) RETURNING *`,
    [tenantId, supplier, folio, date, hash]
  );
  const document = docRes.rows[0];

  const insertedItems = [];
  for (const item of items) {
    const { rows } = await db.query(
      `INSERT INTO document_items (document_id, product_name, quantity, unit_price)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [document.id, item.product_name, item.quantity, item.unit_price]
    );
    insertedItems.push(rows[0]);
  }

  return { ...document, items: insertedItems };
}

async function applyDocument(tenantId, documentId, warehouseId, matches, createdBy) {
  const { rows: docRows } = await db.query(
    'SELECT * FROM documents WHERE id = $1 AND tenant_id = $2',
    [documentId, tenantId]
  );
  if (docRows.length === 0) throw Object.assign(new Error('Documento no encontrado'), { status: 404 });
  if (docRows[0].processed_at) throw Object.assign(new Error('Documento ya aplicado'), { status: 409 });

  const { rows: items } = await db.query(
    'SELECT * FROM document_items WHERE document_id = $1', [documentId]
  );

  const { registerMovement } = require('./movementService');

  for (const item of items) {
    const match = matches?.find(m => m.item_id === item.id);
    const productId = match?.product_id || item.matched_product_id;
    if (!productId) continue;

    await db.query(
      'UPDATE document_items SET matched_product_id = $1 WHERE id = $2',
      [productId, item.id]
    );

    await registerMovement({
      tenantId, productId, warehouseId,
      type: 'in', quantity: item.quantity,
      responsible: 'DTE automático',
      documentId, createdBy,
    });
  }

  await db.query(
    'UPDATE documents SET processed_at = NOW() WHERE id = $1', [documentId]
  );

  return { success: true };
}

module.exports = { importXML, applyDocument };
```

- [ ] **Step 5: Implementar `src/routes/documents.js`**

```js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { importXML, applyDocument } = require('../services/dteService');
const db = require('../db');

router.use(authMiddleware);

router.post('/import-xml', async (req, res) => {
  const { xml } = req.body;
  if (!xml) return res.status(400).json({ error: 'xml requerido' });
  try {
    const result = await importXML(req.tenantId, xml);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM documents WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [req.tenantId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/items', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT di.* FROM document_items di
       JOIN documents d ON d.id = di.document_id
       WHERE di.document_id = $1 AND d.tenant_id = $2`,
      [req.params.id, req.tenantId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/apply', async (req, res) => {
  const { warehouse_id, matches } = req.body;
  if (!warehouse_id) return res.status(400).json({ error: 'warehouse_id requerido' });
  try {
    const result = await applyDocument(
      req.tenantId, req.params.id, warehouse_id, matches, req.user.userId
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 6: Ejecutar todos los tests**

```bash
npm test
```
Esperado: PASS (todos los tests)

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: DTE XML import con detección de duplicados vía sha256"
```

---

## Task 8: Reports + Users + Warehouses

**Files:**
- Modify: `src/routes/reports.js`
- Modify: `src/routes/users.js`
- Modify: `src/routes/warehouses.js`

- [ ] **Step 1: Implementar `src/routes/reports.js`**

```js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../db');

router.use(authMiddleware);

router.get('/inventory', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.name, p.sku, p.category, p.unit, p.min_stock,
              COALESCE(SUM(s.quantity), 0) as total_stock,
              CASE WHEN COALESCE(SUM(s.quantity), 0) <= p.min_stock THEN 'critico'
                   WHEN COALESCE(SUM(s.quantity), 0) <= p.min_stock * 1.5 THEN 'bajo'
                   ELSE 'ok' END as status
       FROM products p
       LEFT JOIN stock s ON s.product_id = p.id AND s.tenant_id = p.tenant_id
       WHERE p.tenant_id = $1 AND p.active = true
       GROUP BY p.id ORDER BY p.name`,
      [req.tenantId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/movements', async (req, res) => {
  const { from, to } = req.query;
  try {
    const { rows } = await db.query(
      `SELECT m.type, COUNT(*) as count, SUM(m.quantity) as total_quantity,
              p.name as product_name
       FROM movements m JOIN products p ON p.id = m.product_id
       WHERE m.tenant_id = $1
         AND ($2::date IS NULL OR m.created_at >= $2::date)
         AND ($3::date IS NULL OR m.created_at <= $3::date)
       GROUP BY m.type, p.id ORDER BY total_quantity DESC`,
      [req.tenantId, from || null, to || null]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/critical', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.name, p.sku, p.min_stock, COALESCE(SUM(s.quantity), 0) as current_stock
       FROM products p
       LEFT JOIN stock s ON s.product_id = p.id AND s.tenant_id = p.tenant_id
       WHERE p.tenant_id = $1 AND p.active = true
       GROUP BY p.id
       HAVING COALESCE(SUM(s.quantity), 0) <= p.min_stock
       ORDER BY current_stock ASC`,
      [req.tenantId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Implementar `src/routes/warehouses.js`**

```js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { registerMovement } = require('../services/movementService');
const db = require('../db');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM warehouses WHERE tenant_id = $1 AND active = true ORDER BY name',
    [req.tenantId]
  );
  res.json(rows);
});

router.post('/', adminOnly, async (req, res) => {
  const { name, location } = req.body;
  if (!name) return res.status(400).json({ error: 'name requerido' });
  const { rows } = await db.query(
    'INSERT INTO warehouses (tenant_id, name, location) VALUES ($1, $2, $3) RETURNING *',
    [req.tenantId, name, location || null]
  );
  res.status(201).json(rows[0]);
});

router.post('/transfer', async (req, res) => {
  const { product_id, from_warehouse_id, to_warehouse_id, quantity, responsible } = req.body;
  if (!product_id || !from_warehouse_id || !to_warehouse_id || !quantity) {
    return res.status(400).json({ error: 'product_id, from_warehouse_id, to_warehouse_id y quantity son requeridos' });
  }
  try {
    await registerMovement({
      tenantId: req.tenantId, productId: product_id, warehouseId: from_warehouse_id,
      type: 'out', quantity, responsible, notes: `Transferencia a bodega ${to_warehouse_id}`,
      createdBy: req.user.userId,
    });
    await registerMovement({
      tenantId: req.tenantId, productId: product_id, warehouseId: to_warehouse_id,
      type: 'in', quantity, responsible, notes: `Transferencia desde bodega ${from_warehouse_id}`,
      createdBy: req.user.userId,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 3: Implementar `src/routes/users.js`**

```js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const db = require('../db');

router.use(authMiddleware, adminOnly);

router.get('/', async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, email, role, active, created_at FROM users WHERE tenant_id = $1 ORDER BY name',
    [req.tenantId]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email y password son requeridos' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await db.query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [req.tenantId, name, email, passwordHash, role || 'bodeguero']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email ya existe en esta empresa' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'bodeguero'].includes(role)) {
    return res.status(400).json({ error: 'role debe ser admin o bodeguero' });
  }
  const { rows } = await db.query(
    'UPDATE users SET role = $1 WHERE id = $2 AND tenant_id = $3 RETURNING id, name, role',
    [role, req.params.id, req.tenantId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(rows[0]);
});

module.exports = router;
```

- [ ] **Step 4: Ejecutar todos los tests**

```bash
npm test
```
Esperado: PASS (todos los tests)

- [ ] **Step 5: Commit final**

```bash
git add .
git commit -m "feat: reports, warehouses y users — backend StockIA completo"
```

---

## Task 9: Verificación Final

- [ ] **Step 1: Ejecutar suite completa de tests**

```bash
npm test -- --coverage
```
Esperado: PASS en todos. Coverage > 70%.

- [ ] **Step 2: Probar health check**

```bash
curl http://localhost:3000/health
```
Esperado: `{"status":"ok"}`

- [ ] **Step 3: Probar flujo completo con curl**

```bash
# Registrar empresa
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Mi Ferretería","email":"yo@ferreteriatest.cl","password":"Pass123!","warehouseName":"Bodega Central"}'

# Guardar token del response y usarlo en siguientes calls
TOKEN="<token del response>"

# Crear producto
curl -X POST http://localhost:3000/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tornillo M8","unit":"unidad","min_stock":20}'

# Registrar entrada
curl -X POST http://localhost:3000/v1/movements/in \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id":"<id>","warehouse_id":"<id>","quantity":100,"responsible":"Juan"}'

# Ver stock
curl http://localhost:3000/v1/stock \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] **Step 4: Commit tag de versión**

```bash
git tag v1.0.0-backend
git commit --allow-empty -m "chore: backend StockIA v1.0.0 — listo para integración"
```
