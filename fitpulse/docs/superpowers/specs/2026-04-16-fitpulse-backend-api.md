# FitPulse — Backend API Core

**Fecha:** 2026-04-16  
**Estado:** Aprobado por usuario

## Resumen

API REST en Node.js + Express + PostgreSQL desplegada en Railway. Sirve tanto a la app Flutter (miembros) como al panel admin Next.js (dueño del gimnasio). Reemplaza todos los datos demo hardcodeados.

## Stack

- **Runtime:** Node.js 20 + Express 4
- **BD:** PostgreSQL 16 (servicio Railway)
- **Auth:** JWT — tokens separados para miembros y admins
- **ORM:** pg (driver nativo, sin ORM) — queries SQL directas
- **Cron:** node-cron — actualiza estados de suscripción diariamente
- **Deploy:** Railway — servicio `fitpulse-api`, URL ya hardcodeada en Flutter: `https://fitpulse-api.up.railway.app/api`

## Estructura de archivos

```
fitpulse-backend/
├── index.js                  ← entry point, server config
├── db.js                     ← pool PostgreSQL
├── middleware/
│   ├── auth.js               ← verifica JWT miembro
│   └── adminAuth.js          ← verifica JWT admin
├── routes/
│   ├── auth.js               ← POST /api/auth/login
│   ├── admin.js              ← POST /api/admin/login
│   ├── members.js            ← CRUD miembros (admin)
│   ├── routines.js           ← CRUD rutinas (admin + app)
│   ├── workouts.js           ← POST registrar entreno (app)
│   ├── ranking.js            ← GET ranking (app + admin)
│   ├── dashboard.js          ← GET stats (admin)
│   ├── me.js                 ← GET perfil miembro (app)
│   └── subscriptions.js      ← GET/PATCH cobros (admin)
├── cron/
│   └── subscription-status.js ← actualiza estados diariamente
├── schema.sql                ← DDL completo de la BD
├── seed.sql                  ← datos demo (GYM01 + 10 miembros)
├── package.json
├── .env.example
├── Procfile                  ← web: node index.js
└── railway.toml
```

## Base de Datos

### Tablas

```sql
-- Gimnasios
CREATE TABLE gyms (
  code          VARCHAR(10) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  owner_email   VARCHAR(100) UNIQUE NOT NULL,
  owner_password_hash VARCHAR(255) NOT NULL,
  plan          VARCHAR(20) DEFAULT 'FREE',
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Miembros
CREATE TABLE members (
  id            SERIAL PRIMARY KEY,
  gym_code      VARCHAR(10) REFERENCES gyms(code),
  full_name     VARCHAR(100) NOT NULL,
  rut           VARCHAR(12) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  points        INTEGER DEFAULT 0,
  streak        INTEGER DEFAULT 0,
  level         INTEGER DEFAULT 1,
  active        BOOLEAN DEFAULT TRUE,
  phone         VARCHAR(20),
  email         VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gym_code, rut)
);

-- Rutinas
CREATE TABLE routines (
  id            SERIAL PRIMARY KEY,
  gym_code      VARCHAR(10) REFERENCES gyms(code),
  name          VARCHAR(100) NOT NULL,
  day_of_week   VARCHAR(50),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Ejercicios
CREATE TABLE exercises (
  id            SERIAL PRIMARY KEY,
  routine_id    INTEGER REFERENCES routines(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  sets          INTEGER DEFAULT 3,
  reps          INTEGER DEFAULT 12,
  rest_seconds  INTEGER DEFAULT 60,
  position      INTEGER DEFAULT 0
);

-- Entrenamientos registrados
CREATE TABLE workouts (
  id               SERIAL PRIMARY KEY,
  member_id        INTEGER REFERENCES members(id),
  routine_id       INTEGER REFERENCES routines(id),
  date             DATE DEFAULT CURRENT_DATE,
  points_earned    INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Suscripciones (una por miembro)
CREATE TABLE subscriptions (
  id                SERIAL PRIMARY KEY,
  member_id         INTEGER REFERENCES members(id) UNIQUE,
  price             INTEGER NOT NULL DEFAULT 25000,
  due_day           INTEGER NOT NULL DEFAULT 5,  -- día del mes
  last_payment_date DATE,
  status            VARCHAR(20) DEFAULT 'pending', -- paid/overdue/due_soon/pending
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

## Endpoints

### Auth miembro — app Flutter
```
POST /api/auth/login
Body: { gym_code, rut, password }
Response: { token, user: { id, full_name, rut, gym_code, gym_name, points, streak, level, rank_position } }
```

### Auth admin — panel Next.js
```
POST /api/admin/login
Body: { email, password }
Response: { token, gym: { code, name, owner_name, plan } }
```

### Perfil miembro (requiere JWT miembro)
```
GET /api/me
Response: { id, full_name, rut, gym_code, gym_name, points, streak, level, rank_position }
```

### Miembros (requiere JWT admin)
```
GET  /api/members?search=&active=
Response: [{ id, full_name, rut, level, points, streak, last_workout, active, phone, subscription }]

