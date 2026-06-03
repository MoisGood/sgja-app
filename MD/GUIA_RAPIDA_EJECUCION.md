# ⚡ GUÍA RÁPIDA DE EJECUCIÓN - Scripts SQL Supabase

**Tiempo total estimado:** 30-45 minutos  
**Orden:** Secuencial (uno después del otro)

---

## 📋 PASO A PASO

### ✅ PASO 1: Ir a Supabase Dashboard

```
1. Abrir https://supabase.com/dashboard
2. Seleccionar proyecto "SGJA-Production"
3. Ir a "SQL Editor" (lado izquierdo)
4. Click "New Query"
```

---

### ✅ PASO 2: Ejecutar Script 1 - Crear Tablas (3-5 min)

**Archivo:** `SQL_SUPABASE_CREAR_TABLAS.sql`

```sql
1. Copiar COMPLETO el contenido del archivo
2. Pegar en SQL Editor
3. Presionar Ctrl + Enter (o click "Run")
4. Esperar mensaje: "Success - All queries executed"
5. Verificar: Si no hay errores rojos, continuamos
```

**Verificación:**
```sql
-- Copiar y ejecutar esta query para verificar:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Debe mostrar 11 tablas
```

**Resultado esperado:**
- ✅ 11 tablas creadas
- ✅ Índices optimizados
- ✅ Triggers de timestamp
- ✅ Datos iniciales insertados

---

### ✅ PASO 3: Ejecutar Script 2 - RLS Policies (5-10 min)

**Archivo:** `SQL_SUPABASE_RLS_POLICIES.sql`

```sql
1. Nueva Query en SQL Editor
2. Copiar COMPLETO del archivo
3. Pegar y ejecutar (Ctrl + Enter)
4. Esperar "Success"
```

**Verificación:**
```sql
-- Copiar y ejecutar:
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN (
  'usuarios', 'estudiantes', 'solicitudes', 'bloques_horarios'
)
ORDER BY tablename;

-- Debe mostrar ~15 políticas
```

**Resultado esperado:**
- ✅ RLS habilitado en tablas críticas
- ✅ 15 políticas de seguridad creadas
- ✅ Funciones auxiliares creadas

---

### ✅ PASO 4: Ejecutar Script 3 - Autenticación (5 min)

**Archivo:** `SQL_SUPABASE_FASE2_AUTENTICACION.sql`

```sql
1. Nueva Query
2. Copiar todo el contenido
3. Ejecutar (Ctrl + Enter)
4. Esperar "Success"
```

**Verificación:**
```sql
-- Copiar y ejecutar:
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Debe mostrar ~9 funciones
```

**Resultado esperado:**
- ✅ 9 funciones SQL creadas
- ✅ Triggers para auth configurados
- ✅ Vista usuarios_activos creada

---

### ✅ PASO 5: Configurar Supabase Auth (15 min)

**En Dashboard:**

```
1. Ir a Authentication → Settings
   - Site URL: http://localhost:5173 (desarrollo)
   - Redirect URLs: http://localhost:5173/**

2. Ir a Authentication → Providers
   - Habilitar: Email/Password
   - Auto confirm users: ON

3. Ir a Authentication → Email Templates
   - Personalizar si es necesario

4. Volver a SQL Editor
```

---

### ✅ PASO 6: Preparar Importación (15-30 min)

**IMPORTANTE:** Tener datos listos antes de PASO 7

**Opción A: Desde Firestore**
```bash
# En Node.js (ver script en SQL_SUPABASE_FASE3_MIGRACION_DATOS.sql)
node export-firestore.js

# Genera archivos:
# - establecimientos.json
# - usuarios.json
# - estudiantes.json
# - solicitudes.json
# - bloques_horarios.json
```

**Opción B: Usar datos de ejemplo (para testing)**
```
Los scripts incluyen datos de ejemplo
No necesitas hacer nada, los datos se crean automáticamente
```

---

### ✅ PASO 7: Ejecutar Script 4 - Migración (10-20 min)

**Archivo:** `SQL_SUPABASE_FASE3_MIGRACION_DATOS.sql`

⚠️ **IMPORTANTE:** Leer comentarios antes de ejecutar

```sql
1. Nueva Query
2. Copiar el contenido

3. DESCOMENTAR las secciones que necesites:
   - PASO 2: DELETE (solo si quieres limpiar datos previos)
   - PASO 3-10: INSERT (importar datos)

4. REEMPLAZAR valores de ejemplo con datos reales:
   - 'LIC001' → código de tu establecimiento
   - 'profesor@escuela.cl' → emails reales
   - 'RUT-1' → RUTs reales de estudiantes

5. Ejecutar paso a paso (no todo junto):
   - Ejecutar PASO 3 (Establecimientos)
   - Ejecutar PASO 4 (Usuarios)
   - Ejecutar PASO 5 (Bloques)
   - ... etc

6. Verificar cada paso antes de continuar
```

