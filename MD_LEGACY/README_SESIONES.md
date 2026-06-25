# 📊 SOLUCIÓN COMPLETA: Detección de Desconexiones Brusas

## Problema Original
**Usuario reportó**: `soportetipresente@gmail.com` aparecía 12 veces conectado en vez de 1

**Causas identificadas**:
1. ❌ Sesiones se creaban nuevamente cada página load (no había reutilización)
2. ❌ Sin detección de desconexiones brusas (navegador cerrado)
3. ❌ Sin forma de identificar sesiones "muertas" (fantasmas)

---

## Solución Implementada

### ✅ PARTE 1: Reutilizar Sesiones (COMPLETADO)
```typescript
// src/services/online.ts

// Ahora al conectar:
// 1. Verifica si ya existe sesión en el mismo dispositivo
// 2. Si existe → REUTILIZA (actualiza timestamps)
// 3. Si no → CREA nueva sesión
```
**Beneficio**: El usuario aparece 1 sola vez conectado

---

### ✅ PARTE 2: Monitorear Actividad (COMPLETADO)
```typescript
// src/hooks/useSessionActivity.ts

// Cada 30 segundos: envía HEARTBEAT
// Cada 5 minutos: actualiza ÚLTIMA ACTIVIDAD
// Detecta: mouse, teclado, scroll, touch
```

| Timestamp | Actualización | Frecuencia |
|-----------|--------------|-----------|
| `timestamp_heartbeat` | "Estoy vivo" | 30 seg |
| `timestamp_ultima_actividad` | "Estoy usando la app" | 5 min (si hay actividad) |

---

### ✅ PARTE 3: Mostrar Estado en Seguridad Tab (COMPLETADO)
```
SEGURIDAD → Sesiones Activas / Inactivas
- Usuario puede cerrar manualmente cualquier sesión
- Ver detalles: dispositivo, IP, navegador, SO, tiempo de conexión, última actividad
```

---

### ⚠️ PARTE 4: Cierre Automático (REQUIERE BLAZE)

#### Opción A: Cloud Function (Requiere Plan Blaze)
```typescript
// functions/src/closeInactiveSessions.ts
// Ejecuta cada 10 minutos
// Cierra sesiones que NO tienen heartbeat > 5 min
// = Detecta navegadores cerrados automáticamente
```
**Costo**: ~$2-5 USD/mes

#### Opción B: Sin Cloud Function (ACTUAL - RECOMENDADO PARA AHORA)
```typescript
// Cerrar inactivas al abrir Seguridad tab
// O cada 10 minutos desde AppContent
// Sin costo adicional
```

---

## Flujo Visual Completo

```
USUARIO INICIA SESIÓN
    ↓
registrarInicio()
    ├─ ¿Existe sesión en este dispositivo?
    │  ├─ SÍ → Reutilizar + actualizar timestamps
    │  └─ NO → Crear nueva sesión
    ↓
Sesión creada/reutilizada
    ├─ estado: "conectado"
    ├─ timestamp_inicio
    ├─ timestamp_heartbeat ← NUEVO
    └─ timestamp_ultima_actividad ← NUEVO
    ↓
USUARIO NAVEGANDO LA APP
    ├─ Cada 30 seg → enviarHeartbeat() ✓
    ├─ Cada 5 min → actualizarActividadSesion() ✓
    └─ Timestamps se actualizan en Firestore
    ↓
TRES POSIBLES FINALES:

[1] LOGOUT NORMAL
    └─ Botón Cerrar Sesión
    └─ registrarCierre()
    └─ estado: "desconectado"

[2] EXPIRA TIMEOUT (30 min defecto)
    └─ Usuario no interactúa
    └─ En Seguridad tab → aparece como "inactivo"
    └─ Botón "Cerrar sesiones inactivas"
    └─ estado: "desconectado"

[3] NAVEGADOR CERRADO (SIN LOGOUT)
    └─ App se cierra sin ejecutar cerrarCierre()
    └─ Heartbeat DEJA de llegar
    └─ Cloud Function detecta (cada 10 min):
    │   └─ "No hay heartbeat > 5 min"
    │   └─ Cierra automáticamente
    │   └─ estado: "desconectado"
    └─ SIN Cloud Function:
        └─ Heartbeat falta se visible en Firestore
        └─ Manual: Admin abre Seguridad → cierra
```

---

## Cambios en Firestore Schema

### Nuevo Campo: `timestamp_heartbeat`
```json
{
  "timestamp_heartbeat": "2026-03-31T13:25:00Z"  // Se actualiza cada 30 seg
}
```

### Nuevo Campo: `timestamp_ultima_actividad`
```json
{
  "timestamp_ultima_actividad": "2026-03-31T13:30:00Z"  // Se actualiza cada 5 min
}
```

### Nuevo Campo: `razon_cierre` (agregado por Cloud Function)
```json
{
  "razon_cierre": "Sin heartbeat > 5 min (navegador cerrado)"
}
```

---

## Características de la Solución

| Característica | Estado | Costo |
|---|---|---|
| Reutilizar sesiones por dispositivo | ✅ Completo | $0 |
| Detectar actividad del usuario | ✅ Completo | $0 |
| Heartbeat cada 30 seg | ✅ Completo | $0 |
| Mostrar sesiones en Seguridad tab | ✅ Completo | $0 |
| Cerrar manual desde UI | ✅ Completo | $0 |
| Cloud Function (cierre automático) | ⚠️ Implementada* | $2-5/mes* |
| Detectar navegadores cerrados | ⚠️ Heartbeat + Cloud Fn* | $2-5/mes* |

