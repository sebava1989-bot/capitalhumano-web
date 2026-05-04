CREATE TABLE IF NOT EXISTS sugerencias (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barberia_id  uuid NOT NULL REFERENCES barberias(id) ON DELETE CASCADE,
  tipo         text NOT NULL CHECK (tipo IN ('sugerencia', 'reclamo', 'elogio')),
  mensaje      text NOT NULL CHECK (char_length(mensaje) BETWEEN 1 AND 500),
  ip_hash      text NOT NULL,
  leida        boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sugerencias_barberia_created_idx
  ON sugerencias(barberia_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sugerencias_ip_hash_idx
  ON sugerencias(ip_hash, barberia_id, created_at DESC);

ALTER TABLE sugerencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_inserta_sugerencias" ON sugerencias
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_lee_sugerencias" ON sugerencias
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND rol IN ('admin', 'superadmin')
        AND barberia_id = sugerencias.barberia_id
    )
  );

CREATE POLICY "admin_actualiza_sugerencias" ON sugerencias
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND rol IN ('admin', 'superadmin')
        AND barberia_id = sugerencias.barberia_id
    )
  );

INSERT INTO storage.buckets (id, name, public)
  VALUES ('logos', 'logos', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('barberos', 'barberos', true)
  ON CONFLICT (id) DO NOTHING;
