-- Agrega estado en_curso para el flujo Comenzar → Terminar
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_estado_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_estado_check
  CHECK (estado IN ('pendiente','confirmada','en_curso','completada','cancelada','no_show'));
