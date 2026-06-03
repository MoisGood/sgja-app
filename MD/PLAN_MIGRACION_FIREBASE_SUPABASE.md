# PLAN DE MIGRACIÓN: FIREBASE → SUPABASE

## RESUMEN EJECUTIVO
- **Tiempo estimado**: 3-5 días de desarrollo
- **Riesgo**: Bajo (mantendremos Firebase como backup durante testing)
- **Rollback**: Disponible en cualquier momento
- **Impacto**: Reducción de costos 80-90%, mejor escalabilidad

---

## FASE 1: PREPARACIÓN (Día 1)

### 1.1 Crear Proyecto Supabase
```
1. Ir a https://supabase.com
2. Crear nueva organización (o usar existente)
3. Crear nuevo proyecto:
   - Nombre: SGJA-Production
   - pass:u*$uxSaqPj@G7NG
   - Región: Sudamérica (São Paulo)
   - Plan: Free (para testing)
4. Guardar credenciales:
   - URL: https://[proyecto].supabase.co
   - Anon Key: [guardar en .env]
   - Service Role Key: [guardar seguro]
```

### 1.2 Estructura de Base de Datos (Supabase PostgreSQL)

**Mapeo Firestore → Supabase:**

```
| Firestore Collection | Supabase Table | Tipo |
|---|---|---|
| usuarios | usuarios | Tabla |
| estudiantes | estudiantes | Tabla |
| solicitudes | solicitudes | Tabla |
| bloques_horarios | bloques_horarios | Tabla |
| motivos_justificacion | motivos_justificacion | Tabla |
| establecimientos | establecimientos | Tabla |
| cursos | cursos | Tabla |
| funcionarios | funcionarios | Tabla |
| paginas | paginas | Tabla |
| permisos | permisos | Tabla (junction para roles) |
```

### 1.3 Crear Tablas en Supabase

**USUARIOS:** (Remplaza Auth de Firebase)
```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT UNIQUE NOT NULL,  -- ID de Firebase Auth (temporal)
  email TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('ADMIN', 'INSPECTOR', 'PROFESOR', 'ESTUDIANTE', 'APODERADO')),
  id_establecimiento UUID REFERENCES establecimientos(id),
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);
```

**ESTUDIANTES:**
```sql
CREATE TABLE estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_estudiante TEXT UNIQUE NOT NULL,  -- RUT
  nombre_completo TEXT NOT NULL,
  email TEXT,
  curso TEXT NOT NULL,
  id_establecimiento UUID REFERENCES establecimientos(id),
  activo BOOLEAN DEFAULT true,
  apoderado_id UUID REFERENCES usuarios(id),
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);
```

**SOLICITUDES:** (Justificativos, ausencias, atrasos)
```sql
CREATE TABLE solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_solicitud TEXT UNIQUE NOT NULL,
  id_estudiante TEXT NOT NULL,
  id_profesor UUID REFERENCES usuarios(id),
  id_profesor_nombre TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('AUSENCIA', 'ATRASO', 'INASISTENCIA', 'JUSTIFICADA')),
  estado TEXT NOT NULL CHECK (estado IN ('PENDIENTE', 'JUSTIFICADA', 'INJUSTIFICADA', 'RECHAZADA')),
  fecha DATE NOT NULL,
  hora TEXT,
  id_bloque TEXT,
  curso TEXT,
  id_establecimiento UUID REFERENCES establecimientos(id),
  motivo_codigo TEXT,
  motivo_descripcion TEXT,
  observaciones TEXT,
  id_inspector_justificador UUID REFERENCES usuarios(id),
  respaldo_recibido BOOLEAN DEFAULT false,
  tipo_respaldo TEXT,
  id_token_qr TEXT,
  bloques_afectados INTEGER,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);
```

**BLOQUES_HORARIOS:**
```sql
CREATE TABLE bloques_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_bloque TEXT UNIQUE NOT NULL,
  nombre_bloque TEXT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  orden INTEGER NOT NULL,
  id_establecimiento UUID REFERENCES establecimientos(id),
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now()
);
```

**ESTABLECIMIENTOS:**
```sql
CREATE TABLE establecimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  region TEXT,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now()
);
```

**FUNCIONARIOS:** (Ver módulo Mantenedor Funcionarios)
```sql
CREATE TABLE funcionarios (
  rut TEXT PRIMARY KEY,
  rut_formateado TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  fecha_nacimiento DATE,
  domicilio TEXT NOT NULL,
  comuna TEXT NOT NULL,
  celular TEXT NOT NULL,
  correo_personal TEXT NOT NULL UNIQUE,
  correo_institucional TEXT NOT NULL UNIQUE,
  titulo_profesional TEXT,
  universidad TEXT,
  ano_titulacion INTEGER,
  fecha_ingreso DATE,
  fecha_termino DATE,
  horas_contrato INTEGER,
  vigente BOOLEAN DEFAULT true,
  usuario_registrado_sistema BOOLEAN DEFAULT false,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);
```

