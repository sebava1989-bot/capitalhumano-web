create table alianzas (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references barberias(id) on delete cascade,
  nombre text not null,
  descripcion text,
  logo_url text,
  tipo text not null default 'partner' check (tipo in ('partner','proveedor','institucional')),
  beneficio text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_alianzas_barberia on alianzas(barberia_id);

alter table alianzas enable row level security;

-- Lectura pública para mostrar en landing
create policy "alianzas_public_read" on alianzas
  for select using (activo = true);

-- Admin puede gestionar
create policy "alianzas_admin_write" on alianzas
  using (
    barberia_id in (
      select barberia_id from users where id = auth.uid() and rol in ('admin','superadmin')
    )
  );
