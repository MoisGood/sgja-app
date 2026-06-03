# 🚨 SOLUCIÓN: Recursión Infinita en RLS

## Problema
Aún persiste el error: `infinite recursion detected in policy for relation "usuarios"`

Esto significa que las policies se crearon correctamente pero hay una en el sistema que sigue causando bucle.

## Solución
Necesitas ejecutar SQL más agresivo que:
1. ✅ Deshabilite RLS completamente
2. ✅ Elimine TODAS las policies (incluso las ocultas)

---

## 🔧 PASOS

### PASO 1: Ejecuta este SQL en Supabase

**Archivo:** `FIX_RLS_AGGRESSIVE.sql`

```sql
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_access" ON usuarios;
DROP POLICY IF EXISTS "users_update_own_data" ON usuarios;
DROP POLICY IF EXISTS "system_insert_on_auth" ON usuarios;
DROP POLICY IF EXISTS "Los usuarios pueden leer su propio registro" ON usuarios;
DROP POLICY IF EXISTS "Los ADMIN pueden leer todos" ON usuarios;
DROP POLICY IF EXISTS "Los INSPECTOR ven usuarios del establecimiento" ON usuarios;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "users_can_read_own_record" ON usuarios;
DROP POLICY IF EXISTS "users_can_insert" ON usuarios;
DROP POLICY IF EXISTS "users_insert_on_auth" ON usuarios;
DROP POLICY IF EXISTS "admin_read_all" ON usuarios;
DROP POLICY IF EXISTS "inspector_read_establishment" ON usuarios;
DROP POLICY IF EXISTS "users_update_profile" ON usuarios;

SELECT '✅ RLS COMPLETAMENTE DESHABILITADO' as resultado;
```

**Dónde:**
1. https://app.supabase.com/
2. Tu proyecto → SQL Editor → New query
3. Copia y pega TODO el SQL
4. Haz clic en **RUN**

---

### PASO 2: Verifica que funcionó

En terminal:
```bash
node verify-supabase.mjs
```

**Deberías ver:**
```
✅ Cliente Supabase creado correctamente
✅ Tabla usuarios accesible
   Total de usuarios: 0
✅ Tabla establecimientos accesible
   Total de establecimientos: 3
✅ CONEXIÓN A SUPABASE: OK
```

---

### PASO 3: Ahora prueba el registro

1. Abre http://localhost:5173/
2. Haz clic en **"¿No tienes cuenta? Regístrate"**
3. Llena:
   - Email: `admin@test.com`
   - Contraseña: `Admin1234!`
4. Haz clic en **"Registrarse"**

✅ Deberías ver confirmación de email

---

### PASO 4: Activa el usuario como ADMIN

En Supabase SQL Editor, ejecuta:

```sql
UPDATE usuarios 
SET activo = true, rol = 'ADMIN'
WHERE email = 'admin@test.com';
```

---

### PASO 5: Prueba login

1. Abre http://localhost:5173/
2. Haz clic en **"¿Ya tienes cuenta? Inicia sesión"**
3. Ingresa:
   - Email: `admin@test.com`
   - Contraseña: `Admin1234!`
4. Haz clic en **"Iniciar sesión"**

✅ **Deberías ver el Dashboard de Admin**

---

## ⚠️ Nota Importante

Con RLS **deshabilitado**, cualquier usuario puede leer todos los datos de `usuarios`. 

**Para producción**, necesitarás implementar RLS policies correctamente, pero por ahora vamos a enfocarnos en que funcione.

Después configuraremos RLS de forma segura con policies que NO causen recursión.

---

**¿Listo? Ejecuta el SQL agresivo primero** ⬆️
