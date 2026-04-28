-- Descuentos cargados masivamente por el admin a segmentos de clientes
create table if not exists descuentos_masivos (
  id              uuid primary key default gen_random_uuid(),
  barberia_id     uuid not null references barberias(id) on delete cascade,
  cliente_id      uuid not null references auth.users(id) on delete cascade,
  descuento_pct   integer not null check (descuento_pct between 1 and 100),
  motivo          text not null default 'campaña',   -- etiqueta libre del admin
  canjeado        boolean not null default false,
  reserva_canje_id uuid references reservas(id),
  created_at      timestamptz not null default now()
);

alter table descuentos_masivos enable row level security;

create policy "admin_gestiona_descuentos_masivos" on descuentos_masivos
  for all using (
    exists (select 1 from users where id = auth.uid() and rol in ('admin','superadmin'))
  );

create policy "cliente_lee_sus_descuentos" on descuentos_masivos
  for select using (cliente_id = auth.uid());
