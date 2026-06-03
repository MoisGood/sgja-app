# 🔍 DIAGNÓSTICO DE CONEXIÓN A SUPABASE

## ✅ ESTADO ACTUAL

### Conexión: ✅ FUNCIONA
- Supabase URL: Accesible
- Anon Key: Configurada correctamente
- Tabla `establecimientos`: ✅ 3 registros activos

### Aplicación: ✅ FUNCIONA
- Login renderiza correctamente
- Conexión a Supabase: ✅ OK (error 400 es esperado sin usuarios)
- Email/Password: Detecta incorrectos (como debe ser)

---

## ❌ PROBLEMA ENCONTRADO

**Error en tabla `usuarios`:**
```
❌ infinite recursion detected in policy for relation "usuarios"
```

**Causa:**
Las RLS (Row Level Security) policies están mal configuradas y crean un bucle infinito.

**Efecto:**
- No se pueden leer usuarios
- No se pueden crear usuarios
- Login falla

---

## ✅ SOLUCIÓN (2 PASOS)

### PASO 1: Ejecutar SQL de Limpieza

1. Ve a: https://app.supabase.com/
2. Tu proyecto → SQL Editor → New query
3. **Copia y pega TODO esto:**

```sql
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_read_own_record" ON usuarios;
DROP POLICY IF EXISTS "Los usuarios pueden leer su propio registro" ON usuarios;
DROP POLICY IF EXISTS "Los ADMIN pueden leer todos" ON usuarios;
DROP POLICY IF EXISTS "Los INSPECTOR ven usuarios del establecimiento" ON usuarios;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON usuarios;
DROP POLICY IF EXISTS "public_read_access" ON usuarios;
DROP POLICY IF EXISTS "admin_access" ON usuarios;
DROP POLICY IF EXISTS "inspector_access" ON usuarios;

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_access"
  ON usuarios FOR SELECT
  USING (true);

CREATE POLICY "users_update_own_data"
  ON usuarios FOR UPDATE
  USING (uid = auth.uid())
  WITH CHECK (uid = auth.uid());

CREATE POLICY "system_insert_on_auth"
  ON usuarios FOR INSERT
  WITH CHECK (true);

SELECT '✅ RLS POLICIES ARREGLADAS' as resultado;
```

4. **Haz clic en RUN**
5. Deberías ver: `✅ RLS POLICIES ARREGLADAS`

---

### PASO 2: Verificar que Funcionó

Ejecuta en la terminal:

```bash
node verify-supabase.mjs
```

**Resultado esperado:**
```
✅ Cliente Supabase creado correctamente
✅ Tabla usuarios accesible
   Total de usuarios: 0
✅ Tabla establecimientos accesible
   Total de establecimientos: 3
✅ CONEXIÓN A SUPABASE: OK
```

---

## 🚀 AHORA SÍ: PRUEBA EL REGISTRO

1. Abre http://localhost:5173/
2. Haz clic en **"¿No tienes cuenta? Regístrate"**
3. Llena:
   - Email: `admin@test.com`
   - Contraseña: `Admin1234!`
4. Haz clic en **"Registrarse"**

**Si todo funciona:**
- ✅ Se abre ventana de confirmación de email
- ✅ El usuario se crea en `auth.users` (Supabase Auth)
- ✅ Automáticamente se crea en tabla `usuarios` (por el trigger)

---

## 🔐 ACTIVA EL USUARIO COMO ADMIN

En Supabase SQL Editor:

```sql
UPDATE usuarios 
SET activo = true, rol = 'ADMIN'
WHERE email = 'admin@test.com';
```

---

## 🔑 PRUEBA LOGIN

1. Abre http://localhost:5173/
2. Haz clic en **"¿Ya tienes cuenta? Inicia sesión"**
3. Ingresa:
   - Email: `admin@test.com`
   - Contraseña: `Admin1234!`
4. **"Iniciar sesión"**

✅ **Deberías ver el Dashboard de Admin**

---

## 📁 ARCHIVOS IMPORTANTES

Ahora tienes en tu proyecto:

- **FIX_RLS_POLICIES.sql** - SQL para arreglar las policies
- **verify-supabase.mjs** - Script de verificación
- **SQL_SETUP_MINIMO.sql** - SQL mínimo para setup (limpio)
- **SETUP_SUPABASE_RAPIDO.md** - Guía completa con explicaciones

---

## 🚨 SI ALGO FALLA DESPUÉS

### Error: "infinite recursion" todavía
- El SQL NO se ejecutó completamente
- Vuelve a ejecutar FIX_RLS_POLICIES.sql completo

### Error: "User not found" al login
- El usuario NO está activo
- Ejecuta: `UPDATE usuarios SET activo = true WHERE email = 'admin@test.com';`

### Error: "invalid_credentials"
- El email o contraseña son incorrectos
- O el usuario no está registrado en `auth.users`

---

**¿Listo? Comienza con el PASO 1** ⬆️
