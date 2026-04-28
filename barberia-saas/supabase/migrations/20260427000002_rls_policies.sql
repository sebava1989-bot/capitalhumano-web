-- Habilitar RLS en todas las tablas
alter table barberias enable row level security;
alter table users enable row level security;
alter table barberos enable row level security;
alter table servicios enable row level security;
alter table disponibilidad enable row level security;
alter table reservas enable row level security;
alter table notificaciones enable row level security;

-- Helper: obtener barberia_id del usuario actual
create or replace function get_my_barberia_id()
returns uuid language sql stable security definer as $$
  select barberia_id from users where id = auth.uid()
$$;

-- Helper: obtener rol del usuario actual
create or replace function get_my_rol()
returns text language sql stable security definer as $$
  select rol from users where id = auth.uid()
$$;

-- barberias: solo lectura pública por slug, escritura solo superadmin/admin
create policy "barberias_select" on barberias for select using (activo = true);
create policy "barberias_update_admin" on barberias for update
  using (get_my_rol() = 'superadmin' or (get_my_rol() = 'admin' and id = get_my_barberia_id()));

-- users: cada uno ve sus propios datos + admin ve su barbería
create policy "users_select_own" on users for select
  using (id = auth.uid() or barberia_id = get_my_barberia_id());
create policy "users_insert_self" on users for insert with check (id = auth.uid());
create policy "users_update_own" on users for update using (id = auth.uid());

-- barberos: lectura pública (necesario para el formulario de booking)
create policy "barberos_select" on barberos for select using (activo = true);
create policy "barberos_write_admin" on barberos for all
  using (get_my_rol() in ('admin','superadmin') and barberia_id = get_my_barberia_id());

-- servicios: lectura pública por barbería, escritura admin
create policy "servicios_select" on servicios for select using (activo = true);
create policy "servicios_write_admin" on servicios for all
  using (get_my_rol() in ('admin','superadmin') and barberia_id = get_my_barberia_id());

-- disponibilidad: lectura pública (para el booking), escritura admin/barbero
create policy "disponibilidad_select" on disponibilidad for select using (true);
create policy "disponibilidad_write" on disponibilidad for all
  using (get_my_rol() in ('admin','barbero','superadmin'));

-- reservas: cliente ve las suyas, barbero/admin ven su barbería
create policy "reservas_select_cliente" on reservas for select
  using (cliente_id = auth.uid() or barberia_id = get_my_barberia_id());
create policy "reservas_insert_public" on reservas for insert with check (true);
create policy "reservas_update_admin_barbero" on reservas for update
  using (get_my_rol() in ('admin','barbero','superadmin') and barberia_id = get_my_barberia_id());

-- notificaciones: cada usuario ve las suyas
create policy "notificaciones_select" on notificaciones for select
  using (usuario_id = auth.uid());
create policy "notificaciones_update" on notificaciones for update
  using (usuario_id = auth.uid());
