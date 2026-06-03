# 📌 RESPUESTA A TU PREGUNTA: Desconexiones Brusas

## Tu Pregunta Original

> "Cuando el usuario cierra el navegador o la app, ese usuario sigue activo por ende el sistema no sabe nada acerca de ese usuario. ¿Cómo podemos solucionar esto?"

---

## 🔴 EL PROBLEMA

### Situación Actual sin Heartbeat
```
10:00 AM - Usuario login
           estado: "conectado"
           
10:15 AM - USUARIO CIERRA NAVEGADOR ❌
           (Sin ejecutar logout)
           
Firestore:
           estado: "conectado"  ← ¡INCORRECTO!
           
Resultado: Usuario fantasma en el sistema
```

### ¿Por qué sucede?
```
Logout normal:
  Click → registrarCierre() → estado="desconectado" ✓

Cierre brusco:
  Navegador cierra → Nada se ejecuta ✗
  Session muere en el cliente
  Pero en Firestore sigue conectado
```

---

## ✅ LA SOLUCIÓN: HEARTBEAT

### Concepto Básico
```
Heartbeat = "Latido" que dice "Estoy vivo"

Sin heartbeat en X minutos = Sesión muerta
```

### Implementación
```typescript
// Cada 30 segundos (incluso si no hay actividad)
setInterval(() => {
  enviarHeartbeat(idUsuario);  // UPDATE timestamp_heartbeat
}, 30 * 1000);
```

### En Firestore
```json
{
  "estado": "conectado",
  "timestamp_heartbeat": "2026-03-31T13:25:30Z",
  
  // 30 segundos después...
  "timestamp_heartbeat": "2026-03-31T13:26:00Z"
}
```

---

## 🔍 DETECCIÓN DE DESCONEXIÓN BRUSCA

### SIN Heartbeat (Antes)
```
Usuario cierra navegador
      ↓
Sistema NO lo sabe
      ↓
Usuario sigue "conectado" indefinidamente
      ↓
❌ PROBLEMA: Sesión fantasma
```

### CON Heartbeat (Ahora)
```
Usuario cierra navegador
      ↓
Heartbeat DEJA de llegar
      ↓
Esperamos 5 minutos
      ↓
¿Todavía sin heartbeat?
      ├─ SÍ → MUERTO (navegador cerrado)
      └─ NO → VIVO (usuario en otra pestaña)
      ↓
✅ SOLUCIÓN: Detectamos la desconexión
```

---

## 🔄 FLUJO COMPLETO: Cierre Brusco

### Paso 1: Usuario Activo
```
10:00 AM - Login
10:00:30 - Heartbeat ✓
10:01:00 - Heartbeat ✓
10:01:30 - Heartbeat ✓
...
10:15:00 - Heartbeat ✓
```

### Paso 2: Cierra Navegador ❌
```
10:15:30 - Usuario CIERRA ventana
          Código se detiene
          ❌ No hay más heartbeat
```

### Paso 3: Sistema Espera
```
10:16:00 - Sin heartbeat (30 seg)
10:16:30 - Sin heartbeat (60 seg)
10:17:00 - Sin heartbeat (90 seg)
...
10:20:00 - Sin heartbeat (5 minutos)
          ⚠️ SOSPECHOSO: Navegador probablemente cerrado
```

### Paso 4: Tomar Acción

#### Opción A: SIN Cloud Function (Actual)
```
User abre navegador en otra pestaña
      ↓
Va a Seguridad tab
      ↓
Ve la sesión anterior como "INACTIVA"
(timestamp_heartbeat = 10:15:00, sin actualizar)
      ↓
Click: "Cerrar sesiones inactivas"
      ↓
Sistema detecta: sin heartbeat > 5 min
      ↓
Cierra automáticamente
      ↓
estado: "desconectado"
```

#### Opción B: CON Cloud Function (Blaze)
```
Cloud Function ejecuta cada 10 minutos
      ↓
Busca sesiones con:
  - estado = "conectado"
  - timestamp_heartbeat < ahora - 5 min
      ↓
Las encuentra
      ↓
Cierra automáticamente
      ↓
Sin intervención del usuario
```

---

## 🎯 CRITERIOS DE DETECCIÓN

### Tres Tipos de Timestamps

```
┌─────────────────────────────────────────────────┐
│ timestamp_heartbeat                             │
│ ├─ Se actualiza CADA 30 SEGUNDOS                │
│ ├─ Indica: "El navegador está corriendo"        │
│ └─ Sin actualizar > 5 min = Navegador cerrado   │
│                                                  │
│ timestamp_ultima_actividad                      │
│ ├─ Se actualiza cuando hay INTERACCIÓN          │
│ ├─ Indica: "El usuario está usando la app"      │
│ └─ Sin actualizar > 30 min = Usuario inactivo   │
│                                                  │
│ timestamp_inicio                                │
│ ├─ No cambia                                    │
│ └─ Indica: "Cuándo conectó"                     │
└─────────────────────────────────────────────────┘
```

### Lógica de Detección

