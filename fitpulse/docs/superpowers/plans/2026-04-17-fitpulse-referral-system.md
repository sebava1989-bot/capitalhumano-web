# FitPulse — Sistema de Referidos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Los miembros ganan puntos cuando refieren nuevos socios al gym; el admin registra el nuevo miembro con el código del referidor y los puntos se otorgan automáticamente.

**Architecture:** Dos columnas nuevas en `members` (`referral_code`, `referred_by`) y una en `gyms` (`referral_points`). El código se genera al crear el miembro (`GYM01-0001`). El admin panel agrega un campo opcional en el modal de creación. Un endpoint nuevo permite al miembro ver su código desde la app Flutter.

**Tech Stack:** Node.js + Express 5, pg (PostgreSQL), Next.js 14 App Router, TypeScript, Railway

---

## Estructura de archivos

```
fitpulse-backend/
├── migrate-referrals.js        ← NUEVO: script de migración BD
├── routes/members.js           ← MODIFICAR: POST genera referral_code + lógica referido
├── routes/referral.js          ← NUEVO: GET /api/referral (endpoint para miembro Flutter)
├── routes/admin.js             ← MODIFICAR: agregar GET/PATCH referral-points + GET referrals
└── index.js                    ← MODIFICAR: montar /api/referral

fitpulse-admin/
├── app/dashboard/members/page.tsx   ← MODIFICAR: campo código referido + toast
└── app/dashboard/page.tsx           ← MODIFICAR: tarjeta referidos + config puntos
```

---

## Task 1: Migración de base de datos

**Files:**
- Create: `C:\Users\sebas\fitpulse-backend\migrate-referrals.js`

- [ ] **Step 1: Crear `migrate-referrals.js`**

```js
// migrate-referrals.js
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  try {
    console.log('Aplicando migración referidos...')
    await pool.query(`
      ALTER TABLE members
        ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE,
        ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES members(id);
    `)
    await pool.query(`
      ALTER TABLE gyms
        ADD COLUMN IF NOT EXISTS referral_points INTEGER DEFAULT 300;
    `)
    console.log('Migración OK')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
}

run()
```

- [ ] **Step 2: Ejecutar migración en Railway**

Desde `C:\Users\sebas\fitpulse-backend` en CMD:
```
railway run node migrate-referrals.js
```

Esperado:
```
Aplicando migración referidos...
Migración OK
```

- [ ] **Step 3: Verificar columnas**

```
railway run node -e "const {Pool}=require('pg'); const p=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); p.query('SELECT referral_code,referred_by FROM members LIMIT 1').then(r=>console.log('members OK',r.fields.map(f=>f.name))); p.query('SELECT referral_points FROM gyms LIMIT 1').then(r=>console.log('gyms OK',r.fields.map(f=>f.name))).finally(()=>p.end())"
```

Esperado: `members OK [ 'referral_code', 'referred_by' ]` y `gyms OK [ 'referral_points' ]`

- [ ] **Step 4: Commit**

```bash
cd C:\Users\sebas\fitpulse-backend
git add migrate-referrals.js
git commit -m "feat: add referral migration script"
```

---

## Task 2: Backend — Generar referral_code y lógica de referido en POST /members

**Files:**
- Modify: `C:\Users\sebas\fitpulse-backend\routes\members.js`

El POST actual crea miembro + suscripción. Hay que agregar:
1. Generar `referral_code` después del INSERT
2. Si viene `referral_code` en el body, buscar al referidor y darle puntos

- [ ] **Step 1: Leer el archivo actual**

```bash
cat C:\Users\sebas\fitpulse-backend\routes\members.js
```

- [ ] **Step 2: Reemplazar `routes/members.js` completo**