POST /api/members
Body: { full_name, rut, password, phone?, email?, subscription_price?, payment_due_day? }
Response: { id, ...member }

PATCH /api/members/:id
Body: { active? }
Response: { ok: true }
```

### Rutinas (JWT miembro → GET, JWT admin → todo)
```
GET    /api/routines            → lista rutinas del gym con ejercicios
POST   /api/routines            → crear rutina
PUT    /api/routines/:id        → editar rutina
DELETE /api/routines/:id        → eliminar rutina
```

### Workouts (JWT miembro)
```
POST /api/workouts
Body: { routine_id, duration_minutes }
Response: { points_earned, new_total_points, new_streak, new_level }
Lógica: suma puntos (10 base + bonus racha), actualiza streak, recalcula nivel, actualiza last_workout
```

### Ranking (JWT miembro o admin)
```
GET /api/ranking
Response: [{ rank, full_name, points, streak, level }]  — top 50 del gym
```

### Dashboard (JWT admin)
```
GET /api/dashboard
Response: {
  active_members, workouts_today, avg_streak,
  at_risk_count,          -- sin entrenar 7+ días
  overdue_payments,
  due_soon_payments,
  workouts_per_day,       -- últimos 7 días
  top_members,            -- top 5 por puntos
  recent_activity,        -- últimos 5 workouts
  at_risk_members         -- lista miembros sin entrenar 7+ días
}
```

### Suscripciones / cobros (JWT admin)
```
GET /api/subscriptions
Response: [{ member_id, full_name, rut, phone, price, due_day, last_payment_date, status, days_overdue }]

PATCH /api/subscriptions/:memberId
Body: { last_payment_date: "YYYY-MM-DD" }   ← marcar como pagado
Response: { ok: true, new_status: "paid" }
```

## Lógica de Puntos y Niveles

```
Puntos por entreno = 10 + (streak_actual * 2)   → máx 50 pts por sesión
Racha: +1 si entrenó ayer o hoy, reset a 1 si lleva 2+ días sin entrenar

Niveles:
  1-3:   Principiante  (0-299 pts)
  4-6:   Intermedio    (300-999 pts)
  7-9:   Avanzado      (1000-2999 pts)
  10+:   Élite         (3000+ pts)
```

## Cron — Actualización de estados de suscripción

Ejecuta diariamente a las 08:00 (hora Chile, UTC-3). Para cada suscripción:
- Si `last_payment_date` es del mes actual → `status = 'paid'`
- Si `due_day` ya pasó este mes y no pagó → `status = 'overdue'`
- Si `due_day` vence en ≤ 3 días → `status = 'due_soon'`
- Si no → `status = 'pending'`

## Variables de entorno

```
DATABASE_URL    ← Railway provee automáticamente al linkear PostgreSQL
JWT_SECRET      ← string aleatorio, ej: openssl rand -hex 32
PORT            ← Railway provee automáticamente (default 3000)
```

## Autenticación

- Tokens JWT con expiración 30 días
- Middleware `auth.js` verifica token de miembro y adjunta `req.member`
- Middleware `adminAuth.js` verifica token de admin y adjunta `req.gym`
- Gymcode en cada query: admin solo ve datos de su gym, miembro solo ve su gym

## Seed de demo

`seed.sql` crea:
- Gym `GYM01` — PowerGym Santiago, admin: `admin@powergym.cl` / `admin123`
- 10 miembros con distintos puntos, rachas y estados de pago
- 4 rutinas con ejercicios
- Workouts de las últimas 2 semanas
