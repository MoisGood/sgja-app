# FASE 2: AUTENTICACIÓN - GUÍA PASO A PASO

**Objetivo**: Configurar Supabase Auth, crear usuario de prueba y verificar que el trigger funciona.

---

## PASO 1: CONFIGURAR EMAIL/PASSWORD EN SUPABASE DASHBOARD

### 1.1 Ir a Authentication → Providers

```
1. Abre Supabase Dashboard
2. Selecciona tu proyecto (SGJA-Production)
3. En left sidebar → Busca "Authentication"
4. Click en "Providers"
```

**Pantalla esperada:**
```
┌─────────────────────────────────────┐
│ Authentication                      │
├─────────────────────────────────────┤
│ Users                               │
│ Providers  ← AQUÍ ESTAMOS           │
│ Policies                            │
│ Webhooks                            │
└─────────────────────────────────────┘
```

### 1.2 Activar Email Provider

```
1. Busca "Email" en la lista de providers
2. Verifica que dice "ENABLED" (verde)
   ↳ Si dice "DISABLED", click en toggle para activar

3. Scroll down en la misma sección Email:
```

**Configuración recomendada:**
```
[ ] Confirm email (desmarcar - para testing)
[x] Auto confirm users (marcar)
[ ] Disable Signup (dejar desmarcado)
```

**Guarda los cambios:**
```
Icon de guardado (disco) arriba derecha
```

---

## PASO 2: CREAR USUARIO DE PRUEBA

### 2.1 Ir a Users → Create User

```
1. En Authentication → Users (tab izquierda)
2. Click botón verde "Create User" (esquina arriba derecha)
```

### 2.2 Llenar formulario

```
┌──────────────────────────────────────┐
│ Create a new user                    │
├──────────────────────────────────────┤
│ Email:        | profesor1@test.com   │
│ Password:     | [generada random]    │
│ Confirm Pass: | [generada random]    │
│ [] Auto generate password            │
│ [] Send invite?                      │
└──────────────────────────────────────┘
```

**Llena:**
- **Email**: `profesor1@test.com`
- **Password**: Déjalo como generado o escribe: `Test123!@#`
- **Auto confirm**: Debe estar activado del paso anterior

**Botón:** "Save user" (verde)

**Resultado esperado:**
```
✅ Usuario creado exitosamente
Verás en la lista:
| profesor1@test.com | INVITED | ... |
```

---

## PASO 3: VERIFICAR QUE EL TRIGGER FUNCIONÓ

### 3.1 Ir a SQL Editor

```
1. En Supabase Dashboard (left sidebar)
2. Busca "SQL Editor"
3. Click en "SQL Editor" o "Queries"
```

### 3.2 Ejecutar query para verificar

```sql
-- Verificar que el usuario de prueba aparece en tabla usuarios
SELECT id, uid, email, nombre_completo, rol, creado_en 
FROM public.usuarios 
WHERE email = 'profesor1@test.com';
```

**Pasos:**
```
1. Copy/paste la query anterior
2. Click botón "Execute" (▶️ azul)
3. Mira resultado en tab "Results"
```

**Resultado esperado:**

```
┌─────────────────────────────────────────────────────┐
│ id | uid | email | nombre_completo | rol | creado_en │
├─────────────────────────────────────────────────────┤
│ [uuid] | [UUID] | profesor1@... | profesor1@... | PROFESOR | [datetime] │
└─────────────────────────────────────────────────────┘
```

✅ **Si ves una fila**: El trigger funcionó correctamente
❌ **Si está vacío**: El trigger no se ejecutó, revisar logs

---

## PASO 4: VERIFICAR CAMPOS CREADOS CORRECTAMENTE

### 4.1 Revisar que todos los campos están presentes

```sql
-- Expandir la fila anterior o ejecutar esto:
SELECT * FROM public.usuarios 
WHERE email = 'profesor1@test.com';
```

**Campos que debe tener:**
```
✓ id (UUID generado automático)
✓ uid (ID de Firebase/Supabase Auth)
✓ email (profesor1@test.com)
✓ nombre_completo (profesor1@test.com - copia del email por defecto)
✓ rol (PROFESOR - por defecto en trigger)
✓ id_establecimiento (NULL - aún sin asignar)
✓ activo (true)
✓ creado_en (timestamp actual)
✓ actualizado_en (timestamp actual)
```

---

## PASO 5: CREAR USUARIO CON ESTABLECIMIENTO ESPECÍFICO

### 5.1 Para usuarios más realistas

