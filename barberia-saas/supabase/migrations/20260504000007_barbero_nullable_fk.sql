-- Make reservas.barbero_id nullable so we can null it out before deleting a barbero
ALTER TABLE reservas ALTER COLUMN barbero_id DROP NOT NULL;
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_barbero_id_fkey;
ALTER TABLE reservas ADD CONSTRAINT reservas_barbero_id_fkey
  FOREIGN KEY (barbero_id) REFERENCES barberos(id) ON DELETE SET NULL;
