# SOLUCIÓN DEFINITIVA RLS - SGJA

## Problema

Las políticas RLS (Row Level Security) de Supabase están mal configuradas debido a que se ejecutaron múltiples scripts SQL con enfoques distintos, generando políticas contradictorias y, en algunos casos, bloqueando operaciones legítimas.

## Diagnóstico

### 1. La función `es_admin()` compara contra `id` (UUID) pero los usuarios tienen `uid` (TEXT)

```sql
-- MIGRATION 012 (ROTO)
WHERE id = auth.uid()          -- auth.uid() es UUID, columna id es UUID
```

El seed SQL inserta usuarios con `id` ≠ `uid`:

```sql
INSERT INTO usuarios (id, uid, ...)
VALUES ('550e8400-...', '550e8400-...', ...)  -- id y uid son DIFERENTES
```

Cuando un usuario se loguea, `auth.uid()` devuelve su **UID de autenticación**, que es diferente del `id` de la tabla `usuarios`. Por lo tanto, `es_admin()` siempre retorna `false`.

**Fix aplicado en `FIX_RLS_COMPLETO.sql`:**

```sql
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE uid = auth.uid()::text AND rol = 'ADMIN' AND activo = true
  );
$$ LANGUAGE sql STABLE;
```

### 2. La columna `uid` en `solicitudes_registro` es UUID pero almacenamos emails

Insertamos emails en `solicitudes_registro.uid`, pero la columna es de tipo `UUID`. Esto causa error al aprobar:

```
invalid input syntax for type uuid: "marta.cisternas@andaliensur.cl"
```

**Fix en `SQL_md/fix_uid_type.sql`:** Cambia la columna a TEXT y actualiza las funciones.

### 3. Múltiples versiones de la función `aprobar_solicitud_registro`

Existen dos versiones de la función: una que acepta `uuid` y otra que acepta `text`. PostgreSQL no puede decidir cuál usar.

---

## Solución Definitiva

Ejecutar los siguientes SQL **EN ORDEN** en el Supabase SQL Editor:

### PASO 1: Limpiar todo y reiniciar RLS

Ejecutar **`SQL_md/fix_uid_type.sql`** (ya incluye DROP de funciones viejas + cambio de tipo + nuevas políticas).

### PASO 2: Verificar que `es_admin()` funciona

```sql
SELECT public.es_admin();
```

Debe retornar `true` si el usuario logueado es ADMIN.

### PASO 3: Verificar políticas activas

```sql
SELECT tablename, policyname, permissive, cmd, qual
FROM pg_policies
WHERE tablename IN (
  'usuarios', 'equipos', 'lugares', 'requerimientos',
  'solicitudes_registro', 'configuracion_dispositivos'
)
ORDER BY tablename, cmd;
```

Debe mostrar **una política por operación (SELECT/INSERT/UPDATE/DELETE)** por tabla. Si ves políticas duplicadas o faltantes, hay conflictos.

### PASO 4: Si hay políticas duplicadas, limpiar manualmente

```sql
-- Eliminar TODAS las políticas de una tabla y recrearlas
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_all" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_admin" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_authenticated" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_admin" ON usuarios;
DROP POLICY IF EXISTS "usuarios_self_update" ON usuarios;

-- Recrear políticas limpias
CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "usuarios_delete" ON usuarios
  FOR DELETE USING (public.es_admin());

-- Repetir para cada tabla problemática
```

### PASO 5: Políticas recomendadas (estándar para todas las tablas)

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| usuarios | autenticado | autenticado | autenticado | admin |
| equipos | autenticado | autenticado | autenticado | admin |
| lugares | autenticado | autenticado | autenticado | admin |
| requerimientos | autenticado | autenticado | autenticado | admin |
| solicitudes_registro | autenticado | autenticado | autenticado | autenticado |
| configuracion_dispositivos | autenticado | autenticado | autenticado | admin |
| ubicaciones | autenticado | autenticado | autenticado | admin |
| qr_codes | autenticado | autenticado | autenticado | admin |
| posibles_fallas | autenticado | autenticado | autenticado | admin |
| posibles_diagnosticos | autenticado | autenticado | autenticado | admin |
| posibles_soluciones | autenticado | autenticado | autenticado | admin |
| posibles_observaciones | autenticado | autenticado | autenticado | admin |

**Nota:** "autenticado" = `auth.role() = 'authenticated'` · "admin" = `public.es_admin()`

---

## Sobre "la página de correo no aparece"

Si la página de configuración de correo (tab `correo` en Configuración Técnico) no se muestra, puede ser por:

1. **Falta de permisos RLS** en la tabla de configuración de correo
2. **La tabla `config_sistema` o similar no tiene política SELECT**
3. **El usuario no tiene rol ADMIN** (la página requiere `es_admin()`)

Revisar con:

```sql
SELECT * FROM pg_policies WHERE tablename = 'config_sistema';
```

Si no hay políticas, la tabla tiene RLS activado pero sin políticas → deniega todo. Solución:

```sql
CREATE POLICY "config_sistema_select" ON config_sistema
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## Resumen

El problema raíz es que se ejecutaron **múltiples scripts SQL contradictorios** a lo largo del tiempo. La solución definitiva es:

1. **Estandarizar todas las políticas** con un criterio único (`auth.role() = 'authenticated'` para operaciones básicas, `es_admin()` para operaciones sensibles)
2. **Asegurar que `es_admin()` funcione correctamente** comparando contra `uid = auth.uid()::text`
3. **No ejecutar scripts RLS de diferentes fuentes** sin antes limpiar las políticas existentes
