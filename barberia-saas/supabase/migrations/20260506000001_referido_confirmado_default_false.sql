-- Corrige el default de confirmado a false
-- Los premios deben requerir calificación del cliente para activarse
ALTER TABLE referido_premios ALTER COLUMN confirmado SET DEFAULT false;
