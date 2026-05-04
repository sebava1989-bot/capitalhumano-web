-- RLS policies para los buckets logos y barberos
-- Solo admin/superadmin de la barbería puede escribir en su carpeta

CREATE POLICY "admin_upload_logo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos'
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin', 'superadmin')
        AND u.barberia_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "admin_update_logo" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos'
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin', 'superadmin')
        AND u.barberia_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "admin_delete_logo" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos'
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin', 'superadmin')
        AND u.barberia_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "admin_upload_barbero_foto" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'barberos'
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin', 'superadmin')
        AND u.barberia_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "admin_update_barbero_foto" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'barberos'
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin', 'superadmin')
        AND u.barberia_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "admin_delete_barbero_foto" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'barberos'
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.rol IN ('admin', 'superadmin')
        AND u.barberia_id::text = (storage.foldername(name))[1]
    )
  );
