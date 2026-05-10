-- Migration: estilos_corte table for AI hairstyle try-on feature

CREATE TABLE IF NOT EXISTS estilos_corte (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barberia_id         uuid REFERENCES barberias(id) ON DELETE CASCADE,
  nombre              text NOT NULL,
  descripcion         text,
  foto_referencia_url text,
  prompt_ia           text NOT NULL,
  es_predefinido      boolean NOT NULL DEFAULT false,
  orden               integer NOT NULL DEFAULT 0,
  activo              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_estilos_barberia ON estilos_corte(barberia_id);
CREATE INDEX idx_estilos_predefinido ON estilos_corte(es_predefinido) WHERE es_predefinido = true;

ALTER TABLE estilos_corte ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_lee_estilos" ON estilos_corte
  FOR SELECT USING (
    es_predefinido = true
    OR barberia_id IN (
      SELECT barberia_id FROM users WHERE id = auth.uid() AND rol IN ('admin','superadmin')
    )
  );

CREATE POLICY "admin_gestiona_estilos" ON estilos_corte
  FOR ALL USING (
    barberia_id IN (
      SELECT barberia_id FROM users WHERE id = auth.uid() AND rol IN ('admin','superadmin')
    )
  );

INSERT INTO estilos_corte (nombre, descripcion, prompt_ia, es_predefinido, orden) VALUES
('Degradé clásico', 'Transición suave en los laterales', 'Modifica solo el cabello de esta persona aplicando un degradé clásico con transición suave y gradual en los laterales. Mantén el rostro, expresión, piel, ropa y fondo exactamente iguales. Solo cambia el peinado.', true, 1),
('Fade americano', 'Contraste alto, laterales muy cortos', 'Modifica solo el cabello de esta persona aplicando un fade americano con contraste alto, laterales casi rapados y parte superior con volumen. Mantén el rostro, expresión, piel, ropa y fondo exactamente iguales. Solo cambia el peinado.', true, 2),
('Tapered', 'Laterales cortos, transición natural', 'Modifica solo el cabello de esta persona aplicando un corte tapered con laterales cortos que se integran naturalmente con la parte superior. Mantén el rostro, expresión, piel, ropa y fondo exactamente iguales. Solo cambia el peinado.', true, 3),
('Undercut', 'Laterales rapados, parte superior larga', 'Modifica solo el cabello de esta persona aplicando un undercut moderno con laterales rapados y parte superior larga peinada hacia un lado. Mantén el rostro, expresión, piel, ropa y fondo exactamente iguales. Solo cambia el peinado.', true, 4),
('Corte texturizado', 'Capas y movimiento natural', 'Modifica solo el cabello de esta persona aplicando un corte texturizado moderno con capas, movimiento y acabado natural despeinado. Mantén el rostro, expresión, piel, ropa y fondo exactamente iguales. Solo cambia el peinado.', true, 5),
('Pompadour', 'Volumen hacia arriba, laterales cortos', 'Modifica solo el cabello de esta persona aplicando un pompadour clásico con volumen peinado hacia arriba y atrás, laterales cortos. Mantén el rostro, expresión, piel, ropa y fondo exactamente iguales. Solo cambia el peinado.', true, 6),
('Buzz cut', 'Rapado uniforme muy corto', 'Modifica solo el cabello de esta persona aplicando un buzz cut rapado uniforme muy corto en toda la cabeza. Mantén el rostro, expresión, piel, ropa y fondo exactamente iguales. Solo cambia el peinado.', true, 7),
('Corte largo natural', 'Largo hasta los hombros, caída libre', 'Modifica solo el cabello de esta persona dejándolo largo hasta los hombros con caída libre y aspecto natural. Mantén el rostro, expresión, piel, ropa y fondo exactamente iguales. Solo cambia el peinado.', true, 8);
