-- Columna para descuento al nuevo cliente referido en su primer corte
ALTER TABLE barberias
  ADD COLUMN IF NOT EXISTS referido_descuento_nuevo_cliente_pct integer NOT NULL DEFAULT 0;
