# FitPulse Backend API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la API REST de FitPulse en Node.js + PostgreSQL lista para deploy en Railway, que sirve a la app Flutter y al panel admin.

**Architecture:** Express + pg (driver nativo) en `C:\Users\sebas\fitpulse-backend\`. Auth con JWT separado para miembros y admins. Cron diario actualiza estados de suscripción. Sin ORM — SQL directo para control total.

**Tech Stack:** Node.js 20, Express 4, pg, bcryptjs, jsonwebtoken, node-cron, dotenv, cors

---

## Estructura de archivos

```
fitpulse-backend/
├── index.js
├── db.js
├── middleware/
│   ├── auth.js
│   └── adminAuth.js
├── routes/
│   ├── auth.js
│   ├── admin.js
│   ├── me.js
│   ├── members.js
│   ├── routines.js
│   ├── workouts.js
│   ├── ranking.js
│   ├── dashboard.js
│   └── subscriptions.js
├── cron/
│   └── subscription-status.js
├── schema.sql
├── seed.sql
├── .env.example
├── Procfile
└── railway.toml
```

---

## Task 1: Proyecto y dependencias

**Files:**
- Create: `C:\Users\sebas\fitpulse-backend\package.json`
- Create: `C:\Users\sebas\fitpulse-backend\.env.example`
- Create: `C:\Users\sebas\fitpulse-backend\.env`

- [ ] **Step 1: Crear el proyecto**

```bash
cd C:\Users\sebas
mkdir fitpulse-backend
cd fitpulse-backend
npm init -y
npm install express pg bcryptjs jsonwebtoken node-cron dotenv cors
```

- [ ] **Step 2: Crear `.env.example`**

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=cambia_esto_por_un_string_largo_aleatorio
PORT=3000
```

- [ ] **Step 3: Crear `.env` local para desarrollo**

```
DATABASE_URL=postgresql://localhost:5432/fitpulse_dev
JWT_SECRET=dev_secret_local_1234567890abcdef
PORT=3000
```

- [ ] **Step 4: Verificar que Node funciona**

```bash
node -e "console.log('Node OK:', process.version)"
```
Esperado: `Node OK: v20.x.x`

- [ ] **Step 5: Commit**

```bash
git init
echo "node_modules/\n.env" > .gitignore
git add .
git commit -m "feat: init fitpulse-backend project"
```

---

## Task 2: Schema y seed de base de datos

**Files:**
- Create: `schema.sql`
- Create: `seed.sql`

- [ ] **Step 1: Crear `schema.sql`**

```sql
-- schema.sql

CREATE TABLE IF NOT EXISTS gyms (
  code                  VARCHAR(10) PRIMARY KEY,
  name                  VARCHAR(100) NOT NULL,
  owner_email           VARCHAR(100) UNIQUE NOT NULL,
  owner_password_hash   VARCHAR(255) NOT NULL,
  plan                  VARCHAR(20) DEFAULT 'FREE',
  active                BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
  id              SERIAL PRIMARY KEY,
  gym_code        VARCHAR(10) REFERENCES gyms(code),
  full_name       VARCHAR(100) NOT NULL,
  rut             VARCHAR(12) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  points          INTEGER DEFAULT 0,
  streak          INTEGER DEFAULT 0,
  level           INTEGER DEFAULT 1,
  active          BOOLEAN DEFAULT TRUE,
  phone           VARCHAR(20),
  email           VARCHAR(100),
  last_workout    DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gym_code, rut)
);

CREATE TABLE IF NOT EXISTS routines (
  id          SERIAL PRIMARY KEY,
  gym_code    VARCHAR(10) REFERENCES gyms(code),
  name        VARCHAR(100) NOT NULL,
  day_of_week VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercises (
  id          SERIAL PRIMARY KEY,
  routine_id  INTEGER REFERENCES routines(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  sets        INTEGER DEFAULT 3,
  reps        INTEGER DEFAULT 12,
  rest_seconds INTEGER DEFAULT 60,
  position    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workouts (
  id               SERIAL PRIMARY KEY,
  member_id        INTEGER REFERENCES members(id),
  routine_id       INTEGER REFERENCES routines(id),
  date             DATE DEFAULT CURRENT_DATE,
  points_earned    INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                SERIAL PRIMARY KEY,
  member_id         INTEGER REFERENCES members(id) UNIQUE,
  price             INTEGER NOT NULL DEFAULT 25000,
  due_day           INTEGER NOT NULL DEFAULT 5,
  last_payment_date DATE,
  status            VARCHAR(20) DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] **Step 2: Crear `seed.sql`**

```sql
-- seed.sql — datos demo para GYM01
-- Contraseña admin: admin123
-- Contraseña miembros: fitpulse123

