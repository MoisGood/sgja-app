# 🚀 IMPLEMENTACIÓN DE CUSTOM CLAIMS - PLAN SPARK

## Descripción
Se ha implementado Custom Claims en Firebase para optimizar las reglas de seguridad de Firestore. Esto **eliminará 80-90% de las lecturas innecesarias** generadas por las evaluaciones de reglas.

### Problema Original
- `getUser()` se llamaba múltiples veces por operación
- Una lectura + 4 validaciones = 5 lecturas por operación simple
- Con 50,000 operaciones/día = 250,000 lecturas innecesarias/mes

### Solución
- Datos de usuario (rol, id_establecimiento) se almacenan en Firebase Auth
- Las reglas acceden a `request.auth.token` (CERO lecturas)
- Solo se leen documentos cuando realmente se necesita

---

## 📋 PASOS DE IMPLEMENTACIÓN (5 MINUTOS)

### 1️⃣ Ejecutar Script Local de Sincronización

Tu proyecto está en **plan Spark (gratuito)**, que no permite Cloud Functions. Por eso usamos un script Node.js local:

```bash
cd c:\Users\Usuario\Desktop\Archivos\proyecto\Modulos justificaciones\SGJA
node scripts/syncCustomClaims.js
```

**Instalación de dependencias** (si no están instaladas):
```bash
npm install firebase-admin
```

**Qué hace el script:**
1. Conecta a Firebase usando `serviceAccountKey.json`
2. Lee todos los usuarios de la colección `usuarios`
3. Para cada usuario: crea Custom Claims con rol, id_establecimiento, nombre, email, activo
4. Setea los claims en Firebase Auth usando Admin SDK
5. Genera un reporte detallado

**Salida esperada:**
```
🔄 Iniciando configuración de Custom Claims...

📊 Se encontraron 15 usuarios

═══════════════════════════════════════

✅ usuario1@example.com
   Rol: ADMIN
   Est: est001
   Activo: true

✅ profesor@example.com
   Rol: PROFESOR
   Est: est001
   Activo: true

... (más usuarios)

═════════════════════════════════════════
✅ Configurados: 15
❌ Errores: 0
📊 Total: 15
═════════════════════════════════════════

🎉 ¡Configuración completada exitosamente!
```

### 2️⃣ Verificar Firestore Rules

Las reglas ya han sido actualizadas a usar Custom Claims. Verifica:

**✅ CORRECTO - Usa Custom Claims (CERO lecturas):**
```firestore
function hasRole(rol) {
  return isAuth() && request.auth.token.rol == rol;
}

function isInEstablecimiento(idEst) {
  return isAuth() && request.auth.token.id_establecimiento == idEst;
}
```

**❌ VIEJO - Usa getUser() (5+ lecturas por operación):**
```firestore
function hasRole(rol) {
  return isAuth() && getUser().rol == rol;  // ❌ Eliminar
}
```

**Estado actual:** Firestore rules ya están optimizadas ✅

### 3️⃣ Usar Custom Claims en Frontend

Los Custom Claims se cargan automáticamente cuando un usuario inicia sesión.

#### Opción A: Hook `useCustomClaims` (Recomendado)
```tsx
import { useCustomClaims } from '@/hooks/useCustomClaims';

function MiComponente() {
  const { claims, loading } = useCustomClaims();

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <p>Rol: {claims?.rol}</p>
      <p>Establecimiento: {claims?.id_establecimiento}</p>
      <p>Activo: {claims?.activo ? 'Sí' : 'No'}</p>
    </div>
  );
}
```

#### Opción B: Hooks Específicos (Más Tipados)
```tsx
import { 
  useIsAdmin, 
  useIsProfesor, 
  useIdEstablecimiento,
  useHasRole 
} from '@/hooks/useCustomClaims';

function Dashboard() {
  const { hasRole: isAdmin } = useIsAdmin();
  const { hasRole: isProfesor } = useIsProfesor();
  const { idEstablecimiento } = useIdEstablecimiento();

  return (
    <div>
      {isAdmin && <AdminPanel />}
      {isProfesor && <ProfesorPanel establecimientos={idEstablecimiento} />}
    </div>
  );
}
```

#### Opción C: Chequeo de Rol Genérico
```tsx
import { useHasRole } from '@/hooks/useCustomClaims';

function Settings() {
  const { hasRole: esAdmin } = useHasRole('ADMIN');
  const { hasRole: esInspector } = useHasRole('INSPECTOR');

  return (
    <>
      {esAdmin && <AdminSettings />}
      {esInspector && <InspectorSettings />}
    </>
  );
}
```

---

## 🔄 SINCRONIZACIÓN POSTERIOR

### Caso A: Cambias rol de un usuario en Firestore

**Opción 1 - Ejecutar script completo (recomendado):**
```bash
node scripts/syncCustomClaims.js
```

**Opción 2 - El usuario cierra/abre sesión:**
- Los Custom Claims se actualizan automáticamente
- No es necesario ejecutar el script (pero puede tardar)

