# Guía de Migración: Firebase → Supabase

## Estado Actual de la Migración

### ✅ Completado

Se han creado/modificado los siguientes archivos:

1. **`src/services/supabaseAuth.ts`** - Servicio de autenticación con Supabase
2. **`src/services/supabaseDB.ts`** - Servicio de base de datos con Supabase
3. **`src/hooks/useAuth.ts`** - Actualizado para usar Supabase Auth
4. **`src/pages/Login.tsx`** - Actualizado para login con Google OAuth
5. **`src/AppContent.tsx`** - Actualizado para cierre de sesión con Supabase
6. **`src/lib/supabase.ts`** - Cliente Supabase (ya existía)

---

## Pasos para Completar la Migración

### 1. Configurar Supabase en el Dashboard

1. Accede a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: `iyxubvtfhcmlivivdfpt`
3. Ve a **Authentication** → **Providers**
4. Habilita **Google**:
   - Client ID: `861405941605-...` (de Firebase actual)
   - Client Secret: Necesitas crear uno en Google Cloud Console
   - Authorized redirect URI: `https://iyxubvtfhcmlivivdfpt.supabase.co/auth/v1/callback`

### 2. Ejecutar Scripts SQL en Supabase

Ejecuta los scripts SQL en el orden indicado:

1. **`SQL_SUPABASE_CREAR_TABLAS.sql`** - Crear todas las tablas
2. **`SQL_SUPABASE_RLS_FINAL.sql`** - Configurar políticas de seguridad (RLS)

### 3. Migrar Datos desde Firebase

Opciones:

**A) Usar scripts de migración existentes:**
- `SQL_SUPABASE_FASE3_MIGRACION_DATOS.sql`

**B) Exportar/Importar manualmente:**
1. Exporta datos desde Firestore (Firebase Console)
2. Importa a Supabase (SQL Editor o CSV)

### 4. Actualizar Servicios de Base de Datos (Opcional)

Si deseas usar Supabase directamente en lugar de Firestore:

1. Crea un archivo `src/services/supabaseData.ts` que importe de `supabaseDB.ts`
2. Actualiza los componentes para usar las nuevas funciones
3. Ejemplo de uso:

```typescript
import { obtenerEstudiantesDelEstablecimiento } from '../services/supabaseDB';

// En lugar de:
import { obtenerEstudiantesDelEstablecimiento } from '../services/firestore';
```

### 5. Configurar Variables de Entorno

El archivo `.env.local` ya tiene las variables configuradas:

```
VITE_SUPABASE_URL=https://iyxubvtfhcmlivivdfpt.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XkxWTTJrOAq0rNXbTLL0ew_4g-HcMBt
```

**Nota:** La anon key que tienes es de ejemplo. Verifica que sea la correcta desde Supabase Dashboard → Settings → API

### 6. Probar la Aplicación

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Verifica el flujo de login:
   - Click en "Continuar con Google"
   - Debe redirigir a Google OAuth
   - Después del login, debe redirigir de vuelta a la app

3. Verifica el cierre de sesión

---

## Configuración de Google OAuth en Supabase

### Paso 1: Obtener credentials de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto (sgj20161)
3. Ve a **APIs & Services** → **Credentials**
4. Crea un **OAuth 2.0 Client ID**
5. Configura:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`, `https://tu-dominio.com`
   - Authorized redirect URIs: `https://iyxubvtfhcmlivivdfpt.supabase.co/auth/v1/callback`

### Paso 2: Configurar en Supabase

1. Supabase Dashboard → Authentication → Providers → Google
2. Ingresa:
   - Client ID: (del paso 1)
   - Client Secret: (del paso 1)
3. Guardar

---

## Solución de Problemas

### Error: "Invalid login credentials"

- Verifica que el usuario existe en Supabase Auth
- Si usas OAuth, asegúrate que Google provider esté habilitado

### Error: "Redirect URL mismatch"

- Verifica que la URL de redirect en Supabase coincida con la configuración de Google

### Error: "RLS policy denied"

- Verifica que las políticas RLS estén configuradas en Supabase
- Ejecuta `SQL_SUPABASE_RLS_FINAL.sql`

### Error: Tables not found

- Ejecuta `SQL_SUPABASE_CREAR_TABLAS.sql` en el SQL Editor de Supabase

---

## Estructura de Tablas en Supabase

```
establecimientos
  - id (UUID, PK)
  - nombre (TEXT)
  - codigo (TEXT)
  - region (TEXT)
  - activo (BOOLEAN)

usuarios
  - id (UUID, PK)
  - uid (TEXT, UNIQUE)
  - email (TEXT, UNIQUE)
  - nombre_completo (TEXT)
  - rol (TEXT)
  - id_establecimiento (UUID, FK)
  - activo (BOOLEAN)

estudiantes
  - id (UUID, PK)
  - id_estudiante (TEXT, UNIQUE)
  - nombre_completo (TEXT)
  - email (TEXT)
  - curso (TEXT)
  - id_establecimiento (UUID, FK)
  - activo (BOOLEAN)

bloques_horarios
  - id (UUID, PK)
  - id_bloque (TEXT, UNIQUE)
  - nombre_bloque (TEXT)
  - hora_inicio (TIME)
  - hora_fin (TIME)
  - orden (INTEGER)
  - id_establecimiento (UUID, FK)
  - activo (BOOLEAN)

motivos_justificacion
  - id (UUID, PK)
  - codigo (TEXT, UNIQUE)
  - descripcion (TEXT)
  - requiere_respaldo (BOOLEAN)
  - activo (BOOLEAN)

solicitudes
  - id (UUID, PK)
  - id_solicitud (TEXT, UNIQUE)
  - id_estudiante (TEXT)
  - id_profesor (UUID, FK)
  - tipo (TEXT)
  - estado (TEXT)
  - fecha (DATE)
  - hora (TEXT)
  - id_bloque (TEXT)
  - curso (TEXT)
  - id_establecimiento (UUID, FK)
  - motivo_codigo (TEXT)
  - motivo_descripcion (TEXT)
```

---

## Siguientes Pasos Recomendados

1. **Probar autenticación** con usuarios existentes
2. **Migrar datos** de Firestore a Supabase
3. **Actualizar servicios** para usar Supabase DB (opcional)
4. **Desactivar Firebase** cuando la migración esté completa

---

## Soporte

Si tienes problemas con la migración, revisa:

- Consola del navegador (F12) para errores
- Supabase Dashboard → Logs para errores de autenticación
- Firebase Console para verificar datos existentes