### 1.4 Row Level Security (RLS) - CRÍTICO

✅ **COMPLETADO** - Script: `SQL_SUPABASE_RLS_POLICIES.sql`

**Políticas creadas:**
- ✅ Usuarios ven solo datos de su establecimiento
- ✅ Profesores ven estudiantes de su establecimiento
- ✅ Apoderados ven solo sus hijos
- ✅ Inspectores justifican solicitudes de su establecimiento
- ✅ Admins ven todo
- ✅ Funciones auxiliares para obtener rol y establecimiento

**Cómo ejecutar:**
1. Copiar el contenido de `SQL_SUPABASE_RLS_POLICIES.sql`
2. Pegar en Supabase SQL Editor
3. Ejecutar (Ctrl + Enter)
4. Verificar con: `SELECT * FROM pg_policies;`

---

## FASE 2: AUTENTICACIÓN (Día 2)

### 2.1 Configurar Supabase Auth
```
1. En Supabase Dashboard → Authentication → Providers
2. Activar: Email/Password
3. Configurar opciones:
   - Email confirmations: Desactivado (para testing)
   - Auto confirm users: Activado
```

### 2.2 Crear funciones SQL para gestión de usuarios
```sql
-- Función: Crear usuario en tabla usuarios al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.usuarios (uid, email, nombre_completo, rol)
  VALUES (NEW.id, NEW.email, NEW.email, 'PROFESOR')
  ON CONFLICT (uid) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: Ejecutar función cuando se crea usuario en auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## FASE 3: MIGRACIÓN DE DATOS (Día 3)

### 3.1 Exportar datos de Firestore

```javascript
// Script para exportar cada colección a JSON
// Usar Firebase Admin SDK
db.collection('usuarios').get().then(snapshot => {
  const data = [];
  snapshot.forEach(doc => {
    data.push({ id: doc.id, ...doc.data() });
  });
  console.log(JSON.stringify(data));
});
```

### 3.2 Importar datos a Supabase

```sql
-- Via CSV o SQL bulk insert
INSERT INTO usuarios (uid, email, nombre_completo, rol, id_establecimiento) 
VALUES (...datos...);

INSERT INTO estudiantes (id_estudiante, nombre_completo, corso, id_establecimiento) 
VALUES (...datos...);

-- Desabilitar y reabilitar RLS durante bulk insert para performance
```

### 3.3 Validar integridad de datos

```sql
-- Verificar conteos
SELECT COUNT(*) as usuarios FROM usuarios;
SELECT COUNT(*) as estudiantes FROM estudiantes;
SELECT COUNT(*) as solicitudes FROM solicitudes;

-- Verificar duplicados
SELECT email, COUNT(*) FROM usuarios GROUP BY email HAVING COUNT(*) > 1;

-- Verificar referencias válidas
SELECT * FROM estudiantes WHERE id_establecimiento NOT IN (SELECT id FROM establecimientos);
```

---

## FASE 4: DESARROLLO - CREAR SERVICIO SUPABASE (Día 3-4)

### 4.1 Crear `src/services/supabase.ts`

**Estructura base:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Funciones equivalentes a firestore.ts:
export async function obtenerEstudiantesPorCurso(establecimiento, curso) {
  // SELECT * FROM estudiantes WHERE ...
}

export async function crearSolicitud(datos) {
  // INSERT INTO solicitudes ...
}

export async function obtenerFuncionarios() {
  // SELECT * FROM funcionarios ...
}

// ... más funciones ...
```

### 4.2 Mapeo de funciones Firestore → Supabase

| Firestore | Supabase |
|---|---|
| `getDocs(query(...))` | `supabase.from('tabla').select()` |
| `getDoc(doc(...))` | `supabase.from('tabla').select().eq('id', id).single()` |
| `setDoc(..., data)` | `supabase.from('tabla').insert(data)` |
| `updateDoc(..., data)` | `supabase.from('tabla').update(data).eq('id', id)` |
| `deleteDoc(...)` | `supabase.from('tabla').delete().eq('id', id)` |
| `onSnapshot(...)` | `supabase.from('tabla').on('*', callback)` |
| `where()` | `.eq()`, `.neq()`, `.gt()`, `.lt()`, etc. |
| `orderBy()` | `.order('columna', {ascending: true})` |
| `limit()` | `.limit(10)` |

---

## FASE 5: REEMPLAZAR IMPORTS (Día 4)

### 5.1 Archivos a actualizar

```
src/services/
  - firestore.ts → supabase.ts (nuevo)
  - (mantener firestore.ts como respaldo)

src/pages/
  - DashboardProfesor.tsx (actualizar imports)
  - MantenedorFuncionarios.tsx (actualizar imports)
  - DashboardAdmin.tsx (actualizar imports)
  - ... todas las páginas ...

src/hooks/
  - useAuth.ts (actualizar validación)

src/lib/
  - firebase.ts → supabase.ts (nuevo)
```