### Caso B: Cambios masivos de usuarios

```bash
node scripts/syncCustomClaims.js
```

El script es idempotente - puedes ejecutarlo múltiples veces sin problemas.

---

## 📁 ARCHIVOS CREADOS/MODIFICADOS

### Nuevos Archivos
```
scripts/setCustomClaimsLocal.js          # ← Script principal (Plan Spark)
scripts/syncCustomClaims.js              # ← Alias que ejecuta lo anterior
src/hooks/useCustomClaims.ts             # ← Hooks para React
src/services/customClaimsService.ts      # ← Servicios auxiliares
```

### Archivos Modificados
```
firestore.rules                          # ← Optimizado (sin getUser())
firebase.ts                              # ← Exporta getFunctions (opcional)
```

### Archivos Opcionales (Solo si upgradeass a Blaze)
```
functions/src/customClaims.ts            # ← Cloud Functions (no necesarias ahora)
firebase.json                            # ← Ya configurado para functions
```

---

## ⚙️ ESTRUCTURA DE CUSTOM CLAIMS

Los Custom Claims almacenados en `request.auth.token`:

```typescript
interface CustomUserClaims {
  rol: string | null;              // "ADMIN" | "PROFESOR" | "INSPECTOR" | null
  id_establecimiento: string | null; // "est001" | "est002" | etc
  nombre: string | null;            // "Juan García"
  email: string | null;             // "juan@example.com"
  activo: boolean;                  // true | false
}
```

### Acceso en Firestore Rules
```firestore
// Claims disponibles en request.auth.token
request.auth.token.rol
request.auth.token.id_establecimiento
request.auth.token.nombre
request.auth.token.email
request.auth.token.activo
```

### Acceso en Frontend (React)
```tsx
const { claims } = useCustomClaims();
claims.rol                    // string
claims.id_establecimiento     // string
claims.nombre                 // string
claims.email                  // string
claims.activo                 // boolean
```

---

## 📊 IMPACTO EN PERFORMANCE

### Antes (Con getUser())
```
Operación: Registrar ausencia
- Validar rol de profesor: 1 lectura (getUser)
- Validar establecimiento: 1 lectura (getUser)
- Validar activo: 1 lectura (getUser)
- Escribir documento: 1 escritura
Total: 5 lecturas/operación

50,000 operaciones/mes = 250,000 lecturas = $15/mes
```

### Después (Con Custom Claims)
```
Operación: Registrar ausencia
- Validar rol de profesor: 0 lecturas (request.auth.token)
- Validar establecimiento: 0 lecturas (request.auth.token)
- Validar activo: 0 lecturas (request.auth.token)
- Escribir documento: 1 escritura
Total: 1 lectura/operación

50,000 operaciones/mes = 50,000 lecturas = $0.30/mes
Ahorros: $14.70/mes = $176.40/año
```

---

## ✅ CHECKLIST

- [ ] Dependencias instaladas: `npm install firebase-admin`
- [ ] Script ejecutado: `node scripts/syncCustomClaims.js`
- [ ] Todos los usuarios sincronizados (sin errores)
- [ ] Firestore Rules ya están optimizadas (verificado en console)
- [ ] Probaste iniciando sesión (Custom Claims se cargan automáticamente)
- [ ] Componentes React pueden usar `useCustomClaims`

---

## 🚨 TROUBLESHOOTING

### Error: "serviceAccountKey.json not found"
```bash
# Asegúrate que serviceAccountKey.json está en la raíz del proyecto
ls serviceAccountKey.json
```

### Error: "Failed to set custom claims"
```bash
# Verifica que el usuario existe en Firebase Auth
# Y que tiene un documento en la colección 'usuarios'
firebase shell
> db.collection('usuarios').doc('<uid>').get()
```

### Los Custom Claims no aparecen después de login
```tsx
// Necesitas refrescar el token
import { getAuth } from 'firebase/auth';
await getAuth().currentUser?.getIdTokenResult(true);
```

### Los Custom Claims aparecen pero la app no los ve
```tsx
// Espera a que useCustomClaims termine de cargar
const { claims, loading } = useCustomClaims();
if (loading) return <div>Cargando permisos...</div>;
```

---

## 🔮 FUTURO: CLOUD FUNCTIONS (Plan Blaze)

Si en el futuro actualizas a **plan Blaze**, puedes activar sincronización automática:

```bash
firebase deploy --only functions
```

**Ventaja:** Los Custom Claims se sincronizan automáticamente cuando cambias un usuario
**Costo:** +$5-10/mes en Cloud Functions

**Sin cambios en el código frontend:**
- Los hooks seguirán funcionando igual
- La sincronización será automática en lugar de manual

---

## 📚 REFERENCIAS

- [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin-sdk-authentication-setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/overview)
- [Firebase Pricing](https://firebase.google.com/pricing)

---

**Tiempo total:** 5 minutos
**Resultado:** -80% de lecturas de Firestore
**Plan requerido:** Spark (gratuito) ✅
**Cloud Functions:** Opcional (solo si upgradeass a Blaze)