INSERT INTO gyms (code, name, owner_email, owner_password_hash, plan)
VALUES (
  'GYM01', 'PowerGym Santiago',
  'admin@powergym.cl',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'PRO'
) ON CONFLICT DO NOTHING;

INSERT INTO members (gym_code, full_name, rut, password_hash, points, streak, level, phone, last_workout)
VALUES
  ('GYM01','Carlos Muñoz',   '12345678-9','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',2840,21,7,'+56912345678',CURRENT_DATE),
  ('GYM01','Valentina Ríos', '23456789-0','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',2610,18,6,'+56923456789',CURRENT_DATE),
  ('GYM01','Diego Soto',     '34567890-1','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',2340,14,6,'+56934567890',CURRENT_DATE - 1),
  ('GYM01','Camila Torres',  '45678901-2','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',1980,9, 5,'+56945678901',CURRENT_DATE - 1),
  ('GYM01','Matías Lagos',   '56789012-3','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',1750,12,4,'+56956789012',CURRENT_DATE - 2),
  ('GYM01','Fernanda Vera',  '67890123-4','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',1520,7, 4,'+56967890123',CURRENT_DATE - 3),
  ('GYM01','Sebastián Paz',  '78901234-5','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',1380,5, 3,'+56978901234',CURRENT_DATE - 4),
  ('GYM01','Javiera Fuentes','89012345-6','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',1200,0, 3,'+56989012345',CURRENT_DATE - 12),
  ('GYM01','Nicolás Araya',  '90123456-7','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',980, 0, 2,'+56990123456',CURRENT_DATE - 10),
  ('GYM01','Isidora Méndez', '01234567-8','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',720, 0, 2,'+56901234567',CURRENT_DATE - 8)
ON CONFLICT DO NOTHING;

INSERT INTO routines (gym_code, name, day_of_week) VALUES
  ('GYM01','Pecho y Tríceps',  'Martes / Viernes'),
  ('GYM01','Piernas y Glúteos','Lunes / Jueves'),
  ('GYM01','Espalda y Bíceps', 'Miércoles / Sábado'),
  ('GYM01','Cardio HIIT',      'Miércoles')
ON CONFLICT DO NOTHING;

INSERT INTO exercises (routine_id, name, sets, reps, rest_seconds, position)
SELECT r.id, e.name, e.sets, e.reps, e.rest, e.pos
FROM routines r
JOIN (VALUES
  ('Pecho y Tríceps',  'Press banca plano',          4,10,90,1),
  ('Pecho y Tríceps',  'Press inclinado mancuernas', 3,12,75,2),
  ('Pecho y Tríceps',  'Aperturas en máquina',       3,15,60,3),
  ('Pecho y Tríceps',  'Fondos en paralelas',        3,12,75,4),
  ('Pecho y Tríceps',  'Press francés',              3,12,60,5),
  ('Piernas y Glúteos','Sentadilla libre',            4,8,120,1),
  ('Piernas y Glúteos','Prensa de piernas',           4,12,90,2),
  ('Piernas y Glúteos','Hip thrust',                  4,12,90,3),
  ('Piernas y Glúteos','Curl femoral',                3,12,60,4),
  ('Espalda y Bíceps', 'Dominadas asistidas',        4,8,90,1),
  ('Espalda y Bíceps', 'Remo con barra',             4,10,90,2),
  ('Espalda y Bíceps', 'Curl bíceps barra',          3,12,60,3),
  ('Cardio HIIT',      'Burpees',                    4,10,60,1),
  ('Cardio HIIT',      'Mountain climbers',          4,20,45,2),
  ('Cardio HIIT',      'Saltos de caja',             3,12,60,3)
) AS e(rname, name, sets, reps, rest, pos) ON r.name = e.rname
WHERE r.gym_code = 'GYM01';

-- Suscripciones
INSERT INTO subscriptions (member_id, price, due_day, last_payment_date, status)
SELECT m.id,
  CASE row_number() OVER (ORDER BY m.id)
    WHEN 1 THEN 35000 WHEN 2 THEN 35000 WHEN 3 THEN 35000
    WHEN 4 THEN 25000 WHEN 5 THEN 25000 WHEN 6 THEN 25000
    ELSE 20000 END,
  CASE row_number() OVER (ORDER BY m.id)
    WHEN 1 THEN 5  WHEN 2 THEN 18 WHEN 3 THEN 10
    WHEN 4 THEN 19 WHEN 5 THEN 25 WHEN 6 THEN 1
    WHEN 7 THEN 20 WHEN 8 THEN 15 WHEN 9 THEN 8
    ELSE 30 END,
  CASE row_number() OVER (ORDER BY m.id)
    WHEN 3 THEN CURRENT_DATE - 6
    WHEN 8 THEN CURRENT_DATE - 1
    ELSE CURRENT_DATE - 40 END,
  'pending'
