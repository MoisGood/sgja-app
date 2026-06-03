# ✅ CAMBIOS REALIZADOS - Sistema de Sesiones v2

## 🔄 Cambio Principal: EMAIL como ID único

### ❌ ANTES (Arquitectura antigua)
```
ID del documento: ${idUsuario}_${timestamp}
Resultado: MÚLTIPLES documentos por usuario (duplicados)

User 1:
  - document: user1_16807291234000
  - document: user1_16807291235000  ← DUPLICADO
  - document: user1_16807291236000  ← DUPLICADO
```

### ✅ AHORA (Arquitectura nueva)
```
ID del documento: email_usuario
Resultado: UN DOCUMENTO por usuario (sin duplicados)

user1@email.com:
  - document: user1@email.com (único)
  
Al cerrar → estado: "desconectado"
Al abrir → estado: "conectado"
```

---

## 📝 Lógica Nueva

### AL INICIAR SESIÓN (registrarInicio)
```typescript
1. ¿Existe documento con email = usuario.email?
   
   SÍ → Actualizar:
        - estado: "conectado"
        - timestamp_inicio: NOW()
        - timestamp_heartbeat: NOW()
        - timestamp_ultima_actividad: NOW()
        - Actualizar detalles del dispositivo
   
   NO → Crear documento:
        - email_usuario como ID
        - estado: "conectado"
        - Todos los fields inicializados
```

### AL CERRAR SESIÓN (registrarCierre)
```typescript
1. Buscar documento por email
2. Actualizar:
   - estado: "desconectado"
   - timestamp_fin: NOW()
```

### HEARTBEAT (enviarHeartbeat)
```typescript
1. Usar EMAIL como ID del documento
2. Actualizar:
   - timestamp_heartbeat: NOW()
   - timestamp_ultima_actividad: NOW()
```

### ACTIVIDAD (actualizarActividadSesion)
```typescript
1. Usar EMAIL como ID del documento
2. Actualizar:
   - timestamp_ultima_actividad: NOW()
```

---

## 🔧 Funciones Modificadas

### src/services/online.ts

#### `registrarInicio(idUsuario, nombreUsuario, emailUsuario, rolUsuario)`
**CAMBIO**: 
- Antes: Creaba new documento con ID timestamp
- Ahora: Busca documento por email, actualiza si existe, crea si no

**Lógica**:
```typescript
// Buscar por email
const docSnapshot = await getDocs(query(onlineCollection, where('email_usuario', '==', emailUsuario)));

if (docSnapshot.size > 0) {
  // EXISTE: actualizar a "conectado"
  await updateDoc(docRef, { estado: 'conectado', ... });
} else {
  // NO EXISTE: crear nuevo
  await setDoc(docRef, { estado: 'conectado', ... });
}
```

#### `registrarCierre(emailUsuario)`
**CAMBIO**:
- Antes: Recibía idUsuario, buscaba documento más reciente
- Ahora: Recibe emailUsuario, actualiza directo por email

**Lógica**:
```typescript
const docRef = doc(onlineCollection, emailUsuario);
await updateDoc(docRef, {
  estado: 'desconectado',
  timestamp_fin: serverTimestamp(),
});
```

#### `enviarHeartbeat(emailUsuario)`
**CAMBIO**:
- Antes: Buscaba sesión más reciente por id_usuario
- Ahora: Actualiza directamente usando email

#### `actualizarActividadSesion(emailUsuario)`
**CAMBIO**:
- Antes: Buscaba sesión más reciente por id_usuario
- Ahora: Actualiza directamente usando email

---

## 🔗 Cambios Relacionados

### src/AppContent.tsx
```typescript
// ANTES
await registrarCierre(usuario.uid);
useSessionActivity(usuario?.uid);

// AHORA
await registrarCierre(usuario.email);
useSessionActivity(usuario?.email || undefined);
```

