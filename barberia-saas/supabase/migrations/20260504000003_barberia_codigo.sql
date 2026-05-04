ALTER TABLE barberias
  ADD COLUMN IF NOT EXISTS codigo text;

UPDATE barberias
  SET codigo = upper(substr(replace(id::text, '-', ''), 1, 8))
  WHERE codigo IS NULL OR codigo = '';

ALTER TABLE barberias
  ALTER COLUMN codigo SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS barberias_codigo_unique ON barberias(codigo);