Primero, necesitamos verificar que exista un establecimiento:

```sql
-- Ver establecimientos disponibles
SELECT id, nombre, codigo 
FROM public.establecimientos;
```

**Si la tabla está vacía**, crear uno:

```sql
INSERT INTO public.establecimientos (nombre, codigo, region)
VALUES ('Liceo Municipal Test', 'LIC-001', 'Metropolitana')
RETURNING id, nombre, codigo;
```

**Guarda el ID devuelto** (ej: `a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6`)

### 5.2 Crear usuario asociado a establecimiento

```sql
-- Crear usuario con establecimiento
INSERT INTO public.usuarios (uid, email, nombre_completo, rol, id_establecimiento, activo)
VALUES (
  'b917b6c8-756a-4b85-8dcc-b951e779b951',  -- UID único (puede ser cualquier string único)
  'inspector@test.com',
  'Inspector Test',
  'INSPECTOR',
  '18f3ec96-f15f-4787-a3ac-3c10f1cee55f',
  true  -- REEMPLAZA CON EL ID DE ARRIBA
);
```

**Resultado:**
```
✅ 1 row inserted
```

---

## PASO 6: PROBAR RLS POLICIES

### 6.1 Verificar que RLS está activado

```sql
-- Ver si RLS está habilitado en tabla usuarios
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'usuarios';
```

**Resultado esperado:**
```
| schemaname | tablename | rowsecurity |
|------------|-----------|-------------|
| public     | usuarios  | true        |
```

✅ `true` = RLS activo
❌ `false` = RLS no habilitado (problema)

### 6.2 Probar policy de "solo ven datos del mismo establecimiento"

```sql
-- Como si fueras profesor1@test.com
-- (en la siguiente sección te muestro cómo hacer esto en código)
```

---

## PASO 7: ACTUALIZAR .env CON CREDENCIALES SUPABASE

Ahora que Auth está confirmado, actualizar variables de entorno en el proyecto.

### 7.1 Obtener credenciales de Supabase

```
1. En Supabase Dashboard
2. Click en proyecto (esquina arriba izquierda)
3. Luego "Project Settings"
4. Tab "API"
5. Copia:
   - URL (Project URL) https://iyxubvtfhcmlivivdfpt.supabase.co
   - anon public (Anon key) sb_publishable_XkxWTTJrOAq0rNXbTLL0ew_4g-HcMBt
    - service_role (Service Role Key - SECRETA, no compartir) [ROTADA - obtener nueva del dashboard]

### 7.2 Actualizar archivo `.env.local`

En tu proyecto (raíz):

```bash
# .env.local (CREAR SI NO EXISTE)

# Supabase
REACT_APP_SUPABASE_URL=https://[proyecto].supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...

# Firebase (mantener por ahora como backup)
REACT_APP_FIREBASE_API_KEY=...
```

⚠️ **IMPORTANTE**: 
- No compartir `REACT_APP_SUPABASE_ANON_KEY` en Git
- Archivo `.env.local` va en `.gitignore`

---

## ✅ CHECKLIST FASE 2 COMPLETADA

```
[x] Configurar Email Provider en Supabase
[x] Crear usuario de prueba (profesor1@test.com)
[x] Ejecutar SQL query para verificar trigger
[x] Verificar que usuario aparece en tabla usuarios
[x] Crear usuario con establecimiento
[x] Verificar RLS está activado
[x] Obtener y guardar credenciales en .env.local
```

---

## 🚨 TROUBLESHOOTING

### Problema: Usuario no aparece en tabla usuarios

**Causas posibles:**
1. Trigger no se ejecutó → Ver logs
2. RLS policy bloqueó insersión → Revisar políticas
3. Foreign key constraint → Falta establecimiento

**Solución:**
```sql
-- Ver logs de ejecución del trigger
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10;

-- O ver errores directos
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### Problema: No puedo crear usuario porque "Email ya existe"

**Causa:** Duplicado en auth.users

**Solución:**
```sql
-- Cambiar a email único
prof.test.2@test.com
prof.test.3@test.com
-- etc.
```

### Problema: Error "violates check constraint"

**Causa:** Rol inválido

**Solución:**
```
Roles válidos: ADMIN, INSPECTOR, PROFESOR, ESTUDIANTE, APODERADOR
```

---

## SIGUIENTE PASO

Una vez verificado que todo funciona:

### ✅ FASE 2 COMPLETADA
### ⏳ FASE 3: MIGRACIÓN DE DATOS

**¿Listo?** Confirma cuando hayas completado estos 7 pasos.