```js
// routes/members.js — CRUD miembros (solo admin)
const router = require('express').Router()
const bcrypt = require('bcryptjs')
const adminAuth = require('../middleware/adminAuth')
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
  const {
    full_name, rut, password, phone, email,
    subscription_price = 25000, payment_due_day = 5,
    referral_code: inputReferralCode
  } = req.body

  if (!full_name || !rut || !password) {
    return res.status(400).json({ error: 'full_name, rut y password son requeridos' })
  }

  const client = await db.connect()
  try {
    await client.query('BEGIN')

    // Crear miembro
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await client.query(
      `INSERT INTO members (gym_code, full_name, rut, password_hash, phone, email)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [req.gym.gym_code, full_name, rut.trim(), hash, phone || null, email || null]
    )
    const memberId = rows[0].id

    // Generar código de referido único
    const referralCode = `${req.gym.gym_code}-${memberId.toString().padStart(4, '0')}`
    await client.query('UPDATE members SET referral_code = $1 WHERE id = $2', [referralCode, memberId])

    // Procesar referido si viene código
    let referrerName = null
    if (inputReferralCode) {
      const { rows: refRows } = await client.query(
        `SELECT m.id, m.full_name, m.points
         FROM members m
         WHERE UPPER(m.referral_code) = UPPER($1) AND m.gym_code = $2 AND m.id != $3`,
        [inputReferralCode.trim(), req.gym.gym_code, memberId]
      )
      if (refRows.length > 0) {
        const referrer = refRows[0]
        const { rows: gymRows } = await client.query(
          'SELECT COALESCE(referral_points, 300) AS referral_points FROM gyms WHERE code = $1',
          [req.gym.gym_code]
        )
        const pts = gymRows[0].referral_points
        const newPts = referrer.points + pts
        const newLevel = calcLevel(newPts)

        await client.query(
          'UPDATE members SET points = $1, level = $2 WHERE id = $3',
          [newPts, newLevel, referrer.id]
        )
        await client.query(
          'UPDATE members SET referred_by = $1 WHERE id = $2',
          [referrer.id, memberId]
        )
        referrerName = referrer.full_name
      }
    }

    // Crear suscripción
    await client.query(
      `INSERT INTO subscriptions (member_id, price, due_day) VALUES ($1,$2,$3)`,
      [memberId, subscription_price, payment_due_day]
    )

    await client.query('COMMIT')
    res.status(201).json({
      id: memberId,
      full_name,
      rut,
      active: true,
      referral_code: referralCode,
      referrer_name: referrerName
    })
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

- [ ] **Step 3: Probar localmente con curl (opcional, si tienes token)**

El endpoint ahora devuelve `referral_code` y `referrer_name` en la respuesta del POST.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\sebas\fitpulse-backend
git add routes/members.js
git commit -m "feat: generate referral_code on member create + award points to referrer"
```

---

## Task 3: Backend — Nuevos endpoints de referidos

**Files:**
- Create: `C:\Users\sebas\fitpulse-backend\routes\referral.js`
- Modify: `C:\Users\sebas\fitpulse-backend\routes\admin.js`

- [ ] **Step 1: Crear `routes/referral.js`**

```js
// routes/referral.js — endpoint para miembro: ver su código y stats
const router = require('express').Router()
const auth = require('../middleware/auth')
const db = require('../db')

// GET /api/referral — código del miembro autenticado + cuántos referidos tiene
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT m.referral_code,
              (SELECT COUNT(*) FROM members r WHERE r.referred_by = m.id) AS referral_count,
              (SELECT COALESCE(referral_points, 300) FROM gyms WHERE code = m.gym_code) AS points_per_referral
       FROM members m
       WHERE m.id = $1`,
      [req.member.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Miembro no encontrado' })

    const r = rows[0]
    res.json({
      referral_code: r.referral_code,
      referral_count: parseInt(r.referral_count),
      points_per_referral: parseInt(r.points_per_referral),
      points_earned: parseInt(r.referral_count) * parseInt(r.points_per_referral)
    })
  } catch (err) {
    console.error('referral GET error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
```

- [ ] **Step 2: Agregar endpoints admin al final de `routes/admin.js`** (antes de `module.exports`)

Leer primero el archivo actual para preservar el login existente, luego agregar al final:

