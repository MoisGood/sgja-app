# 🔧 GUÍA DE TROUBLESHOOTING: MONITOR DE LECTURAS

## ✅ ¿CÓMO VERIFICAR QUE EL MONITOR FUNCIONA?

### Paso 1: Inicia el servidor de desarrollo
```bash
npm run dev
```

### Paso 2: Abre la app en el navegador
- URL: `http://localhost:5173`

### Paso 3: Busca el widget 📊 (abajo-derecha)
- Si aparece el widget = Monitor está cargado ✅
- Si NO aparece = Chequear que sea development mode

### Paso 4: Abre DevTools (F12)
- Console → Deberías ver logs como:
```
✅ Cache HIT: test-key-0
✅ Cache HIT: test-key-1
🔥 Firestore READ: solicitudes-0
📊 Stats del cache: { totalKeys: 5, expiredCount: 0, totalSizeKB: 128 }
📈 Métricas globales: { cacheHits: 5, firestoreReads: 1 }
```

---

## 🧪 COMPONENTE DE PRUEBA AUTOMÁTICO

El componente `TestMonitor` se ejecuta automáticamente en development y genera:
- 5 Cache Hits (lectura del cache)
- 3 Firestore Reads (simulados)
- Stats del cache

**Resultado esperado en el widget:**
```
✅ Cache Hits: 5
🔥 Firestore Reads: 3
⚡ Eficiencia: 63%
```

---

## 🐛 PROBLEMAS COMUNES

### Problema 1: Widget no aparece
**Causa**: No estás en development mode

**Solución**:
```bash
npm run dev  # Debe decir "Local: http://localhost:5173"
```

### Problema 2: Console logs no aparecen
**Causa**: Los logs solo se generan cuando hay lecturas reales

**Solución**:
1. Abre DevTools (F12)
2. Espera 5 segundos
3. El monitor debería actualizar los números

### Problema 3: Eficiencia sigue en 0%
**Causa**: No hay lecturas de cache todavía

**Solución**:
1. El TestMonitor debería generar logs automáticamente
2. Si no ves logs, abre Console y escribe:
```javascript
// Fuerza una lectura de prueba
console.log('✅ Cache HIT: test-manual');
```

### Problema 4: Monitor no actualiza después de navegar
**Causa**: El intervalo de actualización es cada 5 segundos

**Solución**: 
- Espera 5 segundos
- O abre Console y ejecuta:
```javascript
// Ver estado actual
window.__sgjaMetrics
```

---

## 🔍 DEBUGGING MANUAL

### Ver todas las métricas en tiempo real
```javascript
// En Console:
setInterval(() => {
  console.log('STATS:', {
    cacheHits: window.__sgjaMetrics?.cacheHits || 0,
    firestoreReads: window.__sgjaMetrics?.firestoreReads || 0,
  });
}, 1000);
```

### Ver todo el cache almacenado
```javascript
// En Console:
const stats = await (await import('./src/services/cacheService')).cacheService.getStats();
console.log('Cache completo:', stats);
```

### Limpiar cache manualmente
```javascript
// En Console:
(await import('./src/services/cacheService')).cacheService.clear();
console.log('Cache limpiado ✅');
```

### Forzar simulación de lecturas
```javascript
// En Console (genera 5 cache hits):
for (let i = 0; i < 5; i++) {
  console.log(`✅ Cache HIT: prueba-${i}`);
}

// En Console (genera 3 firestore reads):
for (let i = 0; i < 3; i++) {
  console.log(`🔥 Firestore READ: prueba-${i}`);
}
```

---

## ✨ CARACTERÍSTICAS DEL MONITOR

### Widget Visual
```
📊 MONITOR LECTURAS
─────────────────
✅ Cache Hits: 15      ← Número de hits
🔥 Firestore Reads: 3  ← Número de reads
⚡ Eficiencia: 83%     ← % hits/(hits+reads)
─────────────────
💾 Cache Items: 5      ← Cuántos items en cache
⏰ Expired: 0          ← Cuántos expirados
📦 Size: 256KB         ← Tamaño total del cache
─────────────────
🗑️ Limpiar Cache      ← Botón para limpiar
```

### Colores del Monitor
- 🟢 Verde (`#065f46`) = Eficiencia > 80%  (EXCELENTE)
- 🟡 Naranja (`#854d0e`) = Eficiencia 50-80% (BUENO)
- 🔴 Rojo (`#7f1d1d`) = Eficiencia < 50% (MEJORABLE)

---

## 📊 INTERPRETACIÓN DE MÉTRICAS

### ✅ Cache Hits: X
Número de veces que se obtuvo un dato del cache local (sin leer Firestore)

### 🔥 Firestore Reads: X
Número de veces que se tuvo que leer de Firestore (cache no tenía el dato)

### ⚡ Eficiencia: X%
Fórmula: `(Cache Hits / (Cache Hits + Firestore Reads)) * 100`

**Interpretación:**
```
0-30%   = Muy poco cache, necesita mejorar
30-60%  = Promedio, hay cache pero no es suficiente
60-80%  = Bueno, mayoria desde cache
80-100% = Excelente, casi todo desde cache
```

---

## 🎯 META DE EFICIENCIA

Para el sistema SGJA:
- **Objetivo**: > 80% eficiencia
- **Acceptable**: > 60% eficiencia
- **Alerta**: < 40% eficiencia (revisar cache TTLs)

---

## 🚀 TEST COMPLETO: PASO A PASO

### 1. Inicia dev mode
```bash
npm run dev
```

### 2. Abre browser en `http://localhost:5173`

### 3. Abre DevTools (F12)
- Pestaña "Console"

### 4. Deberías ver logs automáticos:
```
🧪 INICIANDO TEST DE MONITOREO
✅ Cache HIT: test-key-0
✅ Cache HIT: test-key-1
✅ Cache HIT: test-key-2
✅ Cache HIT: test-key-3
✅ Cache HIT: test-key-4
🔥 Firestore READ: solicitudes-0
🔥 Firestore READ: solicitudes-1
🔥 Firestore READ: solicitudes-2
📊 Stats del cache: {totalKeys: 5, expiredCount: 0, totalSizeKB: 128}
📈 Métricas globales: {cacheHits: 5, firestoreReads: 3}
```

### 5. Widget muestra:
```
✅ Cache Hits: 5
🔥 Firestore Reads: 3
⚡ Eficiencia: 63%
```

✅ **¡FUNCIONA!**

---

## 📱 TESTING EN NAVEGADOR REAL

### Chrome/Edge
1. Abre `http://localhost:5173`
2. F12 → Console
3. Debería ver logs automáticos en 3 segundos

### Firefox
1. Abre `http://localhost:5173`
2. Ctrl+Shift+K → Console
3. Mismo comportamiento

---

## 💡 PRÓXIMOS PASOS

Cuando navegues a:
- **Dashboard**: Deberías ver `✅ Cache HIT: solicitudes-conteos-XXX`
- **Otras páginas**: Logs de cache automáticos

---

**¿Aún no funciona?** Revisa estos puntos:
1. ¿Estás en `npm run dev`? (no `npm run build`)
2. ¿F12 Console abierta?
3. ¿Recargaste la página (Ctrl+Shift+R)?
4. ¿Viste los logs automáticos del TestMonitor?

Si aún así no funciona, el TestMonitor debería mostrarte logs en la consola al menos.
