-- Límite de usos por cliente en alianzas (null = ilimitado)
alter table alianzas add column if not exists max_usos_por_cliente integer; -- null = sin límite

-- Registro de cada uso del descuento de alianza
create table if not exists alianza_usos (
  id         uuid primary key default gen_random_uuid(),
  alianza_id uuid not null references alianzas(id) on delete cascade,
  cliente_id uuid not null references auth.users(id) on delete cascade,
  reserva_id uuid not null references reservas(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(alianza_id, reserva_id)
);

alter table alianza_usos enable row level security;

-- Admin y superadmin pueden ver los usos
create policy "admin_lee_alianza_usos" on alianza_usos
  for select using (
    exists (select 1 from users where id = auth.uid() and rol in ('admin', 'superadmin'))
  );
