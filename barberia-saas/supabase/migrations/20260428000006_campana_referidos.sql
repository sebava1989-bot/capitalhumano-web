-- Configuración de la campaña de referidos por barbería
alter table barberias add column if not exists referido_descuento_pct integer default 10
  check (referido_descuento_pct between 1 and 100);

-- Descuentos pendientes de canjear por el referidor (se aplican en su próxima reserva)
create table if not exists referido_premios (
  id          uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references barberias(id) on delete cascade,
  referidor_id uuid not null references auth.users(id) on delete cascade,
  referido_id  uuid not null references auth.users(id) on delete cascade,
  descuento_pct integer not null,
  canjeado    boolean not null default false,
  reserva_canje_id uuid references reservas(id),
  created_at  timestamptz not null default now()
);

alter table referido_premios enable row level security;

create policy "admin_lee_premios" on referido_premios
  for select using (
    exists (select 1 from users where id = auth.uid() and rol in ('admin','superadmin'))
  );

create policy "cliente_lee_sus_premios" on referido_premios
  for select using (referidor_id = auth.uid());