### 5.2 Cambios de imports

```typescript
// ANTES:
import { obtenerEstudiantes } from '../services/firestore';

// DESPUÉS:
import { obtenerEstudiantes } from '../services/supabase';
```

---

## FASE 6: TESTING (Día 5)

### 6.1 Checklist de testing

- [ ] Login con email/password
- [ ] Ver estudiantes por curso
- [ ] Registrar ausencia
- [ ] Crear justificativo
- [ ] Ver historial
- [ ] Cambiar estado estudiante
- [ ] CRUD funcionarios
- [ ] Cache funciona (IndexedDB)
- [ ] Offline mode funciona
- [ ] Permisos RLS funcionan

### 6.2 Load testing

```bash
# Probar con Apache Bench
ab -n 1000 -c 10 https://sgj20161.web.app/api/endpoint
```

---

## FASE 7: CUTOVER (Go-Live)

### 7.1 Preparación

```
1. Hacer respaldo final de Firestore
2. Verificar que Supabase tiene todos los datos
3. Comunicar a usuarios: "Sistema en mantenimiento 2 horas"
4. Preparar rollback plan
```

### 7.2 Ejecución

```
1. Deploy a producción (Vercel)
2. Monitorear errores (Sentry)
3. Verificar métricas (dashboard usage)
4. Si problemas: rollback a Firebase
```

### 7.3 Post-cutover

```
1. Recolectar feedback de usuarios
2. Optimizar queries lentas
3. Mantener Firebase como backup por 1 semana
4. Documentar lecciones aprendidas
```

---

## COSTOS COMPARATIVOS

**Firebase (actual):**
- Firestore: 6.1K reads/day = ~$2-3/mes (bajo)
- Storage: mínimo
- **Total**: $0-5/mes (cuota gratuita)

**Supabase (estimado):**
- PostgreSQL: 500MB gratis (más que suficiente)
- Auth: gratis
- Egress: gratis (primeros 2GB)
- **Total**: $0/mes (cuota gratuita) o $25/mes (Pro si crece)

**Ahorro: 80-90% de costos**

---

## ROLLBACK PLAN (Si algo falla)

```
1. Cambiar .env a apuntar a Firebase nuevamente
2. Compilar y desplegar
3. Revertir cambios en Git: git revert <commit>
4. Los datos en Supabase quedan intactos (backup)
```

---

## 📊 ESTADO ACTUAL - 20 Abril 2026

```
✅ COMPLETADO (67%):
├─ FASE 1: Preparación (DB + RLS + Triggers)
├─ FASE 2: Autenticación (Email Provider + usuario prueba + .env)
└─ Auth funcional, usuario de prueba creado, trigger verificado

🔄 PRÓXIMA (0%):
├─ FASE 3: Migración de Datos (Firestore → Supabase)
└─ Tiempo estimado: 2-3 horas

⏳ SIGUIENTES:
├─ FASE 4: Desarrollo (supabase.ts)
├─ FASE 5: Testing y Staging
└─ FASE 6: Production Deployment
```

---

## 🎯 PRÓXIMOS PASOS (DESGLOSADOS)

### ✅ FASE 1: PREPARACIÓN - COMPLETADA
- [x] Crear proyecto Supabase
- [x] Crear 11 tablas con constraints
- [x] Crear 26 políticas RLS
- [x] Crear índices y triggers
- [x] Datos iniciales de ejemplo

**Archivos creados:**
- `SQL_SUPABASE_CREAR_TABLAS.sql`
- `SQL_SUPABASE_RLS_FINAL.sql`

### ✅ FASE 2: AUTENTICACIÓN - COMPLETADA
- [x] SQL: Crear funciones y triggers
- [x] Configuración en Dashboard Supabase
- [x] Crear usuario de prueba (profesor1@test.com)
- [x] Verificar que trigger funciona
- [x] .env.local actualizado con credenciales

**Status:** ✅ Usuario de prueba funcionando, RLS verificado, Auth lista para usar

### ⏳ FASE 3: MIGRACIÓN DE DATOS - PRÓXIMA (EMPIEZA AHORA)
- [ ] Exportar datos de Firestore → JSON
- [ ] Transformar formato Firestore → PostgreSQL
- [ ] Importar a tablas Supabase
- [ ] Validar integridad (row counts, referencias)
- [ ] Crear índices para performance

**Guía:** `FASE3_MIGRACION_DATOS_GUIA_PASOS.md` (6 pasos)
**Tiempo estimado:** 2-3 horas

### ⏳ FASE 4: DESARROLLO - DESPUÉS
- [ ] Crear `src/services/supabase.ts`
- [ ] Reemplazar imports Firestore
- [ ] Testing local

### ⏳ FASE 5: DEPLOYMENT - FINAL
- [ ] Deploy a Vercel
- [ ] Monitoreo post-go-live

