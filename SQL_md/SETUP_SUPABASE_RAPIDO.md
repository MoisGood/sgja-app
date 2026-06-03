# 🚀 CONFIGURACIÓN RÁPIDA DE SUPABASE (5 minutos)

## ⚠️ Problema Actual
- ✅ Conexión a Supabase: **OK** (error 400 es esperado)
- ❌ Usuarios registrados: **NINGUNO**
- ❌ Trigger de autenticación: **NO CONFIGURADO**

---

## 📋 PASO A PASO

### PASO 1: Abre Supabase Dashboard

1. Ve a: https://app.supabase.com/
2. Selecciona tu proyecto: **iyxubvtfhcmlivivdfpt**
3. En el menú izquierdo, busca **SQL Editor**

![SQL Editor está en el panel izquierdo, debajo de "Development"]

---

### PASO 2: Crea una Nueva Query

Dentro de SQL Editor:
1. Haz clic en **"New query"** (botón azul)
2. Se abrirá un editor en blanco

---

### PASO 3: COPIA ESTE SQL (TODO)

```sql
-- ============================================================================
-- 🔧 CONFIGURACIÓN MÍNIMA PARA QUE SUPABASE FUNCIONE CON SGJA
-- ============================================================================

-- 1️⃣ CREAR TABLA ESTABLECIMIENTOS (si no existe)
CREATE TABLE IF NOT EXISTS establecimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  region TEXT,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now()
);

-- 2️⃣ INSERTAR UN ESTABLECIMIENTO DE PRUEBA
INSERT INTO establecimientos (nombre, codigo, region, activo)
VALUES ('Liceo de Niñas de Concepción', 'LNC-001', 'Bío-Bío', true)
ON CONFLICT (codigo) DO NOTHING;

-- 3️⃣ CREAR TABLA USUARIOS (si no existe)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'PROFESOR',
  id_establecimiento UUID REFERENCES establecimientos(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT false,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT rol_valido CHECK (rol IN ('ADMIN', 'INSPECTOR', 'PROFESOR', 'ESTUDIANTE', 'APODERADO'))
);

-- 4️⃣ CREAR FUNCIÓN DE TRIGGER (cuando se registra un usuario en Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  id_establecimiento_temp UUID;
BEGIN
  -- Obtener el primer establecimiento
  SELECT id INTO id_establecimiento_temp FROM establecimientos LIMIT 1;
  
  INSERT INTO public.usuarios (uid, email, nombre_completo, rol, id_establecimiento, activo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'PROFESOR'),
    id_establecimiento_temp,
    false
  )
  ON CONFLICT (uid) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 5️⃣ CREAR TRIGGER (ejecuta la función cuando se crea un usuario en Auth)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6️⃣ HABILITAR ROW LEVEL SECURITY
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 7️⃣ CREAR POLICY: Los usuarios ven su propio registro
CREATE POLICY "users_can_read_own_record"
  ON usuarios FOR SELECT
  USING (uid = auth.uid());

-- 8️⃣ VERIFICACIÓN FINAL
SELECT '✅ SETUP COMPLETADO' as estado;
SELECT COUNT(*) as establecimientos_creados FROM establecimientos;
SELECT COUNT(*) as usuarios_totales FROM usuarios;
```

---

### PASO 4: EJECUTA EL SQL

1. **Selecciona TODO el texto** (Ctrl+A)
2. Haz clic en el botón **"RUN"** (triángulo azul)
3. Espera a que termine (debe decir ✅ SETUP COMPLETADO)

Si ves errores como:
- `relation "usuarios" already exists` → Normal, significa que ya existe
- `trigger "on_auth_user_created" for relation "users" already exists` → Normal

---

### PASO 5: VERIFICA QUE FUNCIONÓ

En el mismo SQL Editor, ejecuta esto para verificar:

```sql
SELECT 'Establecimientos:' as test, COUNT(*) as total FROM establecimientos
UNION ALL
SELECT 'Usuarios:', COUNT(*) FROM usuarios;
```

Deberías ver:
```
Establecimientos: | 1
Usuarios:         | 0
```

---

## ✅ AHORA SÍ: PRUEBA EL REGISTRO EN LA APP

1. **Abre la app**: http://localhost:5173/
2. Haz clic en **"¿No tienes cuenta? Regístrate"**
3. Llena:
   - Email: `admin@test.com`
   - Contraseña: `Admin1234!`
4. Haz clic en **"Registrarse"**

### ¿Qué pasa?
- ✅ Se abre una ventana para **confirmar email** (normal en Supabase)
- ✅ El usuario se guarda en `auth.users` (Supabase Auth)
- ✅ Automáticamente se crea un registro en tabla `usuarios` (por el trigger)

---

## 🔐 ACTIVA TU USUARIO COMO ADMIN

Para que puedas entrar, necesita estar **activo** y tener rol **ADMIN**.

En SQL Editor, ejecuta:

```sql
UPDATE usuarios 
SET activo = true, rol = 'ADMIN'
WHERE email = 'admin@test.com';
```

---

## 🔑 AHORA PRUEBA LOGIN

1. Vuelve a http://localhost:5173/
2. Haz clic en **"¿Ya tienes cuenta? Inicia sesión"**
3. Ingresa:
   - Email: `admin@test.com`
   - Contraseña: `Admin1234!`
4. Haz clic en **"Iniciar sesión"**

✅ Deberías ver el Dashboard de Admin

---

## 🐛 SI ALGO FALLA

### Error: "Database error saving new user"
→ Significa que el trigger NO está configurado correctamente. Vuelve a ejecutar el SQL completo.

### Error: "Invalid login credentials"
→ El usuario no existe. Primero debes **registrarte**, luego **loguear**.

### Error: "User not found"
→ Ejecuta en SQL para verificar:
```sql
SELECT * FROM usuarios WHERE email = 'admin@test.com';
```

### Error: "PGRST110" (permission denied)
→ Las RLS policies están muy restrictivas. Verifica la policy de SELECT.

---

## 📱 USUARIOS DE PRUEBA

Una vez que todo funciona, puedes crear más usuarios:

```sql
-- Usuario Profesor
INSERT INTO usuarios (uid, email, nombre_completo, rol, id_establecimiento, activo)
VALUES (
  gen_random_uuid(),
  'profesor@test.com',
  'Juan Profesor',
  'PROFESOR',
  (SELECT id FROM establecimientos LIMIT 1),
  true
);

-- Usuario Estudiante
INSERT INTO usuarios (uid, email, nombre_completo, rol, id_establecimiento, activo)
VALUES (
  gen_random_uuid(),
  'estudiante@test.com',
  'María Estudiante',
  'ESTUDIANTE',
  (SELECT id FROM establecimientos LIMIT 1),
  true
);
```

**Pero primero** deben registrarse en `auth.users` desde la app (Supabase Auto-Create).

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Por qué necesito ejecutar SQL?**
R: Porque Supabase requiere configurar triggers para que Auth + Database trabajen juntos automáticamente.

**P: ¿Puedo solo usar Google?**
R: Sí, pero necesitas Email/Password para testing. Google está ya configurado.

**P: ¿Dónde veo la confirmación de email?**
R: En Supabase → Auth → Users. Verás un email sin verificar `(unverified)`.

---

**¿Listo? Comienza en el PASO 1** ⬆️
