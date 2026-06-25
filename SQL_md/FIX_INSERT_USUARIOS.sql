-- Permitir INSERT a cualquier usuario autenticado (para flujo de registro)
DROP POLICY IF EXISTS "usuarios_insert_admin" ON usuarios;
CREATE POLICY "usuarios_insert_authenticated" ON usuarios
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- También solicitudes_registro (para que el flujo de registro funcione)
DROP POLICY IF EXISTS "solicitudes_registro_admin_insert" ON solicitudes_registro;
CREATE POLICY "solicitudes_registro_insert_authenticated" ON solicitudes_registro
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
