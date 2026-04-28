-- Descuento estructurado en alianzas
alter table alianzas add column if not exists descuento_pct integer check (descuento_pct between 1 and 100);
alter table alianzas add column if not exists dias_semana integer[]; -- null=todos, 0=dom..6=sáb
alter table alianzas add column if not exists servicio_ids uuid[];    -- null=todos los servicios
alter table alianzas add column if not exists requiere_codigo boolean not null default false;
alter table alianzas add column if not exists codigo_acceso text;
-- Quitar logo_url que no se usa
alter table alianzas drop column if exists logo_url;