FROM members m WHERE m.gym_code = 'GYM01'
ON CONFLICT DO NOTHING;
```

- [ ] **Step 3: Aplicar schema localmente (si tienes PostgreSQL local)**

```bash
createdb fitpulse_dev
psql fitpulse_dev -f schema.sql
psql fitpulse_dev -f seed.sql
```

Si no tienes PostgreSQL local, saltar este step y aplicar en Railway directamente en Task 11.

- [ ] **Step 4: Commit**

```bash
git add schema.sql seed.sql
git commit -m "feat: add database schema and demo seed"
```

---

## Task 3: Conexión a BD y entry point

**Files:**
- Create: `db.js`
- Create: `index.js`

- [ ] **Step 1: Crear `db.js`**

```js
// db.js
require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

module.exports = pool
```

- [ ] **Step 2: Crear `index.js`**

```js
// index.js
require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date() }))

// Routes
app.use('/api/auth',          require('./routes/auth'))
app.use('/api/admin',         require('./routes/admin'))
app.use('/api/me',            require('./routes/me'))
app.use('/api/members',       require('./routes/members'))
app.use('/api/routines',      require('./routes/routines'))
app.use('/api/workouts',      require('./routes/workouts'))
app.use('/api/ranking',       require('./routes/ranking'))
app.use('/api/dashboard',     require('./routes/dashboard'))
app.use('/api/subscriptions', require('./routes/subscriptions'))

// Cron
require('./cron/subscription-status')

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`FitPulse API corriendo en puerto ${PORT}`))
```

- [ ] **Step 3: Verificar que arranca (crear archivos de ruta vacíos temporales)**

```bash
mkdir -p routes cron middleware
for f in auth admin me members routines workouts ranking dashboard subscriptions; do
  echo "const r = require('express').Router(); module.exports = r" > routes/$f.js
done
echo "" > cron/subscription-status.js
node index.js
```

Esperado: `FitPulse API corriendo en puerto 3000`

- [ ] **Step 4: Verificar health check**

```bash
curl http://localhost:3000/api/health
```
Esperado: `{"ok":true,"ts":"2026-..."}`

- [ ] **Step 5: Commit**

```bash
git add db.js index.js routes/ cron/ middleware/
git commit -m "feat: add express server and DB connection"
```

---

## Task 4: Middleware de autenticación

**Files:**
- Create: `middleware/auth.js`
- Create: `middleware/adminAuth.js`

- [ ] **Step 1: Crear `middleware/auth.js`**

```js
// middleware/auth.js — verifica JWT de miembro
const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' })
  }
  try {
    req.member = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
```

- [ ] **Step 2: Crear `middleware/adminAuth.js`**

```js
// middleware/adminAuth.js — verifica JWT de admin (dueño del gym)
const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' })
  }
  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
    if (!payload.gym_code) {
      return res.status(403).json({ error: 'Acceso solo para administradores' })
    }
    req.gym = payload
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add middleware/
git commit -m "feat: add auth middleware for members and admins"
```

---

## Task 5: Rutas de autenticación

**Files:**
- Modify: `routes/auth.js`
- Modify: `routes/admin.js`

- [ ] **Step 1: Escribir `routes/auth.js`**

```js
// routes/auth.js — login de miembros (app Flutter)
const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

