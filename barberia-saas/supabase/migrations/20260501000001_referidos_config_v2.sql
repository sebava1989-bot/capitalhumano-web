-- Nuevas columnas de configuración de campaña de referidos
ALTER TABLE barberias
  ADD COLUMN IF NOT EXISTS referido_activo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS referido_descuento_referido_pct integer NOT NULL DEFAULT 10
    CHECK (referido_descuento_referido_pct BETWEEN 1 AND 100),
  ADD COLUMN IF NOT EXISTS referidor_premio_pct integer NOT NULL DEFAULT 10
    CHECK (referidor_premio_pct BETWEEN 1 AND 100),
  ADD COLUMN IF NOT EXISTS referido_acumulable boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS referido_max_pct_por_servicio integer NOT NULL DEFAULT 50
    CHECK (referido_max_pct_por_servicio BETWEEN 1 AND 100);

-- Permitir que el admin inserte premios de referido (antes solo podía leer)
CREATE POLICY IF NOT EXISTS "admin_inserta_premios" ON referido_premios
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND rol IN ('admin', 'superadmin')
    )
  );
