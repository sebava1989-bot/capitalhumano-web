-- Trigger: auto-create users row when auth.users gets a new entry
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_barberia_id uuid;
  v_nombre text;
  v_slug text;
begin
  v_nombre := coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1));
  v_slug   := new.raw_user_meta_data->>'barberia_slug';

  if v_slug is not null then
    select id into v_barberia_id from barberias where slug = v_slug and activo = true;
  end if;

  insert into users (id, barberia_id, rol, nombre)
  values (new.id, v_barberia_id, 'cliente', v_nombre)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
