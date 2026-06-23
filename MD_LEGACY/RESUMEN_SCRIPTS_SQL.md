# 📊 ESTADO DE MIGRACIÓN SUPABASE - Resumen de Scripts SQL

**Fecha:** 16 de abril de 2026  
**Proyecto:** SGJA - Sistema de Gestión de Justificaciones  
**Estado:** ✅ FASE 1 y FASE 2 COMPLETADAS - Listos para ejecutar

---

## 🎯 Scripts Creados por Fase

### ✅ FASE 1: PREPARACIÓN (Completado)

| Archivo | Descripción | Registros | Estado |
|---------|-------------|-----------|--------|
| [SQL_SUPABASE_CREAR_TABLAS.sql](SQL_SUPABASE_CREAR_TABLAS.sql) | 11 tablas + índices + triggers | 11 tablas | ✅ Listo |
| [SQL_SUPABASE_RLS_POLICIES.sql](SQL_SUPABASE_RLS_POLICIES.sql) | Políticas de seguridad | 15 políticas | ✅ Listo |

**Qué incluye:**
- ✅ Todas las tablas creadas
- ✅ Row Level Security para todos los roles
- ✅ Índices para optimización
- ✅ Funciones para timestamps

---

### ✅ FASE 2: AUTENTICACIÓN (Completado)

| Archivo | Descripción | Funciones | Estado |
|---------|-------------|-----------|--------|
| [SQL_SUPABASE_FASE2_AUTENTICACION.sql](SQL_SUPABASE_FASE2_AUTENTICACION.sql) | Triggers para auth + funciones | 9 funciones | ✅ Listo |

**Qué incluye:**
- ✅ Trigger para crear usuario automáticamente
- ✅ Función para sincronizar cambios en auth
- ✅ Función para desactivar usuarios (soft delete)
- ✅ Función para obtener usuario actual
- ✅ Función para verificar permisos
- ✅ Función para asignar roles
- ✅ 1 vista (usuarios_activos)

---

### ✅ FASE 3: MIGRACIÓN DE DATOS (Completado)

| Archivo | Descripción | Pasos | Estado |
|---------|-------------|-------|--------|
| [SQL_SUPABASE_FASE3_MIGRACION_DATOS.sql](SQL_SUPABASE_FASE3_MIGRACION_DATOS.sql) | Importar datos + validación | 20 pasos | ✅ Listo |

**Qué incluye:**
- ✅ Deshabilitar RLS/triggers temporalmente
- ✅ Scripts para importar cada tabla
- ✅ Validación de integridad referencial
- ✅ Búsqueda de duplicados
- ✅ Limpieza de datos
- ✅ Re-habilitar RLS/triggers
- ✅ Script de exportación desde Firestore

---

## 🚀 ORDEN DE EJECUCIÓN

```
DÍA 1 - PREPARACIÓN
├─ 1. SQL_SUPABASE_CREAR_TABLAS.sql (3-5 min)
└─ 2. SQL_SUPABASE_RLS_POLICIES.sql (5-10 min)

DÍA 2 - AUTENTICACIÓN  
├─ 3. SQL_SUPABASE_FASE2_AUTENTICACION.sql (5 min)
└─ 4. Configurar Supabase Auth en UI (15 min)

DÍA 3 - MIGRACIÓN
├─ 5. Exportar datos de Firestore (15-30 min)
├─ 6. SQL_SUPABASE_FASE3_MIGRACION_DATOS.sql (10-20 min)
└─ 7. Validación de datos (5-10 min)
```

---

## 📋 CÓMO EJECUTAR CADA SCRIPT

### Script 1: Crear Tablas

```bash
1. Abrir https://supabase.com/dashboard
2. Ir a SQL Editor
3. Nueva query
4. Copiar contenido de: SQL_SUPABASE_CREAR_TABLAS.sql
5. Ejecutar (Ctrl + Enter)
6. Esperar "Success"
```

### Script 2: RLS Policies

```bash
1. SQL Editor → Nueva query
2. Copiar: SQL_SUPABASE_RLS_POLICIES.sql
3. Ejecutar
4. Verificar: SELECT * FROM pg_policies;
```

### Script 3: Autenticación

```bash
1. SQL Editor → Nueva query
2. Copiar: SQL_SUPABASE_FASE2_AUTENTICACION.sql
3. Ejecutar
4. Ir a Authentication → Settings → Configurar redirect URLs
5. Habilitar Email/Password en Providers
```

### Script 4: Migración

```bash
1. Exportar datos de Firestore (ver script)
2. SQL Editor → Nueva query
3. Copiar: SQL_SUPABASE_FASE3_MIGRACION_DATOS.sql
4. DESCOMENTAR líneas de inserción de datos
5. Reemplazar valores de ejemplo con datos reales
6. Ejecutar paso por paso
7. Validar resultados
```

---

## 🔑 CONFIGURACIONES IMPORTANTES

### En Supabase Dashboard - Authentication

```
Settings:
- Site URL: https://localhost:5173 (desarrollo)
- Redirect URLs: https://localhost:5173/**

Providers:
- Email/Password: HABILITADO
- Auto confirm users: ON (para testing)

Email Templates:
- Personalizar si es necesario
```

### En Supabase Dashboard - Database

```
Roles (Ir a su específica después de auth):
- ADMIN: Acceso total
- INSPECTOR: Justificar solicitudes
- PROFESOR: Ver estudiantes, crear solicitudes
- APODERADO: Ver solo sus hijos
- ESTUDIANTE: Ver sus datos
```