```js
const adminAuth = require('../middleware/adminAuth')
const db = require('../db')

// GET /api/admin/referral-points — obtener puntos por referido configurados
router.get('/referral-points', adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT COALESCE(referral_points, 300) AS referral_points FROM gyms WHERE code = $1',
      [req.gym.gym_code]
    )
    res.json({ referral_points: rows[0].referral_points })
  } catch (err) {
    res.status(500).json({ error: 'Error interno' })
  }
})

// PATCH /api/admin/referral-points — actualizar puntos por referido
router.patch('/referral-points', adminAuth, async (req, res) => {
  const { referral_points } = req.body
  if (!referral_points || referral_points < 50 || referral_points > 2000) {
    return res.status(400).json({ error: 'referral_points debe estar entre 50 y 2000' })
  }
  try {
    await db.query(
      'UPDATE gyms SET referral_points = $1 WHERE code = $2',
      [referral_points, req.gym.gym_code]
    )
    res.json({ ok: true, referral_points })
  } catch (err) {
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /api/admin/referrals — lista de referidos del gym
router.get('/referrals', adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         m.id, m.full_name, m.referral_code,
         COUNT(r.id) AS referral_count,
         COUNT(r.id) * COALESCE(g.referral_points, 300) AS points_awarded
       FROM members m
       JOIN gyms g ON g.code = m.gym_code
       LEFT JOIN members r ON r.referred_by = m.id
       WHERE m.gym_code = $1
       GROUP BY m.id, m.full_name, m.referral_code, g.referral_points
       HAVING COUNT(r.id) > 0
       ORDER BY referral_count DESC`,
      [req.gym.gym_code]
    )
    res.json(rows.map(r => ({
      id: r.id,
      full_name: r.full_name,
      referral_code: r.referral_code,
      referral_count: parseInt(r.referral_count),
      points_awarded: parseInt(r.points_awarded)
    })))
  } catch (err) {
    console.error('admin/referrals error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})
```

**Nota:** `routes/admin.js` ya tiene `const router = require('express').Router()` al inicio pero NO tiene `adminAuth` ni `db` importados todavía. Agregar esos imports al principio del archivo también.

El archivo `routes/admin.js` completo después de modificar:

```js
// routes/admin.js — login del dueño del gym + config admin
const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const adminAuth = require('../middleware/adminAuth')
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

// GET /api/admin/referral-points
router.get('/referral-points', adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT COALESCE(referral_points, 300) AS referral_points FROM gyms WHERE code = $1',
      [req.gym.gym_code]
    )
    res.json({ referral_points: rows[0].referral_points })
  } catch (err) {
    res.status(500).json({ error: 'Error interno' })
  }
})