**Verificación después de cada PASO:**
```sql
-- Contar registros
SELECT COUNT(*) FROM establecimientos;
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM estudiantes;
SELECT COUNT(*) FROM solicitudes;
```

---

### ✅ PASO 8: Validar Datos (5-10 min)

**Ejecutar validaciones:**

```sql
-- QUERY 1: Resumen de migración
SELECT 
  'establecimientos' as tabla, COUNT(*) as cantidad 
FROM establecimientos
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'estudiantes', COUNT(*) FROM estudiantes
UNION ALL
SELECT 'solicitudes', COUNT(*) FROM solicitudes;

-- QUERY 2: Verificar integridad
SELECT * FROM estudiantes WHERE id_establecimiento IS NULL;
SELECT * FROM usuarios WHERE id_establecimiento IS NULL;

-- QUERY 3: Buscar duplicados
SELECT email, COUNT(*) FROM usuarios GROUP BY email HAVING COUNT(*) > 1;
SELECT id_estudiante, COUNT(*) FROM estudiantes GROUP BY id_estudiante HAVING COUNT(*) > 1;
```

**Si todo está bien:**
```
✅ No aparecen errores
✅ Conteos son realistas
✅ No hay referencias rotas
✅ No hay duplicados
```

---

### ✅ PASO 9: Re-habilitar Seguridad (2 min)

**Ejecutar en SQL Editor:**

```sql
-- Copiar del final de FASE3_MIGRACION_DATOS.sql

-- Re-habilitar Triggers
ALTER TABLE usuarios ENABLE TRIGGER all;
ALTER TABLE estudiantes ENABLE TRIGGER all;
ALTER TABLE solicitudes ENABLE TRIGGER all;

-- Re-habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
```

---

## 🧪 TESTING RÁPIDO

Después de todo, ejecutar estas queries:

```sql
-- TEST 1: Obtener usuario admin
INSERT INTO usuarios (uid, email, nombre_completo, rol, id_establecimiento, activo)
VALUES ('test-admin', 'admin@test.cl', 'Admin Test', 'ADMIN', 
        (SELECT id FROM establecimientos LIMIT 1), true)
ON CONFLICT DO NOTHING;

-- TEST 2: Ver su información
SELECT * FROM usuarios WHERE uid = 'test-admin';

-- TEST 3: Probar función
SELECT obtener_rol_usuario() as rol;

-- TEST 4: Probar RLS
SELECT * FROM usuarios LIMIT 5;
```

---

## ⚠️ ERRORES COMUNES Y SOLUCIONES

### Error: "Syntax error"
```
Solución: 
- Copiar el ARCHIVO COMPLETO sin omitir nada
- Revisar que no haya caracteres especiales mal codificados
- Intenta copiar desde archivo de texto, no desde navegador
```

### Error: "Permission denied"
```
Solución:
- Las políticas RLS pueden impedir acceso
- Temporalmente deshabilitar: ALTER TABLE tabla DISABLE ROW LEVEL SECURITY;
- Ejecutar operación
- Luego habilitar de nuevo
```

### Error: "Foreign key constraint violation"
```
Solución:
- Falta dato relacionado (ej: establecimiento no existe)
- Verificar: SELECT * FROM establecimientos;
- Si está vacío, ejecutar PASO 3 primero
```

### Error: "Conflict on constraint X"
```
Solución:
- Datos duplicados
- Usar ON CONFLICT DO NOTHING o DO UPDATE
- O ejecutar: DELETE FROM tabla WHERE condición;
```

### Las queries se demoran mucho
```
Solución:
- Desactivar RLS/triggers: ALTER TABLE tabla DISABLE ROW LEVEL SECURITY;
- Ejecutar inserts
- Reactivar: ALTER TABLE tabla ENABLE ROW LEVEL SECURITY;
```

---

## 📊 RESUMEN FINAL

```
✅ 11 Tablas creadas
✅ 15 Políticas RLS configuradas
✅ 9 Funciones SQL disponibles
✅ 1 Vista (usuarios_activos)
✅ 3 Triggers de auth configurados
✅ ~20 Índices para optimización
✅ Datos iniciales de ejemplo
✅ Sistema listo para comenzar

Tiempo total: 30-45 minutos
Próximo paso: Crear servicio supabase.ts en React
```

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Scripts SQL completados
2. ✅ Base de datos lista
3. ⏳ **SIGUIENTE:** Crear `src/services/supabase.ts` (cliente JavaScript)
4. ⏳ Conectar React con Supabase
5. ⏳ Testing de conexión
6. ⏳ Reemplazar Firestore por Supabase
7. ⏳ Deploy a Vercel

---

**¿Necesitas ayuda?**
- Revisar: `RESUMEN_SCRIPTS_SQL.md`
- Documentación: https://supabase.com/docs
- GitHub Supabase: https://github.com/supabase/supabase
