# Sistema de Detección de Desconexiones Brusas - Guía de Implementación

## Resumen de la Solución Implementada

Se ha implementado un **sistema híbrido de detección de sesiones** que cubre tres escenarios:

### 1. ✅ Usuario cierra sesión normalmente
**Estado**: COMPLETADO
- Usuario hace click en "Cerrar sesión"
- Código: `registrarCierre()` ejecutado
- Firestore: `estado: 'desconectado'` + `timestamp_fin`
- **Costo**: Ninguno (operación manual del usuario)

### 2. ✅ Usuario no cierra sesión (expira timer)
**Estado**: COMPLETADO
- Timer de inactividad vence (30 min default)
- Seguridad tab muestra sesiones inactivas
- Admin/usuario puede cerrar manualmente
- Código: `cerrarSesionesInactivas()` en Seguridad.tsx
- **Costo**: Ninguno (escrituras manuales del usuario)

### 3. ⚠️ Usuario cierra navegador/app SIN logout (EL PROBLEMA REAL)
**Estado**: PARCIALMENTE COMPLETADO + CLOUD FUNCTION LISTA

#### Problema
- App se cierra brutalmente (sin ejecutar `registrarCierre()`)
- Sesión queda como "conectado" en Firestore indefinidamente
- Usuario fantasma en el sistema

#### Solución Implementada: Heartbeat + Cloud Function

**A. CLIENTE (React) - ✅ COMPLETADO**
```typescript
// src/hooks/useSessionActivity.ts

// Cada 30 segundos: envía "latido" (heartbeat)
setInterval(() => {
  enviarHeartbeat(idUsuario);  // Actualiza timestamp_heartbeat
}, 30 * 1000);

// En archivo online.ts:
export async function enviarHeartbeat(idUsuario: string) {
  // Encuentra sesión más reciente conectada
  // Actualiza: timestamp_heartbeat: serverTimestamp()
}
```

**B. CLOUD FUNCTION - ⚠️ REQUIERE PLAN BLAZE (Desplegada pero no activa)**

Ubicación: `functions/src/closeInactiveSessions.ts`

```typescript
// Ejecuta automáticamente cada 10 minutos
// Cierrera todas las sesiones "conectadas" que:
// - NO han enviado heartbeat en los últimos 5 minutos
// - Razon: Navegador cerrado / App cerrada / Caída brusca

// Resultado:
- estado: 'desconectado'
- timestamp_fin: ahora
- razon_cierre: 'Inactividad: sin heartbeat detectado'
```

---

## Flujo Completo de Sesión

```
┌─────────────────────────────────────────────────────────┐
│                   USUARIO INICIA SESIÓN                 │
└──────────────────────────┬────────────────────────────────┘
                           │
                      registrarInicio()
                           │
                ┌──────────▼──────────┐
                │ Crear sesión nueva: │
                │ - estado: conectado │
                │ - timestamp_inicio  │
                │ - timestamp_heartbeat ◄── NUEVO
                │ - timestamp_ultima_actividad
                └──────────┬──────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │          Cada 30 segundos    Cada 5 minutos (con actividad)
        │                  │                  │
        │         enviarHeartbeat()  actualizarActividadSesion()
        │                  │                  │
        │         timestamp_heartbeat     timestamp_ultima_actividad
        │           actualizado              actualizado
        │
        └─────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   Cloud Function cada   │
              │        10 minutos       │
              │  (requiere plan Blaze)  │
              └────────────┬────────────┘
                           │
           Si NO heartbeat en 5 min:
                           │
                ┌──────────▼──────────┐
                │ Cierra sesión:      │
                │ - estado: desconectado
                │ - timestamp_fin     │
                │ - Razón: Sin HB     │
                └─────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   O: Usuario         O: Admin/Usuario   O: Cloud Function
   hace logout         desde Seguridad    automática
        │                  │                  │
        │         cerrarSesionesInactivas() │
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                      registrarCierre()
                           │
                ┌──────────▼──────────┐
                │ Cerrar sesión:      │
                │ - estado: desconectado
                │ - timestamp_fin     │
                └─────────────────────┘
                           │
                           ▼
                    FIN DE SESIÓN
```

---

## Cómo Completar la Solución (Activar Cloud Function)

### Opción 1: Actualizar a Plan Blaze (RECOMENDADO)
1. Ir a: https://console.firebase.google.com/project/sgj20161/usage/details
2. Hacer upgrade a "Blaze (pay-as-you-go)"
3. En terminal:
```powershell
cd "c:\ruta\proyecto\SGJA"
firebase deploy --only functions
```

**Costo estimado**: $2-5 USD/mes (para ejecutarse cada 10 minutos)

