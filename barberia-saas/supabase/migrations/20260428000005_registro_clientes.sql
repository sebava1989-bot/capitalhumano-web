-- Datos de registro del cliente
alter table users add column if not exists telefono text;

-- Asignación manual admin → cliente → alianza (bypass de código)
create table if not exists alianza_clientes (
  alianza_id  uuid not null references alianzas(id) on delete cascade,
  cliente_id  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (alianza_id, cliente_id)
);

alter table alianza_clientes enable row level security;

-- Admin puede ver y gestionar asignaciones
create policy "admin_gestiona_alianza_clientes" on alianza_clientes
  for all using (
    exists (select 1 from users where id = auth.uid() and rol in ('admin', 'superadmin'))
  );