---

## 📊 ESTADÍSTICAS DE TABLAS

| Tabla | Columnas | Índices | RLS | Triggers |
|-------|----------|---------|-----|----------|
| establecimientos | 6 | 0 | ✅ | ✅ |
| usuarios | 9 | 3 | ✅ | ✅ auth.users |
| estudiantes | 10 | 2 | ✅ | ✅ |
| solicitudes | 19 | 5 | ✅ | ✅ |
| bloques_horarios | 8 | 1 | ✅ | ❌ |
| motivos_justificacion | 5 | 0 | ❌ | ❌ |
| cursos | 8 | 2 | ✅ | ✅ |
| funcionarios | 17 | 0 | ✅ | ✅ |
| permisos | 4 | 0 | ❌ | ❌ |
| rol_permisos | 4 | 0 | ❌ | ❌ |
| paginas | 6 | 0 | ❌ | ✅ |

---

## 🔐 POLÍTICAS RLS CREADAS

### Roles y Permisos:

```
ADMIN:
├─ Ver: TODO
├─ Crear: TODO
├─ Modificar: TODO
└─ Eliminar: TODO

INSPECTOR:
├─ Ver: Solicitudes de su establecimiento
├─ Modificar: Justificar solicitudes
└─ Crear: ❌

PROFESOR:
├─ Ver: Estudiantes de su establecimiento
├─ Ver: Solicitudes de su establecimiento
├─ Crear: Solicitudes
└─ Modificar: Estudiantes

APODERADO:
├─ Ver: Solo sus hijos
├─ Ver: Solicitudes de sus hijos
└─ Crear/Modificar: ❌

ESTUDIANTE:
├─ Ver: Sus propios datos
└─ Crear/Modificar: ❌
```

---

## ⚡ FUNCIONES SQL DISPONIBLES

### Funciones de Autenticación

```sql
-- Obtener usuario actual
SELECT * FROM obtener_usuario_actual();

-- Obtener rol del usuario
SELECT obtener_rol_usuario();

-- Obtener ID de establecimiento
SELECT obtener_id_establecimiento();

-- Verificar permiso
SELECT tiene_permiso('ver_estudiantes');

-- Asignar rol (ADMIN only)
SELECT * FROM asignar_rol(user_id, 'INSPECTOR');

-- Desactivar usuario (ADMIN only)
SELECT * FROM desactivar_usuario(user_id);

-- Reactivar usuario (ADMIN only)
SELECT * FROM reactivar_usuario(user_id);
```

---

## 📝 DATOS INICIALES

El script FASE 3 incluye ejemplos de:
- ✅ 1 Establecimiento
- ✅ 3 Usuarios (Profesor, Inspector, Admin)
- ✅ 8 Bloques horarios
- ✅ 5 Motivos de justificación
- ✅ 2 Estudiantes
- ✅ 1 Solicitud de ejemplo
- ✅ 1 Funcionario

---

## 🧪 TESTING CHECKLIST

Después de ejecutar todos los scripts:

```
AUTENTICACIÓN:
- [ ] Registrar usuario en Supabase Auth
- [ ] Login funciona
- [ ] Usuario se crea en tabla usuarios

PERMISOS:
- [ ] Admin ve todo
- [ ] Profesor ve solo su establecimiento
- [ ] Apoderado ve solo sus hijos
- [ ] Inspector ve solicitudes de su escuela

DATOS:
- [ ] SELECT COUNT(*) FROM usuarios ≥ 1
- [ ] SELECT COUNT(*) FROM estudiantes ≥ 0
- [ ] SELECT COUNT(*) FROM solicitudes ≥ 0

INTEGRIDAD:
- [ ] No hay referencias rotas
- [ ] No hay duplicados
- [ ] Todas las fechas son válidas
```

---

## 🔄 PRÓXIMOS PASOS

1. ✅ Scripts SQL creados
2. ⏳ **SIGUIENTE:** Ejecutar scripts en Supabase
3. ⏳ Crear servicio supabase.ts en React
4. ⏳ Actualizar imports en componentes
5. ⏳ Testing local con datos reales
6. ⏳ Deploy a Vercel
7. ⏳ Monitoreo post-migración

---

## 📞 TROUBLESHOOTING

### Error: "Permission denied for schema public"
```
Solución: Ejecutar scripts como usuario con permisos
o desactivar RLS durante ejecución
```

### Error: "Role does not exist"
```
Solución: Las políticas RLS requieren auth.uid()
Verificar que el usuario está logeado
```

### Error: "Unique constraint violation"
```
Solución: Eliminar datos duplicados
DELETE FROM tabla WHERE id IN (SELECT...)
```

### Error: "Foreign key constraint violation"
```
Solución: Verificar que id_establecimiento existe
SELECT * FROM establecimientos;
```

---

## 📚 RECURSOS

- Documentación Supabase: https://supabase.com/docs
- PostgreSQL RLS: https://www.postgresql.org/docs/current/sql-createpolicy.html
- Supabase CLI: https://supabase.com/docs/guides/cli
- Ejemplos RLS: https://github.com/supabase/supabase/tree/master/examples

---

**Estado Actual:** ✅ Todos los scripts listos para ejecutar  
**Próximo Paso:** Copiar scripts a Supabase SQL Editor y ejecutar en orden

