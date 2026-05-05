-- Premios de referido requieren confirmación del cliente (feedback tras el servicio)
-- DEFAULT true para no romper premios existentes; los nuevos se crean con confirmado = false
ALTER TABLE referido_premios
  ADD COLUMN IF NOT EXISTS confirmado boolean NOT NULL DEFAULT true;
