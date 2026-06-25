# PLAN DE MIGRACIÓN: FIREBASE → SUPABASE

**Fecha de inicio:** 16 de abril de 2026  
**Estado:** Planificación  
**Objetivo:** Reemplazar Firebase Firestore y Auth con Supabase

---

## 📋 ÍNDICE

1. [Análisis de Estructura Actual](#análisis-de-estructura-actual)
2. [Mapeo Firebase → Supabase](#mapeo-firebase--supabase)
3. [Tareas Previas](#tareas-previas)
4. [Fase 1: Configuración Supabase](#fase-1-configuración-supabase)
5. [Fase 2: Migración de Datos](#fase-2-migración-de-datos)
6. [Fase 3: Cambios en Código](#fase-3-cambios-en-código)
7. [Fase 4: Testing](#fase-4-testing)
8. [Fase 5: Cutover (Cambio en Producción)](#fase-5-cutover-cambio-en-producción)

---

## 🔍 ANÁLISIS DE ESTRUCTURA ACTUAL

### Colecciones Firestore (9):
```
Firebase Collections:
├── usuarios
├── estudiantes
├── solicitudes
├── tokens_qr
├── motivos_justificacion
├── establecimientos
├── bloques_horarios
├── funcionarios
├── roles
└── permisos
```

### Servicios/Funciones Principales:
```
firestore.ts (1,884 líneas):
├── Usuarios (crear, obtener, actualizar)
├── Estudiantes (CRUD)
├── Solicitudes (crear, filtrar, obtener)
├── Tokens QR
├── Bloques Horarios
├── Funcionarios
├── Roles y Permisos (dinámicos)
├── Cache Service
└── Online Service (tracking usuarios)

Auth Firebase:
├── createUserWithEmailAndPassword()
├── signInWithEmailAndPassword()
├── signOut()
├── Custom Claims (roles)
└── Email verification
```

---

## 🔄 MAPEO FIREBASE → SUPABASE

### 1. AUTENTICACIÓN

| Firebase Auth | Supabase Auth | Notas |
|---|---|---|
| `createUserWithEmailAndPassword()` | `supabase.auth.signUp()` | Idéntico |
| `signInWithEmailAndPassword()` | `supabase.auth.signInWithPassword()` | Idéntico |
| `signOut()` | `supabase.auth.signOut()` | Idéntico |
| Custom Claims | JWT metadata + RLS policies | Más flexible |
| Email verification | Built-in | Igual |
| Password reset | Built-in | Igual |

### 2. FIRESTORE → PostgreSQL (Supabase)

| Firestore | Supabase | SQL |
|---|---|---|
| Colección | Tabla | `CREATE TABLE usuarios` |
| Documento ID | UUID Primary Key | `id UUID PRIMARY KEY` |
| Campo String | VARCHAR | `VARCHAR(255)` |
| Campo Number | INTEGER/NUMERIC | `INTEGER` o `NUMERIC` |
| Campo Boolean | BOOLEAN | `BOOLEAN` |
| Campo Timestamp | TIMESTAMP | `TIMESTAMP WITH TIME ZONE` |
| Campo Array | JSONB Array | `JSONB '[]'` |
| Campo Object | JSONB | `JSONB '{}'` |
| Subcollection | Foreign Key + Table | Relación 1:N |
| Firestore Rules | RLS Policies | `CREATE POLICY ...` |
| Index (Composite) | Composite Index | `CREATE INDEX idx_...` |

### 3. ESTRUCTURA DE TABLAS A CREAR

```sql
-- 1. USUARIOS
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  id_establecimiento UUID NOT NULL,
  rol VARCHAR(50) NOT NULL,
  nombre_completo VARCHAR(255),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. ESTUDIANTES
CREATE TABLE estudiantes (
  id_estudiante UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_establecimiento UUID NOT NULL,
  rut VARCHAR(20) UNIQUE,
  nombre_completo VARCHAR(255) NOT NULL,
  curso VARCHAR(10),
  apoderado_email VARCHAR(255),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. SOLICITUDES
CREATE TABLE solicitudes (
  id_solicitud UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_establecimiento UUID NOT NULL,
  id_estudiante UUID NOT NULL,
  id_profesor UUID NOT NULL,
  tipo VARCHAR(50), -- INASISTENCIA, ATRASO, JUSTIFICATIVA
  estado VARCHAR(50), -- INJUSTIFICADA, JUSTIFICADA
  fecha DATE NOT NULL,
  hora TIME,
  id_bloque UUID NOT NULL,
  motivo_descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante),
  FOREIGN KEY (id_profesor) REFERENCES usuarios(id)
);

-- 4. BLOQUES_HORARIOS
CREATE TABLE bloques_horarios (
  id_bloque UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_establecimiento UUID NOT NULL,
  nombre_bloque VARCHAR(100) NOT NULL,
  orden INTEGER,
  hora_inicio TIME,
  hora_fin TIME,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. FUNCIONARIOS
CREATE TABLE funcionarios (
  rut VARCHAR(20) PRIMARY KEY,
  nombre_completo VARCHAR(255),
  domicilio VARCHAR(255),
  comuna VARCHAR(100),
  celular VARCHAR(20),
  correo_personal VARCHAR(255),
  correo_institucional VARCHAR(255),
  titulo_profesional VARCHAR(255),
  usuario_registrado_sistema BOOLEAN,
  vigente BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. ROLES
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_establecimiento UUID NOT NULL,
  nombre_rol VARCHAR(100),
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. PERMISOS
CREATE TABLE permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_rol UUID NOT NULL,
  nombre_permiso VARCHAR(100),
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (id_rol) REFERENCES roles(id)
);

-- 8. ESTABLECIMIENTOS
CREATE TABLE establecimientos (
  id_establecimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. TOKENS_QR
CREATE TABLE tokens_qr (
  id_token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_establecimiento UUID NOT NULL,
  codigo_qr VARCHAR(255) UNIQUE,
  usado BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- 10. MOTIVOS_JUSTIFICACION
CREATE TABLE motivos_justificacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_establecimiento UUID NOT NULL,
  codigo VARCHAR(50),
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ✅ TAREAS PREVIAS

- [ ] Crear cuenta Supabase
- [ ] Crear nuevo proyecto en Supabase
- [ ] Obtener `SUPABASE_URL` y `SUPABASE_KEY` (anon key)
- [ ] Crear folder `backup_firebase/` con respaldo completo
- [ ] Preparar script de exportación Firestore → CSV
- [ ] Revisar volumen de datos a migrar

---

## 🔧 FASE 1: CONFIGURACIÓN SUPABASE

### Paso 1.1: Crear Proyecto Supabase

1. Ir a https://app.supabase.com
2. Crear nuevo proyecto
3. Nombre: `sgja-produccion`
4. Password fuerte
5. Región: Elegir más cercana a usuarios (ej: `us-east-1` o similar)
6. Copiar credenciales:
   - ✅ `SUPABASE_URL` (ej: `https://xxxxx.supabase.co`)
   - ✅ `SUPABASE_ANON_KEY` (public key)
   - ✅ `SUPABASE_SERVICE_KEY` (para migraciones)

### Paso 1.2: Crear Tablas

1. Ir a SQL Editor en Supabase
2. Ejecutar scripts SQL de jerarquía:
   - Primero: `establecimientos`, `roles`
   - Luego: `usuarios`, `estudiantes`
   - Después: `bloques_horarios`, `funcionarios`
   - Finalmente: `solicitudes`, `permisos`, `tokens_qr`, `motivos_justificacion`

```sql
-- Ejecutar en orden en Supabase SQL Editor
-- (Copiar scripts completos de la sección anterior)
```

### Paso 1.3: Crear Row Level Security (RLS) Policies

```sql
-- Ejemplo: Usuarios solo ven el suyo
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven su propio registro"
  ON usuarios FOR SELECT
  USING (auth.uid()::text = id::text OR
         role() = 'authenticated');

CREATE POLICY "Admins ven todos"
  ON usuarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid()::text 
      AND u.rol = 'ADMIN'
    )
  );
```

### Paso 1.4: Crear Índices

```sql
-- Índices para queries frecuentes
CREATE INDEX idx_estudiantes_establecimiento 
  ON estudiantes(id_establecimiento);

CREATE INDEX idx_solicitudes_fecha 
  ON solicitudes(fecha);

CREATE INDEX idx_solicitudes_estudiante 
  ON solicitudes(id_estudiante);

CREATE INDEX idx_usuarios_establecimiento 
  ON usuarios(id_establecimiento);
```

---

## 📊 FASE 2: MIGRACIÓN DE DATOS

### Paso 2.1: Exportar Datos de Firebase

```bash
# Instalar Firebase CLI si no está
npm install -g firebase-tools

# Login a Firebase
firebase login

# Exportar cada colección a JSON
firebase firestore:export ./firebase_backup --project=sgj20161
```

### Paso 2.2: Script de Conversión Firebase → Supabase

Crear `scripts/migracion.js`:

```javascript
// Convertir documentos Firestore a filas PostgreSQL
const firestoreData = require('./firebase_backup/usuarios.json');
const converted = firestoreData.map(doc => ({
  id: doc.id,
  email: doc.email,
  id_establecimiento: doc.id_establecimiento,
  rol: doc.rol,
  nombre_completo: doc.nombre_completo,
  activo: doc.activo,
  created_at: new Date(doc.fecha_creacion).toISOString()
}));

console.log(JSON.stringify(converted));
```

### Paso 2.3: Importar en Supabase

```bash
# Convertir a CSV
node scripts/migracion.js > usuarios.csv

# Subir a Supabase desde UI o usando:
psql postgresql://[user]:[password]@[host]:5432/[database] \
  -c "COPY usuarios FROM STDIN CSV HEADER;" < usuarios.csv
```

---

## 💻 FASE 3: CAMBIOS EN CÓDIGO

### Paso 3.1: Crear `src/services/supabase.ts`

Reemplazar `firestore.ts` con equivalentes Supabase.

### Paso 3.2: Actualizar Imports

```typescript
// Antes:
import { obtenerUsuario } from '../services/firestore';

// Después:
import { obtenerUsuario } from '../services/supabase';
```

### Paso 3.3: Reemplazar Funciones Firestore

Ejemplo de conversión:

```typescript
// FIRESTORE (anterior):
export async function obtenerUsuario(uid: string): Promise<Usuario | null> {
  const ref = doc(db, 'usuarios', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Usuario) : null;
}

// SUPABASE (nuevo):
export async function obtenerUsuario(uid: string): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', uid)
    .single();
  
  if (error) return null;
  return data as Usuario;
}
```

### Paso 3.4: Cambiar Autenticación

```typescript
// FIRESTORE:
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

// SUPABASE:
import { supabase } from '../lib/supabase';

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}
```

### Paso 3.5: Crear `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Paso 3.6: Actualizar `.env` / `.env.local`

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 🧪 FASE 4: TESTING

### Paso 4.1: Setup Ambiente de Testing

```bash
# Crear/.copy proyecto en Supabase para testing
# NO usar base de datos de producción
```

### Paso 4.2: Checklist de Testing

- [ ] Login de usuario funciona
- [ ] Crear estudiante funciona
- [ ] Ver lista de estudiantes (cache funciona)
- [ ] Registrar ausencia funciona
- [ ] Cambiar estado (vigente/no vigente) funciona
- [ ] Ver histórico funciona
- [ ] Filtros funcionan
- [ ] Paginación funciona
- [ ] Modal de vista previa funciona
- [ ] Permisos RLS funcionan (usuario solo ve su data)
- [ ] Admin ve todos los datos
- [ ] Logout funciona

### Paso 4.3: Performance Testing

```bash
# Comparar Firebase vs Supabase
# - Tiempo carga inicial
# - Tiempo queries
# - Tamaño datos en cache
```

---

## 🚀 FASE 5: CUTOVER (Cambio en Producción)

### Paso 5.1: Backup Previa

```bash
# Última exportación de Firebase
firebase firestore:export ./firebase_backup_final --project=sgj20161
```

### Paso 5.2: Cambio en Vivo

1. Cambiar `.env` a apuntar a Supabase producción
2. Deployar a Vercel (siguiente plan)
3. Monitorear logs por errores
4. Tener equipo disponible para rollback en 1 hora

### Paso 5.3: Monitoreo Post-Cambio

- ✅ Verificar logins
- ✅ Verificar lecturas de datos
- ✅ Verificar escrituras
- ✅ Verificar permisos
- ✅ Revisar Supabase logs por errores

### Paso 5.4: Mantenimiento

- Guardar solo último backup de Firebase por 1 mes
- Documentar mapeo de funciones
- Actualizar documentación del proyecto

---

## 📝 TIMELINE ESTIMADO

| Fase | Duración | Inicio |
|---|---|---|
| 1. Configuración | 2-3 horas | Día 1 |
| 2. Migración datos | 1-2 horas | Día 1 |
| 3. Cambios código | 8-10 horas | Días 2-3 |
| 4. Testing | 4-6 horas | Día 4 |
| 5. Cutover | 1-2 horas | Día 5 |
| **TOTAL** | **16-23 horas** | |

---

## ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Datos corrupted en migración | Media | Script validación antes/después |
| Permisos RLS incorrectos | Media | Testing exhaustivo de permisos |
| Performance inferior | Baja | Índices, query optimization |
| Downtime | Baja | Rollback plan (máx 1 hora) |
| Usuarios no pueden login | Media | Testing de auth antes cutover |

---

## ✅ DEPENDENCIAS

- ✅ Supabase CLI instalado
- ✅ Firebase CLI instalado
- ✅ Node.js 18+
- ✅ PostgreSQL conhecimento basic
- ✅ Ambiente staging configurado

---

**PRÓXIMO PASO:** Iniciar Fase 1 cuando confirmes.
