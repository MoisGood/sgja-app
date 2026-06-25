-- Diagnóstico: ¿existe el admin en usuarios con uid correcto?
SELECT id, uid, email, rol, activo FROM usuarios WHERE rol = 'ADMIN';

-- Probar es_admin() con el usuario actual
SELECT public.es_admin() as es_admin;

-- Ver auth.uid() actual
SELECT auth.uid()::text as auth_uid;
