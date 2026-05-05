ALTER TABLE alianzas
  ADD COLUMN IF NOT EXISTS excluye_otros_descuentos boolean NOT NULL DEFAULT false;