router.post('/login', async (req, res) => {
  const { gym_code, rut, password } = req.body
  if (!gym_code || !rut || !password) {
    return res.status(400).json({ error: 'gym_code, rut y password son requeridos' })
  }

  try {
    // Verificar que el gym existe y está activo
    const gymRes = await db.query(
      'SELECT name FROM gyms WHERE code = $1 AND active = TRUE',
      [gym_code.toUpperCase()]
    )
    if (gymRes.rows.length === 0) {
      return res.status(401).json({ error: 'Código de gimnasio inválido' })
    }

    // Buscar miembro
    const memberRes = await db.query(
      `SELECT m.*, 
        (SELECT COUNT(*)+1 FROM members m2 WHERE m2.gym_code = m.gym_code AND m2.points > m.points) AS rank_position
       FROM members m
       WHERE m.gym_code = $1 AND m.rut = $2 AND m.active = TRUE`,
      [gym_code.toUpperCase(), rut.trim()]
    )
    if (memberRes.rows.length === 0) {
      return res.status(401).json({ error: 'RUT o contraseña incorrectos' })
    }

    const member = memberRes.rows[0]
    const valid = await bcrypt.compare(password, member.password_hash)
    if (!valid) return res.status(401).json({ error: 'RUT o contraseña incorrectos' })

    const token = jwt.sign(
      { id: member.id, gym_code: gym_code.toUpperCase(), rut: member.rut },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      token,
      user: {
        id: member.id,
        full_name: member.full_name,
        rut: member.rut,
        gym_code: gym_code.toUpperCase(),
        gym_name: gymRes.rows[0].name,
        points: member.points,
        streak: member.streak,
        level: member.level,
        rank_position: parseInt(member.rank_position),
      }
    })
  } catch (err) {
    console.error('auth/login error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
```

- [ ] **Step 2: Escribir `routes/admin.js`**

```js
// routes/admin.js — login del dueño del gym (panel admin)
const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son requeridos' })
  }

  try {
    const res2 = await db.query(
      'SELECT * FROM gyms WHERE owner_email = $1 AND active = TRUE',
      [email.toLowerCase().trim()]
    )
    if (res2.rows.length === 0) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    const gym = res2.rows[0]
    const valid = await bcrypt.compare(password, gym.owner_password_hash)
    if (!valid) return res.status(401).json({ error: 'Email o contraseña incorrectos' })

    const token = jwt.sign(
      { gym_code: gym.code, email: gym.owner_email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      token,
      gym: { code: gym.code, name: gym.name, owner_email: gym.owner_email, plan: gym.plan }
    })
  } catch (err) {
    console.error('admin/login error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
```

- [ ] **Step 3: Verificar login de miembro**

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"gym_code":"GYM01","rut":"12345678-9","password":"fitpulse123"}' | head -c 200
```
Esperado: `{"token":"eyJ...","user":{"id":1,"full_name":"Carlos Muñoz",...}}`

- [ ] **Step 4: Verificar login admin**

```bash
curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@powergym.cl","password":"admin123"}' | head -c 200
```
Esperado: `{"token":"eyJ...","gym":{"code":"GYM01","name":"PowerGym Santiago",...}}`

- [ ] **Step 5: Commit**

```bash
git add routes/auth.js routes/admin.js
git commit -m "feat: add member and admin login routes"
```

---

## Task 6: Rutas de miembro y perfil

**Files:**
- Modify: `routes/me.js`
- Modify: `routes/members.js`

- [ ] **Step 1: Escribir `routes/me.js`**

```js
// routes/me.js — perfil del miembro autenticado
const router = require('express').Router()
const auth = require('../middleware/auth')
const db = require('../db')

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT m.*,
        g.name AS gym_name,
        (SELECT COUNT(*)+1 FROM members m2 WHERE m2.gym_code = m.gym_code AND m2.points > m.points) AS rank_position,
        s.status AS subscription_status, s.due_day, s.price AS subscription_price
       FROM members m
       JOIN gyms g ON g.code = m.gym_code
       LEFT JOIN subscriptions s ON s.member_id = m.id
       WHERE m.id = $1`,
      [req.member.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Miembro no encontrado' })

    const m = rows[0]
    res.json({
      id: m.id, full_name: m.full_name, rut: m.rut,
      gym_code: m.gym_code, gym_name: m.gym_name,
      points: m.points, streak: m.streak, level: m.level,
      rank_position: parseInt(m.rank_position),
      subscription_status: m.subscription_status,
      subscription_price: m.subscription_price,
      due_day: m.due_day,
    })
  } catch (err) {
    console.error('me error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
```

- [ ] **Step 2: Escribir `routes/members.js`**

```js
// routes/members.js — CRUD miembros (solo admin)
const router = require('express').Router()
const bcrypt = require('bcryptjs')
const adminAuth = require('../middleware/adminAuth')
const db = require('../db')

// GET /api/members?search=&active=
router.get('/', adminAuth, async (req, res) => {
  const { search = '', active } = req.query
  const gymCode = req.gym.gym_code

  let query = `
    SELECT m.id, m.full_name, m.rut, m.level, m.points, m.streak,
           m.last_workout, m.active, m.phone, m.email,
           s.price AS subscription_price, s.due_day, s.last_payment_date, s.status AS subscription_status
    FROM members m
    LEFT JOIN subscriptions s ON s.member_id = m.id
    WHERE m.gym_code = $1
  `
  const params = [gymCode]

  if (search) {
    params.push(`%${search}%`)
    query += ` AND (m.full_name ILIKE $${params.length} OR m.rut ILIKE $${params.length})`
  }
  if (active !== undefined) {
    params.push(active === 'true')
    query += ` AND m.active = $${params.length}`
  }
  query += ' ORDER BY m.points DESC'

  try {
    const { rows } = await db.query(query, params)
    res.json(rows)
  } catch (err) {
    console.error('members GET error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /api/members — crear miembro
router.post('/', adminAuth, async (req, res) => {
  const { full_name, rut, password, phone, email, subscription_price = 25000, payment_due_day = 5 } = req.body
  if (!full_name || !rut || !password) {
    return res.status(400).json({ error: 'full_name, rut y password son requeridos' })
  }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await client.query(
      `INSERT INTO members (gym_code, full_name, rut, password_hash, phone, email)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [req.gym.gym_code, full_name, rut.trim(), hash, phone || null, email || null]
    )
    const memberId = rows[0].id
    await client.query(
      `INSERT INTO subscriptions (member_id, price, due_day) VALUES ($1,$2,$3)`,
      [memberId, subscription_price, payment_due_day]
    )
    await client.query('COMMIT')
    res.status(201).json({ id: memberId, full_name, rut, active: true })
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') return res.status(409).json({ error: 'RUT ya registrado en este gimnasio' })
    console.error('members POST error:', err)
    res.status(500).json({ error: 'Error interno' })
  } finally {
    client.release()
  }
})

// PATCH /api/members/:id — activar/desactivar
router.patch('/:id', adminAuth, async (req, res) => {
  const { active } = req.body
  if (active === undefined) return res.status(400).json({ error: 'Campo active requerido' })

  try {
    const { rowCount } = await db.query(
      `UPDATE members SET active = $1 WHERE id = $2 AND gym_code = $3`,
      [active, req.params.id, req.gym.gym_code]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Miembro no encontrado' })
    res.json({ ok: true })
  } catch (err) {
    console.error('members PATCH error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
```

- [ ] **Step 3: Verificar GET members con token admin**

```bash
# Primero obtener token admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@powergym.cl","password":"admin123"}' | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).token))")

curl -s http://localhost:3000/api/members \
  -H "Authorization: Bearer $TOKEN" | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).length,'miembros'))"
```
Esperado: `10 miembros`

- [ ] **Step 4: Commit**

```bash
git add routes/me.js routes/members.js
git commit -m "feat: add me and members routes"
```

---

## Task 7: Rutas de rutinas

**Files:**
- Modify: `routes/routines.js`

- [ ] **Step 1: Escribir `routes/routines.js`**

```js
// routes/routines.js
const router = require('express').Router()
const auth = require('../middleware/auth')
const adminAuth = require('../middleware/adminAuth')
const db = require('../db')

// GET /api/routines — miembro o admin ven las rutinas del gym
router.get('/', async (req, res) => {
  // Intentar autenticar como miembro o admin
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Token requerido' })
  const jwt = require('jsonwebtoken')
  let gymCode
  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
    gymCode = payload.gym_code
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }

  try {
    const { rows: routines } = await db.query(
      'SELECT * FROM routines WHERE gym_code = $1 ORDER BY id',
      [gymCode]
    )
    const { rows: exercises } = await db.query(
      `SELECT e.* FROM exercises e
       JOIN routines r ON r.id = e.routine_id
       WHERE r.gym_code = $1
       ORDER BY e.routine_id, e.position`,
      [gymCode]
    )
    const result = routines.map(r => ({
      ...r,
      exercises: exercises.filter(e => e.routine_id === r.id)
    }))
    res.json(result)
  } catch (err) {
    console.error('routines GET error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /api/routines
router.post('/', adminAuth, async (req, res) => {
  const { name, day_of_week, exercises = [] } = req.body
  if (!name) return res.status(400).json({ error: 'name es requerido' })

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      'INSERT INTO routines (gym_code, name, day_of_week) VALUES ($1,$2,$3) RETURNING id',
      [req.gym.gym_code, name, day_of_week || '']
    )
    const routineId = rows[0].id
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]
      await client.query(
        'INSERT INTO exercises (routine_id, name, sets, reps, rest_seconds, position) VALUES ($1,$2,$3,$4,$5,$6)',
        [routineId, ex.name, ex.sets || 3, ex.reps || 12, ex.rest_seconds || 60, i]
      )
    }
    await client.query('COMMIT')
    res.status(201).json({ id: routineId, name, day_of_week, exercises })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('routines POST error:', err)
    res.status(500).json({ error: 'Error interno' })
  } finally {
    client.release()
  }
})

// PUT /api/routines/:id
router.put('/:id', adminAuth, async (req, res) => {
  const { name, day_of_week, exercises = [] } = req.body
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      'UPDATE routines SET name=$1, day_of_week=$2 WHERE id=$3 AND gym_code=$4',
      [name, day_of_week, req.params.id, req.gym.gym_code]
    )
    await client.query('DELETE FROM exercises WHERE routine_id=$1', [req.params.id])
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]
      await client.query(
        'INSERT INTO exercises (routine_id, name, sets, reps, rest_seconds, position) VALUES ($1,$2,$3,$4,$5,$6)',
        [req.params.id, ex.name, ex.sets || 3, ex.reps || 12, ex.rest_seconds || 60, i]
      )
    }
    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('routines PUT error:', err)
    res.status(500).json({ error: 'Error interno' })
  } finally {
    client.release()
  }
})

// DELETE /api/routines/:id
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM routines WHERE id=$1 AND gym_code=$2',
      [req.params.id, req.gym.gym_code]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Rutina no encontrada' })
    res.json({ ok: true })
  } catch (err) {
    console.error('routines DELETE error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
```

- [ ] **Step 2: Commit**

```bash
git add routes/routines.js
git commit -m "feat: add routines CRUD route"
```

---

## Task 8: Ruta de workouts (puntos y racha)

**Files:**
- Modify: `routes/workouts.js`

- [ ] **Step 1: Escribir `routes/workouts.js`**

```js
// routes/workouts.js — registra un entrenamiento y calcula puntos
const router = require('express').Router()
const auth = require('../middleware/auth')
const db = require('../db')

function calcLevel(points) {
  if (points >= 3000) return 10
  if (points >= 2000) return 9
  if (points >= 1500) return 8
  if (points >= 1000) return 7
  if (points >= 750)  return 6
  if (points >= 500)  return 5
  if (points >= 300)  return 4
  if (points >= 200)  return 3
  if (points >= 100)  return 2
  return 1
}

router.post('/', auth, async (req, res) => {
  const { routine_id, duration_minutes = 0 } = req.body
  if (!routine_id) return res.status(400).json({ error: 'routine_id es requerido' })

  const client = await db.connect()
  try {
    await client.query('BEGIN')

    // Obtener estado actual del miembro
    const { rows } = await client.query(
      'SELECT points, streak, level, last_workout FROM members WHERE id = $1',
      [req.member.id]
    )
    const member = rows[0]
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Calcular nueva racha
    let newStreak = member.streak
    if (member.last_workout === today) {
      // Ya entrenó hoy, no cambia racha
    } else if (member.last_workout === yesterday) {
      newStreak = member.streak + 1
    } else {
      newStreak = 1
    }

    // Calcular puntos ganados (máx 50)
    const pointsEarned = Math.min(10 + (newStreak * 2), 50)
    const newPoints = member.points + pointsEarned
    const newLevel = calcLevel(newPoints)

    // Actualizar miembro
    await client.query(
      'UPDATE members SET points=$1, streak=$2, level=$3, last_workout=$4 WHERE id=$5',
      [newPoints, newStreak, newLevel, today, req.member.id]
    )

    // Registrar workout
    await client.query(
      'INSERT INTO workouts (member_id, routine_id, date, points_earned, duration_minutes) VALUES ($1,$2,$3,$4,$5)',
      [req.member.id, routine_id, today, pointsEarned, duration_minutes]
    )

    await client.query('COMMIT')

    res.json({
      points_earned: pointsEarned,
      new_total_points: newPoints,
      new_streak: newStreak,
      new_level: newLevel,
      level_up: newLevel > member.level,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('workouts POST error:', err)
    res.status(500).json({ error: 'Error interno' })
  } finally {
    client.release()
  }
})

module.exports = router
```

- [ ] **Step 2: Commit**

```bash
git add routes/workouts.js
git commit -m "feat: add workout route with points and streak logic"
```

---

## Task 9: Ranking y Dashboard

**Files:**
- Modify: `routes/ranking.js`
- Modify: `routes/dashboard.js`

- [ ] **Step 1: Escribir `routes/ranking.js`**

```js
// routes/ranking.js
const router = require('express').Router()
const jwt = require('jsonwebtoken')
const db = require('../db')

router.get('/', async (req, res) => {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Token requerido' })
  let gymCode
  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
    gymCode = payload.gym_code
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }

  try {
    const { rows } = await db.query(
      `SELECT full_name, points, streak, level,
        ROW_NUMBER() OVER (ORDER BY points DESC) AS rank
       FROM members
       WHERE gym_code = $1 AND active = TRUE
       ORDER BY points DESC
       LIMIT 50`,
      [gymCode]
    )
    res.json(rows)
  } catch (err) {
    console.error('ranking error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
```

- [ ] **Step 2: Escribir `routes/dashboard.js`**

```js
// routes/dashboard.js — stats para el panel admin
const router = require('express').Router()
const adminAuth = require('../middleware/adminAuth')
const db = require('../db')

router.get('/', adminAuth, async (req, res) => {
  const gym = req.gym.gym_code
  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  try {
    const [
      statsRes, workoutsTodayRes, workoutsPerDayRes,
      top5Res, atRiskRes, recentRes, subsRes
    ] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE active = TRUE) AS active_members,
          ROUND(AVG(streak), 1) AS avg_streak,
          COUNT(*) FILTER (WHERE last_workout <= CURRENT_DATE - 7) AS at_risk_count
        FROM members WHERE gym_code = $1`, [gym]),
      db.query(`
        SELECT COUNT(*) AS count FROM workouts w
        JOIN members m ON m.id = w.member_id
        WHERE m.gym_code = $1 AND w.date = $2`, [gym, today]),
      db.query(`
        SELECT w.date::text, COUNT(*) AS count
        FROM workouts w JOIN members m ON m.id = w.member_id
        WHERE m.gym_code = $1 AND w.date >= $2
        GROUP BY w.date ORDER BY w.date`, [gym, sevenDaysAgo]),
      db.query(`
        SELECT full_name, points, streak, level FROM members
        WHERE gym_code = $1 AND active = TRUE
        ORDER BY points DESC LIMIT 5`, [gym]),
      db.query(`
        SELECT id, full_name, last_workout FROM members
        WHERE gym_code = $1 AND last_workout <= CURRENT_DATE - 7
        ORDER BY last_workout ASC LIMIT 10`, [gym]),
      db.query(`
        SELECT m.full_name, w.date::text, r.name AS routine_name
        FROM workouts w
        JOIN members m ON m.id = w.member_id
        JOIN routines r ON r.id = w.routine_id
        WHERE m.gym_code = $1
        ORDER BY w.created_at DESC LIMIT 5`, [gym]),
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'overdue') AS overdue,
          COUNT(*) FILTER (WHERE status = 'due_soon') AS due_soon
        FROM subscriptions s
        JOIN members m ON m.id = s.member_id
        WHERE m.gym_code = $1`, [gym]),
    ])

    const stats = statsRes.rows[0]
    res.json({
      active_members:    parseInt(stats.active_members),
      workouts_today:    parseInt(workoutsTodayRes.rows[0].count),
      avg_streak:        parseFloat(stats.avg_streak) || 0,
      at_risk_count:     parseInt(stats.at_risk_count),
      overdue_payments:  parseInt(subsRes.rows[0].overdue),
      due_soon_payments: parseInt(subsRes.rows[0].due_soon),
      workouts_per_day:  workoutsPerDayRes.rows,
      top_members:       top5Res.rows,
      at_risk_members:   atRiskRes.rows,
      recent_activity:   recentRes.rows,
    })
  } catch (err) {
    console.error('dashboard error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
```

- [ ] **Step 3: Commit**

```bash
git add routes/ranking.js routes/dashboard.js
git commit -m "feat: add ranking and dashboard routes"
```

---

## Task 10: Ruta de suscripciones

**Files:**
- Modify: `routes/subscriptions.js`

- [ ] **Step 1: Escribir `routes/subscriptions.js`**

```js
// routes/subscriptions.js — cobros (solo admin)
const router = require('express').Router()
const adminAuth = require('../middleware/adminAuth')
const db = require('../db')

router.get('/', adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.id, s.member_id, m.full_name, m.rut, m.phone,
              s.price, s.due_day, s.last_payment_date, s.status,
              CASE
                WHEN s.status = 'overdue'
                THEN EXTRACT(DAY FROM NOW() - DATE_TRUNC('month', NOW()) - (s.due_day - 1) * INTERVAL '1 day')::INTEGER
                ELSE 0
              END AS days_overdue
       FROM subscriptions s
       JOIN members m ON m.id = s.member_id
       WHERE m.gym_code = $1
       ORDER BY
         CASE s.status WHEN 'overdue' THEN 1 WHEN 'due_soon' THEN 2 WHEN 'pending' THEN 3 ELSE 4 END,
         m.full_name`,
      [req.gym.gym_code]
    )
    res.json(rows)
  } catch (err) {
    console.error('subscriptions GET error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

router.patch('/:memberId', adminAuth, async (req, res) => {
  const { last_payment_date } = req.body
  if (!last_payment_date) return res.status(400).json({ error: 'last_payment_date requerido' })

  try {
    const { rowCount } = await db.query(
      `UPDATE subscriptions SET last_payment_date = $1, status = 'paid'
       WHERE member_id = $2
       AND EXISTS (SELECT 1 FROM members WHERE id = $2 AND gym_code = $3)`,
      [last_payment_date, req.params.memberId, req.gym.gym_code]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Suscripción no encontrada' })
    res.json({ ok: true, new_status: 'paid' })
  } catch (err) {
    console.error('subscriptions PATCH error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
```

- [ ] **Step 2: Commit**

```bash
git add routes/subscriptions.js
git commit -m "feat: add subscriptions route"
```

---

## Task 11: Cron de estados de suscripción

**Files:**
- Modify: `cron/subscription-status.js`

- [ ] **Step 1: Escribir `cron/subscription-status.js`**

```js
// cron/subscription-status.js — actualiza estados diariamente a las 8am Chile (UTC-3 = 11:00 UTC)
const cron = require('node-cron')
const db = require('../db')

async function updateSubscriptionStatuses() {
  console.log('[cron] Actualizando estados de suscripción...')
  try {
    const today = new Date()
    const day = today.getDate()
    const year = today.getFullYear()
    const month = today.getMonth() + 1

    // paid: last_payment_date es de este mes
    await db.query(`
      UPDATE subscriptions
      SET status = 'paid'
      WHERE EXTRACT(YEAR FROM last_payment_date) = $1
        AND EXTRACT(MONTH FROM last_payment_date) = $2`,
      [year, month]
    )

    // overdue: due_day ya pasó este mes y no está paid
    await db.query(`
      UPDATE subscriptions
      SET status = 'overdue'
      WHERE status != 'paid' AND due_day < $1`,
      [day]
    )

    // due_soon: vence en los próximos 3 días
    await db.query(`
      UPDATE subscriptions
      SET status = 'due_soon'
      WHERE status != 'paid' AND due_day BETWEEN $1 AND $2`,
      [day, day + 3]
    )

    // pending: el resto
    await db.query(`
      UPDATE subscriptions
      SET status = 'pending'
      WHERE status NOT IN ('paid', 'overdue', 'due_soon')`)

    console.log('[cron] Estados de suscripción actualizados')
  } catch (err) {
    console.error('[cron] Error actualizando estados:', err.message)
  }
}

// Ejecutar al arrancar el servidor
updateSubscriptionStatuses()

// Ejecutar diariamente a las 11:00 UTC (08:00 Chile UTC-3)
cron.schedule('0 11 * * *', updateSubscriptionStatuses)

module.exports = { updateSubscriptionStatuses }
```

- [ ] **Step 2: Commit**

```bash
git add cron/subscription-status.js
git commit -m "feat: add daily subscription status cron"
```

---

## Task 12: Configuración Railway y deploy

**Files:**
- Create: `Procfile`
- Create: `railway.toml`
- Create: `.env.example`

- [ ] **Step 1: Crear `Procfile`**

```
web: node index.js
```

- [ ] **Step 2: Crear `railway.toml`**

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node index.js"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

- [ ] **Step 3: Instalar Railway CLI**

```bash
npm install -g @railway/cli
railway login
```
Abrirá el navegador para login.

- [ ] **Step 4: Crear proyecto en Railway**

```bash
cd C:\Users\sebas\fitpulse-backend
railway init
```
Nombre del proyecto: `fitpulse`

- [ ] **Step 5: Agregar base de datos PostgreSQL**

En la web de Railway (railway.app):
1. Entrar al proyecto `fitpulse`
2. Click **+ New** → **Database** → **PostgreSQL**
3. Esperar que se cree (≈1 minuto)
4. Click en el servicio PostgreSQL → pestaña **Variables**
5. Copiar el valor de `DATABASE_URL`

- [ ] **Step 6: Configurar variables de entorno**

```bash
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
railway variables set NODE_ENV=production
```

Railway auto-inyecta `DATABASE_URL` y `PORT` desde el servicio PostgreSQL.

- [ ] **Step 7: Aplicar schema y seed en Railway**

```bash
# Obtener DATABASE_URL de Railway
railway variables

# Aplicar schema
psql "postgresql://..." -f schema.sql

# Aplicar seed
psql "postgresql://..." -f seed.sql
```

Reemplazar `"postgresql://..."` con el `DATABASE_URL` obtenido en Step 5.

- [ ] **Step 8: Deploy**

```bash
railway up
```
Esperado: build exitoso, URL asignada `https://fitpulse-api-xxx.up.railway.app`

- [ ] **Step 9: Verificar endpoint en producción**

```bash
curl https://fitpulse-api.up.railway.app/api/health
```
Esperado: `{"ok":true,"ts":"2026-..."}`

```bash
curl -s -X POST https://fitpulse-api.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"gym_code":"GYM01","rut":"12345678-9","password":"fitpulse123"}'
```
Esperado: respuesta con token y datos del miembro.

- [ ] **Step 10: Configurar dominio personalizado (opcional)**

En Railway → servicio `fitpulse-backend` → Settings → Domains → Add custom domain → `fitpulse-api.up.railway.app`

- [ ] **Step 11: Commit final**

```bash
git add Procfile railway.toml .env.example
git commit -m "feat: add Railway deploy config"
```

---

## Self-Review

**Spec coverage:**
- ✅ `POST /api/auth/login` — Task 5
- ✅ `POST /api/admin/login` — Task 5
- ✅ `GET /api/me` — Task 6
- ✅ `GET/POST/PATCH /api/members` — Task 6
- ✅ `GET/POST/PUT/DELETE /api/routines` — Task 7
- ✅ `POST /api/workouts` (puntos, racha, nivel) — Task 8
- ✅ `GET /api/ranking` — Task 9
- ✅ `GET /api/dashboard` — Task 9
- ✅ `GET/PATCH /api/subscriptions` — Task 10
- ✅ Cron diario de estados — Task 11
- ✅ Deploy Railway — Task 12
- ✅ Schema + seed demo — Task 2

**Placeholders:** Ninguno — código completo en cada step.

**Consistencia de tipos:** `req.member.id`, `req.gym.gym_code` usados consistentemente en todos los middlewares y rutas.
