-- Solo ejecutar en desarrollo
insert into barberias (id, slug, nombre, colores, configuracion) values (
  '00000000-0000-0000-0000-000000000001',
  'barberia-demo',
  'Barbería Demo',
  '{"primary":"#e8c84a","background":"#111111"}'::jsonb,
  '{"horarios":{"apertura":"09:00","cierre":"19:00"},"proveedor_pago":"flow"}'::jsonb
) on conflict (id) do nothing;

insert into servicios (barberia_id, nombre, duracion_min, precio, orden) values
  ('00000000-0000-0000-0000-000000000001', 'Corte clásico', 30, 8000, 1),
  ('00000000-0000-0000-0000-000000000001', 'Pack Barba', 45, 12000, 2),
  ('00000000-0000-0000-0000-000000000001', 'Corte + Barba', 60, 18000, 3)
on conflict do nothing;

insert into barberos (barberia_id, nombre) values
  ('00000000-0000-0000-0000-000000000001', 'Carlos'),
  ('00000000-0000-0000-0000-000000000001', 'Diego')
on conflict do nothing;
