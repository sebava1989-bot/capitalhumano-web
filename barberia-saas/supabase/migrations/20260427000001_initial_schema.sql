-- Extensiones
create extension if not exists "pgcrypto";

-- Tabla central de tenants
create table barberias (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  logo_url text,
  colores jsonb default '{"primary":"#e8c84a","background":"#111111"}'::jsonb,
  configuracion jsonb default '{}'::jsonb,
  plan_saas text not null default 'basico' check (plan_saas in ('basico','pro')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Extensión de auth.users
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  barberia_id uuid references barberias(id) on delete cascade,
  rol text not null default 'cliente' check (rol in ('superadmin','admin','barbero','cliente')),
  nombre text not null default '',
  telefono text,
  referral_code text unique,
  referral_by uuid references users(id),
  fcm_token text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Barberos
create table barberos (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references barberias(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  nombre text not null,
  foto_url text,
  horarios jsonb not null default '{
    "lunes":    {"activo": true,  "inicio": "09:00", "fin": "18:00"},
    "martes":   {"activo": true,  "inicio": "09:00", "fin": "18:00"},
    "miercoles":{"activo": true,  "inicio": "09:00", "fin": "18:00"},
    "jueves":   {"activo": true,  "inicio": "09:00", "fin": "18:00"},
    "viernes":  {"activo": true,  "inicio": "09:00", "fin": "18:00"},
    "sabado":   {"activo": true,  "inicio": "09:00", "fin": "14:00"},
    "domingo":  {"activo": false, "inicio": "09:00", "fin": "13:00"}
  }'::jsonb,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Servicios
create table servicios (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references barberias(id) on delete cascade,
  nombre text not null,
  descripcion text,
  duracion_min integer not null default 30,
  precio integer not null,
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

-- Disponibilidad (slots por barbero/fecha)
create table disponibilidad (
  id uuid primary key default gen_random_uuid(),
  barbero_id uuid not null references barberos(id) on delete cascade,
  barberia_id uuid not null references barberias(id) on delete cascade,
  fecha date not null,
  slots jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique(barbero_id, fecha)
);

-- Reservas
create table reservas (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references barberias(id) on delete cascade,
  cliente_id uuid references users(id) on delete set null,
  barbero_id uuid not null references barberos(id) on delete restrict,
  servicio_id uuid not null references servicios(id) on delete restrict,
  fecha_hora timestamptz not null,
  estado text not null default 'confirmada'
    check (estado in ('pendiente','confirmada','completada','cancelada','no_show')),
  precio integer not null,
  descuento integer not null default 0,
  precio_final integer not null,
  notas text,
  cliente_email text,
  cliente_nombre text,
  origen text not null default 'web' check (origen in ('web','admin','suscripcion')),
  created_at timestamptz not null default now()
);

-- Notificaciones
create table notificaciones (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references barberias(id) on delete cascade,
  usuario_id uuid references users(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensaje text not null,
  leida boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Índices críticos
create index idx_reservas_barberia_fecha on reservas(barberia_id, fecha_hora);
create index idx_reservas_cliente on reservas(cliente_id);
create index idx_reservas_barbero_fecha on reservas(barbero_id, fecha_hora);
create index idx_disponibilidad_barbero_fecha on disponibilidad(barbero_id, fecha);
create index idx_users_barberia on users(barberia_id);
create index idx_users_referral_code on users(referral_code);