// PATCH /api/admin/referral-points
router.patch('/referral-points', adminAuth, async (req, res) => {
  const { referral_points } = req.body
  if (!referral_points || referral_points < 50 || referral_points > 2000) {
    return res.status(400).json({ error: 'referral_points debe estar entre 50 y 2000' })
  }
  try {
    await db.query(
      'UPDATE gyms SET referral_points = $1 WHERE code = $2',
      [referral_points, req.gym.gym_code]
    )
    res.json({ ok: true, referral_points })
  } catch (err) {
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /api/admin/referrals
router.get('/referrals', adminAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         m.id, m.full_name, m.referral_code,
         COUNT(r.id) AS referral_count,
         COUNT(r.id) * COALESCE(g.referral_points, 300) AS points_awarded
       FROM members m
       JOIN gyms g ON g.code = m.gym_code
       LEFT JOIN members r ON r.referred_by = m.id
       WHERE m.gym_code = $1
       GROUP BY m.id, m.full_name, m.referral_code, g.referral_points
       HAVING COUNT(r.id) > 0
       ORDER BY referral_count DESC`,
      [req.gym.gym_code]
    )
    res.json(rows.map(r => ({
      id: r.id,
      full_name: r.full_name,
      referral_code: r.referral_code,
      referral_count: parseInt(r.referral_count),
      points_awarded: parseInt(r.points_awarded)
    })))
  } catch (err) {
    console.error('admin/referrals error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
```

- [ ] **Step 3: Montar `/api/referral` en `index.js`**

Agregar después de la línea `app.use('/api/subscriptions', ...)`:

```js
app.use('/api/referral', require('./routes/referral'))
```

El bloque de rutas en `index.js` queda:

```js
app.use('/api/auth',          require('./routes/auth'))
app.use('/api/admin',         require('./routes/admin'))
app.use('/api/me',            require('./routes/me'))
app.use('/api/members',       require('./routes/members'))
app.use('/api/routines',      require('./routes/routines'))
app.use('/api/workouts',      require('./routes/workouts'))
app.use('/api/ranking',       require('./routes/ranking'))
app.use('/api/dashboard',     require('./routes/dashboard'))
app.use('/api/subscriptions', require('./routes/subscriptions'))
app.use('/api/referral',      require('./routes/referral'))
```

- [ ] **Step 4: Commit**

```bash
cd C:\Users\sebas\fitpulse-backend
git add routes/referral.js routes/admin.js index.js
git commit -m "feat: add referral endpoints for member and admin"
```

---

## Task 4: Deploy backend a Railway

**Files:** ninguno nuevo

- [ ] **Step 1: Push y esperar deploy**

```bash
cd C:\Users\sebas\fitpulse-backend
git push
```

Abrir Railway dashboard y esperar que el deploy complete (≈2 min).

- [ ] **Step 2: Verificar endpoints**

Probar health check:
```
curl https://fitpulse-production-d06c.up.railway.app/api/health
```
Esperado: `{"ok":true,"ts":"..."}`

- [ ] **Step 3: Verificar nuevo endpoint admin (con token)**

Desde el panel admin ya logueado, abrir DevTools → Console y pegar:
```js
fetch('https://fitpulse-production-d06c.up.railway.app/api/admin/referral-points', {
  headers: { Authorization: 'Bearer ' + localStorage.getItem('fp_admin_token') }
}).then(r=>r.json()).then(console.log)
```
Esperado: `{ referral_points: 300 }`

---

## Task 5: Admin Panel — Campo referido en modal + toast

**Files:**
- Modify: `C:\Users\sebas\fitpulse-admin\app\dashboard\members\page.tsx`

- [ ] **Step 1: Leer el archivo actual**

Leer `C:\Users\sebas\fitpulse-admin\app\dashboard\members\page.tsx` completo para ver el estado actual del form y el modal.

- [ ] **Step 2: Agregar `referral_code` al state del formulario**

Cambiar:
```ts
const [form, setForm] = useState({ full_name: '', rut: '', phone: '', password: '' })
```
Por:
```ts
const [form, setForm] = useState({ full_name: '', rut: '', phone: '', password: '', referral_code: '' })
const [referrerToast, setReferrerToast] = useState<string | null>(null)
```

- [ ] **Step 3: Actualizar `addMember` para enviar referral_code y mostrar toast**

Cambiar la función `addMember`:
```ts
async function addMember() {
  if (!form.full_name || !form.rut || !form.password) return
  const created = await apiPost<{ id: number; full_name: string; rut: string; active: boolean; referral_code: string; referrer_name: string | null }>('/members', {
    full_name: form.full_name,
    rut: form.rut,
    phone: form.phone,
    password: form.password,
    referral_code: form.referral_code || undefined,
  })
  setMembers(prev => [{
    ...created,
    level: 1, points: 0, streak: 0, last_workout: '',
    subscription_status: 'pending' as const
  }, ...prev])
  if (created.referrer_name) {
    setReferrerToast(`✅ ${created.referrer_name} ganó puntos por este referido`)
    setTimeout(() => setReferrerToast(null), 5000)
  }
  setForm({ full_name: '', rut: '', phone: '', password: '', referral_code: '' })
  setShowModal(false)
}
```

- [ ] **Step 4: Agregar campo referral_code al modal y toast**

En el JSX del modal de agregar miembro, agregar después del campo de teléfono y antes de la contraseña:

```tsx
<div>
  <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">
    Código de referido <span className="text-[#6b7280] font-normal">(opcional)</span>
  </label>
  <input
    value={form.referral_code}
    onChange={e => setForm(f => ({ ...f, referral_code: e.target.value }))}
    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]"
    placeholder="GYM01-0001"
  />
</div>
```

Y el toast, dentro del `return (...)` al inicio del componente, después del `<Topbar`:
```tsx
{referrerToast && (
  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm font-semibold text-green-700">
    {referrerToast}
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
cd C:\Users\sebas\fitpulse-admin
git add app/dashboard/members/page.tsx
git commit -m "feat: add referral_code field to add member modal with toast"
```

---

## Task 6: Admin Panel — Tarjeta referidos + config puntos en Dashboard

**Files:**
- Modify: `C:\Users\sebas\fitpulse-admin\app\dashboard\page.tsx`

- [ ] **Step 1: Leer el archivo actual del dashboard**

Leer `C:\Users\sebas\fitpulse-admin\app\dashboard\page.tsx` completo.

- [ ] **Step 2: Agregar interfaces y state para referidos**

Agregar al bloque de interfaces existente:
```ts
interface ReferralStat {
  id: number
  full_name: string
  referral_code: string
  referral_count: number
  points_awarded: number
}
```

Agregar al bloque de state dentro del componente (después de `const [data, setData] = useState...`):
```ts
const [referrals, setReferrals] = useState<ReferralStat[]>([])
const [referralPoints, setReferralPoints] = useState(300)
const [editingPoints, setEditingPoints] = useState(false)
const [pointsInput, setPointsInput] = useState('300')
```

- [ ] **Step 3: Agregar fetches al useEffect**

Reemplazar el `useEffect` existente:
```ts
useEffect(() => {
  apiGet<DashboardData>('/dashboard').then(setData).catch(console.error)
  apiGet<ReferralStat[]>('/admin/referrals').then(setReferrals).catch(console.error)
  apiGet<{ referral_points: number }>('/admin/referral-points')
    .then(d => { setReferralPoints(d.referral_points); setPointsInput(String(d.referral_points)) })
    .catch(console.error)
}, [])
```

- [ ] **Step 4: Agregar función para guardar puntos**

Agregar después del useEffect:
```ts
async function saveReferralPoints() {
  const pts = parseInt(pointsInput)
  if (!pts || pts < 50 || pts > 2000) return
  await apiPatch<{ ok: boolean; referral_points: number }>('/admin/referral-points', { referral_points: pts })
  setReferralPoints(pts)
  setEditingPoints(false)
}
```

Actualizar el import de api.ts para incluir `apiPatch`:
```ts
import { apiGet, apiPatch } from '@/lib/api'
```

- [ ] **Step 5: Agregar tarjeta de referidos al JSX**

Al final del return, después de la sección de `grid grid-cols-3`, agregar:

```tsx
{/* Referidos */}
<div className="mt-6 grid grid-cols-[1.6fr_1fr] gap-4">
  <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-[#1a1a1a]">🔗 Top referidores</h3>
      <span className="text-xs text-[#6b7280]">{referrals.length} miembros con referidos</span>
    </div>
    {referrals.length === 0 ? (
      <p className="text-sm text-[#6b7280]">Aún no hay referidos. ¡Comparte los códigos!</p>
    ) : (
      <div className="space-y-3">
        {referrals.slice(0, 5).map(r => (
          <div key={r.id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-xs font-extrabold text-[#FF4D00] shrink-0">
              {r.full_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1a1a1a] truncate">{r.full_name}</p>
              <p className="text-xs text-[#6b7280]">Código: {r.referral_code}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-[#FF4D00]">{r.referral_count} referido{r.referral_count !== 1 ? 's' : ''}</p>
              <p className="text-xs text-[#6b7280]">+{r.points_awarded} pts</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5">
    <h3 className="text-sm font-bold text-[#1a1a1a] mb-4">⚙️ Puntos por referido</h3>
    <p className="text-xs text-[#6b7280] mb-3">Puntos que gana un miembro cuando trae a alguien nuevo al gym.</p>
    {editingPoints ? (
      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={pointsInput}
          onChange={e => setPointsInput(e.target.value)}
          min={50}
          max={2000}
          className="flex-1 px-3 py-2 rounded-xl border border-[#e5e7eb] bg-[#f5f5f7] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]"
        />
        <button onClick={saveReferralPoints} className="px-3 py-2 rounded-xl bg-[#FF4D00] text-white text-sm font-bold hover:bg-[#CC3D00]">
          Guardar
        </button>
        <button onClick={() => setEditingPoints(false)} className="px-3 py-2 rounded-xl border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f5f5f7]">
          ✕
        </button>
      </div>
    ) : (
      <div className="flex items-center justify-between">
        <p className="text-3xl font-extrabold text-[#FF4D00]">{referralPoints} <span className="text-base font-semibold text-[#6b7280]">pts</span></p>
        <button onClick={() => setEditingPoints(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f5f7]">
          Editar
        </button>
      </div>
    )}
    <p className="text-xs text-[#6b7280] mt-3">Total entregado: <span className="font-bold text-[#1a1a1a]">{referrals.reduce((a,r)=>a+r.points_awarded,0).toLocaleString()} pts</span></p>
  </div>
</div>
```

- [ ] **Step 6: Commit**

```bash
cd C:\Users\sebas\fitpulse-admin
git add app/dashboard/page.tsx
git commit -m "feat: add referral stats card and points config to dashboard"
```

---

## Task 7: Build y verificación final

**Files:** ninguno nuevo

- [ ] **Step 1: Build del admin panel**

```bash
cd C:\Users\sebas\fitpulse-admin
npm run build
```

Esperado: 0 errores TypeScript.

Si hay error de `apiPatch` no importado, verificar que el import en `page.tsx` incluya `apiPatch`.

- [ ] **Step 2: Probar el flujo completo**

1. `npm run dev` en `C:\Users\sebas\fitpulse-admin`
2. Login con `admin@powergym.cl` / `admin123`
3. Dashboard → al final debe verse la tarjeta "🔗 Top referidores" (vacía por ahora) y la config "⚙️ Puntos por referido: 300"
4. Editar puntos → cambiar a 500 → Guardar → confirmar que se actualiza
5. Ir a Miembros → Agregar miembro → llenar datos con cualquier código inventado (`GYM01-0001`) → ver toast verde
6. Volver al Dashboard → la tarjeta de referidos debe mostrar al miembro que tiene el código `GYM01-0001`

- [ ] **Step 3: Deploy admin panel a Railway (opcional)**

Si el admin está deployado en Railway, hacer `git push` del repo del admin para redeploy.

- [ ] **Step 4: Commit final**

```bash
cd C:\Users\sebas\fitpulse-admin
git add -A
git commit -m "chore: verify referral system build"
```

---

## Self-Review

**Spec coverage:**
- ✅ `referral_code` en members — Task 1 + Task 2
- ✅ `referred_by` en members — Task 1 + Task 2
- ✅ `referral_points` en gyms — Task 1
- ✅ Generación automática del código al crear miembro — Task 2
- ✅ Lógica de awarding de puntos al referidor — Task 2
- ✅ GET /api/referral para miembro Flutter — Task 3
- ✅ GET /PATCH /api/admin/referral-points — Task 3
- ✅ GET /api/admin/referrals — Task 3
- ✅ Campo código referido en modal admin — Task 5
- ✅ Toast al crear con referido exitoso — Task 5
- ✅ Tarjeta referidos en dashboard — Task 6
- ✅ Config puntos por referido en dashboard — Task 6
- ⚠️ Flutter app (GET /api/referral, pantalla "Mi código") — **pendiente como plan separado** una vez confirmada la ruta de la app Flutter de FitPulse

**Placeholders:** Ninguno — código completo en todos los pasos.

**Consistencia de tipos:** `referral_points` es siempre `number`. `referral_count` se convierte con `parseInt()` en el backend antes de enviarse. `referrer_name` puede ser `string | null`. Consistente en backend → admin panel.