```
// Función: cerrarSesionesInactivasAvanzado()

Para cada sesión conectada:
  ├─ sinHeartbeat = ahora - timestamp_heartbeat
  ├─ sinActividad = ahora - timestamp_ultima_actividad
  │
  ├─ SI sinHeartbeat > 5 min
  │  └─ CERRAR: "Navegador cerrado"
  │
  ├─ SINO SI sinActividad > 30 min
  │  └─ CERRAR: "Usuario inactivo"
  │
  └─ SINO
     └─ DEJAR CONECTADO: "Usuario activo"
```

---

## 📊 TABLA: Detección Automática

| Situación | timestamp_heartbeat | timestamp_actividad | Acción |
|-----------|---|---|---|
| Usuario navegando | Actualiza cada 30s | Actualiza cada 5m | Deja conectado ✓ |
| Usuario inactivo 10m | Actualiza cada 30s | No actualiza (10m) | Marca inactivo ⚠️ |
| Usuario inactivo 30m+ | Actualiza cada 30s | No actualiza (30m+) | Cierra sesión ❌ |
| Navegador cerrado | NO actualiza (5m+) | NO actualiza (5m+) | Cierra sesión ❌ |
| Internet caído | NO actualiza (5m+) | NO actualiza (5m+) | Cierra sesión ❌ |

---

## 🛠️ IMPLEMENTACIÓN ACTUAL

### ✅ Cliente (React)
```typescript
// src/hooks/useSessionActivity.ts

// CADA 30 SEGUNDOS: Heartbeat
setInterval(() => {
  await enviarHeartbeat(idUsuario);  // UPDATE timestamp_heartbeat
}, 30 * 1000);

// CADA 5 MINUTOS (si hay actividad): Actualización
addEventListener('click', () => {
  await actualizarActividadSesion(idUsuario);  // UPDATE timestamp_ultima_actividad
});
```

### ✅ Servidor (Firestore)
```typescript
// src/services/online.ts

export async function enviarHeartbeat(idUsuario: string) {
  // Encuentra sesión más reciente conectada
  // UPDATE online SET timestamp_heartbeat = serverTimestamp()
}
```

### ⚠️ Cloud Function (Implementada, espera Blaze)
```typescript
// functions/src/closeInactiveSessions.ts

// CADA 10 MINUTOS:
SELECT * FROM online
WHERE estado = "conectado" AND
      timestamp_heartbeat < ahora - 5 minutos
      
// Cierra todas las encontradas
UPDATE online SET estado = "desconectado"
```

---

## 💾 VENTAJAS DE ESTA SOLUCIÓN

| Aspecto | Ventaja |
|--------|---------|
| **Precisión** | Distingue navegador cerrado vs usuario inactivo |
| **Costo** | Heartbeat es gratis (solo 1 UPDATE cada 30s) |
| **Responsivo** | Detecta desconexión en 5 minutos |
| **Flexible** | Cloud Function es opcional (funciona sin Blaze) |
| **Visible** | Admin ve sesiones "muertas" en Seguridad tab |
| **Manual** | Puede cerrar manualmente si lo prefiere |

---

## 🚀 PRÓXIMOS PASOS

### Opción 1: Mantener Actual (Recomendado)
```
✅ Heartbeat enviado cada 30 seg
✅ Sesiones inactivas visibles en UI
✅ Cierre manual desde Seguridad
❌ Sin cierre automático (requiere click)
💰 Costo: $0
```

### Opción 2: Upgrade a Blaze
```
✅ Heartbeat enviado cada 30 seg
✅ Sesiones inactivas visibles en UI
✅ Cierre automático cada 10 min
✅ Sin intervención del usuario
💰 Costo: $2-5/mes
```

---

## 🔍 VERIFICACIÓN MANUAL

### Test 1: Simular Cierre de Navegador
```
1. Login en navegador
2. Ir a Seguridad → Anotar timestamp_heartbeat
3. Cerrar navegador completamente (ALT+F4 o cerrar ventana)
4. Esperar 6 minutos
5. Abrir navegador nuevamente
6. Ir a Seguridad
7. Ver sesión anterior:
   - timestamp_heartbeat NO se actualizó ← Detecta desconexión
   - Sin heartbeat > 5 min ← Sesión muerta
8. Click "Cerrar inactivas" → Se cierra
```

### Test 2: Verificar Heartbeat Real-Time
```
1. Abrir Firestore Console
2. Colección: online
3. Documento: estado="conectado"
4. Ver timestamp_heartbeat
5. Esperar 30 segundos
6. Refrescar
7. timestamp_heartbeat debe cambiar ✓
```

---

## 📋 RESUMEN

| Pregunta | Respuesta |
|----------|-----------|
| **¿Cómo detectar navegador cerrado?** | Heartbeat cada 30s detecta si para |
| **¿Cuándo sabes que está muerto?** | 5 minutos sin heartbeat |
| **¿Qué haces entonces?** | Opción A: Manual en UI, Opción B: Cloud Function automática |
| **¿Cuál es más fácil?** | Opción A (actual) - Manual pero simple |
| **¿Cuál es más inteligente?** | Opción B (Blaze) - Automática pero cuesta |

---

**Conclusión**: 
✅ El sistema **YA detecta** navegadores cerrados con heartbeat  
⚠️ El cierre es **manual por ahora** (pero visible en UI)  
🚀 Es **opcional** hacer automático (requiere Blaze)