### src/hooks/useSessionActivity.ts
```typescript
// ANTES
export function useSessionActivity(idUsuario: string | undefined) {
  // ... enviarHeartbeat(idUsuario)
  // ... actualizarActividadSesion(idUsuario)
}

// AHORA
export function useSessionActivity(email: string | undefined) {
  // ... enviarHeartbeat(email)
  // ... actualizarActividadSesion(email)
}
```

---

## 📊 Resultado

### ANTES (Problema)
```
Usuario: soportetipresente@gmail.com

Firestore (online):
  - document: user123_16807291234000 (estado: conectado)
  - document: user123_16807291235000 (estado: conectado) ← DUPLICADO
  - document: user123_16807291236000 (estado: conectado) ← DUPLICADO
  - ...
  
Resultado en UI: Usuario aparece 12 veces
```

### AHORA (Solución)
```
Usuario: soportetipresente@gmail.com

Firestore (online):
  - document: soportetipresente@gmail.com
    {
      id_usuario: "user123",
      email_usuario: "soportetipresente@gmail.com",
      estado: "conectado",
      timestamp_inicio: 2026-03-31T14:00:00Z,
      timestamp_fin: null,
      timestamp_heartbeat: 2026-03-31T14:30:00Z,
      timestamp_ultima_actividad: 2026-03-31T14:30:00Z,
      ...
    }

Resultado en UI: Usuario aparece 1 sola vez ✓
```

---

## ✅ Ventajas

1. **Sin duplicados**: ID = email = UN usuario = UN documento
2. **Más eficiente**: Sin queries complejas, acceso directo por email
3. **Más limpio**: Estructura simple y predecible
4. **Mejor rendimiento**: Sin búsquedas, acceso directo por clave primaria
5. **Fácil de escalar**: Estructura normalizada

---

## 🧪 Testing

### Caso 1: Primer login
```
1. Login con email@test.com
2. Firestore: Crea documento "email@test.com"
3. estado: "conectado" ✓
4. Heartbeat cada 30 seg
```

### Caso 2: Segundo login (mismo user, mismo dispositivo)
```
1. Logout email@test.com
2. Firestore: documento "email@test.com" → estado: "desconectado" ✓
3. Login nuevamente
4. Firestore: documento "email@test.com" → estado: "conectado" ✓
5. NO HAY DUPLICADO ✓
```

### Caso 3: Múltiples usuarios
```
Firestore (online):
  - documento: user1@test.com (conectado)
  - documento: user2@test.com (conectado)
  - documento: user3@test.com (desconectado)
  
SIN DUPLICADOS ✓
```

---

## 📋 Resumen de Archivos Modificados

```
✅ src/services/online.ts
   - Función registrarInicio() → búsqueda por email
   - Función registrarCierre() → actualización por email
   - Función enviarHeartbeat() → usa email
   - Función actualizarActividadSesion() → usa email
   - Removida: obtenerSesionExistente() (no necesaria)

✅ src/AppContent.tsx
   - cambio: registrarCierre(usuario.uid) → registrarCierre(usuario.email)
   - cambio: useSessionActivity(usuario?.uid) → useSessionActivity(usuario?.email || undefined)

✅ src/hooks/useSessionActivity.ts
   - cambio: parámetro idUsuario → email
   - cambio: enviarHeartbeat(idUsuario) → enviarHeartbeat(email)
   - cambio: actualizarActividadSesion(idUsuario) → actualizarActividadSesion(email)

✅ Compilación: OK
✅ Deployment: OK
```

---

## 🚀 Status

**Fecha**: 31 Marzo 2026, 14:30 UTC  
**Build**: ✅ Exitoso (1801 módulos)  
**Deployment**: ✅ Exitoso  
**URL**: https://sgj20161.web.app  

---

## 📌 Conclusión

**Problema original**: Usuario aparecía múltiples veces (duplicados)  
**Causa**: ID del documento incluía timestamp, permitía crear múltiples docs por user  
**Solución**: ID = email (clave única primaria)  
**Resultado**: UN usuario = UN documento (sin duplicados) ✓