### Opción 2: Mantener Plan Spark (ACTUAL)
**Sin Cloud Function automática, pero funciona:**
- ✅ Heartbeat se envía cada 30 segundos desde cliente
- ✅ Seguridad tab muestra sesiones inactivas
- ✅ Admin puede cerrar manualmente desde UI
- **Ventaja**: Sin costo adicional
- **Desventaja**: Sesiones "muertas" no se cierran automáticamente

### Opción 3: Híbrido (RECOMENDADO SIN COSTO)
Cerrar sesiones inactivas **al abrir Seguridad tab**:

```typescript
// En Seguridad.tsx - al cargar la página

useEffect(() => {
  if (usuario?.uid) {
    // Al abrir Seguridad, auto-cierra sesiones inactivas
    cerrarSesionesInactivasAuto(usuario.uid, minutosInactividad);
  }
}, [usuario?.uid]);
```

---

## Campos Firestore Utilizados

En colección `online`:

```
{
  id: string,                          // ID documento (idUsuario_timestamp)
  id_usuario: string,                   // UID Firebase
  nombre_usuario: string,
  email_usuario: string,
  rol_usuario: string,
  
  // Dispositivo
  tipo_dispositivo: string,            // 'mobile', 'desktop', 'web'
  id_dispositivo: string,              // Hash del dispositivo (browser, SO, IP, etc)
  navegador: string,
  sistema_operativo: string,
  ip_cliente: string,
  
  // Sesión
  estado: 'conectado' | 'desconectado',
  timestamp_inicio: Timestamp,
  timestamp_fin?: Timestamp,
  
  // NUEVO: Actividad del usuario
  timestamp_ultima_actividad?: Timestamp,  // Se actualiza cada 5 min si hay actividad
  
  // NUEVO: Latido (heartbeat)
  timestamp_heartbeat?: Timestamp,        // Se actualiza cada 30 seg automáticamente
  
  // Opcional (agregado por Cloud Function)
  razon_cierre?: string,                  // 'Logout manual', 'Inactividad: sin heartbeat'
}
```

---

## Cambios Implementados

### 1. src/services/online.ts
- ✅ Agregada función `enviarHeartbeat()`
- ✅ Campo `timestamp_heartbeat` en interfaz `UsuarioOnline`
- ✅ Campo `timestamp_heartbeat` en documento al crear sesión
- ✅ Actualizar heartbeat en listener

### 2. src/hooks/useSessionActivity.ts
- ✅ Ahora envía heartbeat cada 30 segundos
- ✅ Detecta actividad (mouse, teclado, scroll, touch)
- ✅ Actualiza `timestamp_ultima_actividad` cada 5 minutos

### 3. functions/ (NUEVA CARPETA)
- ✅ Cloud Function scheduled: Cierra sesiones sin heartbeat cada 10 min
- ✅ Cloud Function HTTP: API para cerrar manual (opcional)
- ✅ Requiere plan Blaze para desplegar

### 4. firebase.json
- ✅ Agregada configuración de Cloud Functions

---

## Testing Manual

### Simular Cierre de Navegador
1. Abrir app en navegador
2. Ver Seguridad > Sesiones Activas (debe estar "conectado")
3. Cerrar navegador **SIN logout**
4. Esperar 5-10 minutos
5. Opción A: Cloud Function cierra automáticamente
6. Opción B: Abrir desde otra pestaña, ir a Seguridad > cierra manual

### Verificar Heartbeat
1. Abrir Firestore Console
2. Ir a colección `online`
3. Ver documento con `estado: 'conectado'`
4. Cada 30 segundos debe actualizar `timestamp_heartbeat`
5. Si no se actualiza = navegador cerrado

---

## Próximos Pasos (Opcionales)

1. **Activar Cloud Function** (Upgrade a Blaze)
   - Costo: ~$2-5/mes
   - Beneficio: Cierre automático de sesiones muertas

2. **Notificaciones** (Email cuando sesión se cierra por inactividad)
   - Puede agregarse en Cloud Function

3. **Logs detallados** (Historial de cierres por inactividad)
   - Agregar tabla `sesion_logs` con razón de cierre

4. **UI Mejorado** (Mostrar "Última actividad" en tiempo real)
   - Agregar contador regresivo en Seguridad tab

---

## Resumen Final

| Escenario | Estado | Método | Costo |
|-----------|--------|--------|-------|
| Logout normal | ✅ Completo | Manual usuario | $0 |
| Expira sesión | ✅ Completo | Manual (Seguridad tab) | $0 |
| **Cierre brusco** | ⚠️ Listo | Heartbeat → Cloud Function* | $2-5/mes* |

*Cloud Function requiere Blaze plan. Sin activar: heartbeat se envía pero no se cierra automáticamente.

**Recomendación**: Mantener Plan Spark por ahora. Si aumentan usuarios, upgrade a Blaze.