*Cloud Function está en código, lista para desplegar. Requiere upgrade a plan Blaze.

---

## Cómo Funciona Ahora (Sin Cloud Function)

### Scenario 1: Usuario normal (interactúa constantemente)
```
10:00 AM - Login
  ✓ timestamp_heartbeat = 10:00
  ✓ timestamp_ultima_actividad = 10:00
  
10:00:30 - Hace click
  ✓ timestamp_heartbeat = 10:00:30
  ✓ timestamp_ultima_actividad = 10:00
  
10:05:30 - Escriba en input
  ✓ timestamp_heartbeat = 10:05:30
  ✓ timestamp_ultima_actividad = 10:05:30
  
... continúa usando la app ...
→ Sesión se mantiene CONECTADA
```

### Scenario 2: Usuario deja la app abierta sin usar (30 min)
```
10:00 AM - Login
10:00 - timestamp_ultima_actividad = 10:00

10:30 AM - NO HA INTERACTUADO EN 30 MIN
  ✓ timestamp_heartbeat = 10:30:30 (sigue llegando!)
  ✗ timestamp_ultima_actividad = 10:00 (NO se actualiza)
  
→ En Seguridad tab: "Sesión inactiva: 30+ minutos"
→ Admin puede cerrar manualmente
→ O timeout automático del cliente
```

### Scenario 3: NAVEGADOR CERRADO (el problema)
```
10:00 AM - Login
10:00 - Heartbeat enviado

10:30 AM - Usuario CIERRA NAVEGADOR ❌
  ← NO HAY MÁS HEARTBEAT
  ← NO HAY MÁS ACTIVIDAD
  
10:35 AM - Se abre en otra pestaña/dispositivo
  → Firestore muestra "conectado" pero:
    - timestamp_heartbeat = 10:00 (hace 35 min!)
    - timestamp_ultima_actividad = 10:00 (hace 35 min!)
    
  → En Seguridad tab: Ve que es "fantasma"
  → Botón: "Cerrar sesiones muertas" 
  → Ejecuta: cerrarSesionesInactivasAvanzado()
  → Cierra automáticamente
  
CON CLOUD FUNCTION (Blaze):
  → A los 10 minutos: Cloud Function detecta
  → Sin heartbeat > 5 minutos = MUERTA
  → La cierra automáticamente (sin intervención)
```

---

## Archivos Modificados / Creados

### ✅ Modificados
- `src/services/online.ts` - Agregadas funciones heartbeat
- `src/hooks/useSessionActivity.ts` - Ahora envía heartbeat cada 30 seg
- `firebase.json` - Configuración para Cloud Functions
- `src/pages/Seguridad.tsx` - Ya mostraba sesiones, ahora más info

### ✅ Creados (Cloud Functions - Listos para Blaze)
- `functions/src/closeInactiveSessions.ts` - Cloud Function principal
- `functions/src/index.ts` - Exportar Cloud Functions
- `functions/package.json` - Dependencias
- `functions/tsconfig.json` - Config TypeScript
- `functions/.gitignore` - Ignorar archivos

### 📄 Documentación
- `DESCONEXIONES_BRUSAS.md` - Explicación completa del problema
- `SOLUCIONES_ALTERNATIVAS.ts` - Código para cerrar sesiones sin Cloud Function
- Este archivo (resumen visual)

---

## Próximos Pasos (Opcionales)

### Si quieres máximo control automático (RECOMENDADO)
1. Upgrade a plan Blaze en Firebase Console
2. Ejecutar: `firebase deploy --only functions`
3. Cloud Function comienza a ejecutarse cada 10 minutos
4. Sesiones sin heartbeat se cierran automáticamente

### Si mantienes plan Spark (ACTUAL)
1. Sistema funciona pero sin cierre automático
2. Heartbeat se envía cada 30 segundos
3. En Seguridad tab puedes ver sesiones "muertas"
4. Cierre manual o automático al abrir Seguridad

### Mejoras futuras
- [ ] Notificación por email cuando sesión se cierra por inactividad
- [ ] Historial de sesiones (tabla `sesion_logs`)
- [ ] Dashboard de estadísticas de sesiones
- [ ] Detector de ubicación geográfica para alertas
- [ ] Confirmación de identidad para reactivar sesión

---

## Testing Manual

### Verificar Heartbeat
```
1. Abrir app
2. Firestore Console → colección "online"
3. Ver documento con estado: "conectado"
4. Observar timestamp_heartbeat
5. Esperar 30 segundos
6. Debe actualizarse automáticamente ✓
```

### Simular Cierre de Navegador
```
1. Login en navegador
2. Ir a Seguridad → Ver sesión activa
3. Cerrar navegador COMPLETAMENTE (no tab, ventana)
4. Esperar 5-10 minutos
5. Abrir desde otra ventana/dispositivo
6. Ir a Seguridad → "Sesiones Inactivas"
7. Ver sesión anterior como inactiva
8. Click "Cerrar inactivas" → Desaparece
```

### Verificar Reutilización
```
1. Login en dispositivo A
2. Seguridad → Ver 1 sesión activa
3. Cerrar sesión
4. Volver a login (mismo dispositivo)
5. Seguridad → Ver 1 sesión activa (REUTILIZADA, no nueva)
```

---

## Conclusión

✅ **Problema resuelto**: Usuario ya no aparece múltiples veces

✅ **Sistema robusto**: Detecta 3 tipos de desconexión

⚠️ **Pendiente**: Cloud Function requiere upgrade a Blaze para cierre automático

💡 **Recomendación**: Mantener Plan Spark por ahora, upgrade cuando haya más usuarios
