-- Campañas de email por segmento
create table campanas (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references barberias(id) on delete cascade,
  titulo text not null,
  asunto text not null,
  mensaje_html text not null,
  segmento text not null default 'todos' check (segmento in ('todos','nuevo','frecuente','inactivo')),
  estado text not null default 'borrador' check (estado in ('borrador','enviando','enviada','error')),
  enviados integer not null default 0,
  enviada_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_campanas_barberia on campanas(barberia_id);

-- Suscripciones (plan mensual con Flow)
create table suscripciones (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references barberias(id) on delete cascade,
  cliente_id uuid references users(id) on delete set null,
  cliente_email text not null,
  cliente_nombre text,
  plan text not null default 'mensual' check (plan in ('mensual','anual')),
  precio integer not null,
  estado text not null default 'activa' check (estado in ('activa','cancelada','vencida','pendiente')),
  flow_subscription_id text,
  inicio_at timestamptz not null default now(),
  vence_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_suscripciones_barberia on suscripciones(barberia_id);
create index idx_suscripciones_cliente on suscripciones(cliente_id);

-- RLS campanas (sólo admin de la barbería)
alter table campanas enable row level security;
create policy "admin_campanas" on campanas
  using (
    barberia_id in (
      select barberia_id from users where id = auth.uid() and rol in ('admin','superadmin')
    )
  );

-- RLS suscripciones
alter table suscripciones enable row level security;
create policy "admin_suscripciones" on suscripciones
  using (
    barberia_id in (
      select barberia_id from users where id = auth.uid() and rol in ('admin','superadmin')
    )
  );
create policy "cliente_suscripciones" on suscripciones
  for select using (cliente_id = auth.uid());
