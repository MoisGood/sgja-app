# RESUMEN EJECUTIVO: PLAN DE MIGRACIÓN COMPLETO

## VISIÓN GENERAL

Migración de **Firebase → Supabase + Vercel** para mejorar:
- ✅ Costos (80-90% reducción)
- ✅ Performance (edge functions, mejor CDN)
- ✅ Escalabilidad (PostgreSQL vs Firestore)
- ✅ Control (base de datos SQL con RLS)

---

## FASES Y TIMELINE

```
┌─────────────────────────────────────────────────────────────┐
│ FASE 1: PREPARACIÓN (Día 1-2)                               │
│ ├─ Crear cuentas Supabase + Vercel                         │
│ ├─ Crear estructura BD en Supabase                         │
│ └─ Exportar datos de Firestore                             │
├─────────────────────────────────────────────────────────────┤
│ FASE 2: IMPORTACIÓN (Día 2-3)                               │
│ ├─ Importar datos a Supabase                               │
│ ├─ Validar integridad                                      │
│ └─ Configurar RLS (seguridad)                              │
├─────────────────────────────────────────────────────────────┤
│ FASE 3: DESARROLLO (Día 3-4)                                │
│ ├─ Crear src/services/supabase.ts                          │
│ ├─ Mapear funciones Firestore → Supabase                   │
│ ├─ Configurar Vercel + Environment variables               │
│ └─ Testing en preview                                      │
├─────────────────────────────────────────────────────────────┤
│ FASE 4: CUTOVER (Día 5)                                    │
│ ├─ Cambiar DNS a Vercel                                    │
│ ├─ Actualizar .env a Supabase                              │
│ ├─ Deploy en Vercel                                        │
│ └─ Monitoreo 24/7 primeras 48h                             │
└─────────────────────────────────────────────────────────────┘

TIMELINE TOTAL: 5-7 días de work
```

---

## CHECKLIST RÁPIDO

### PASO 0: PREPARACIÓN PRE-MIGRACIÓN
- [x] Respaldo de código realizado
- [ ] Leer plan completo (2 horas)
- [ ] Crear cuentas Supabase + Vercel (30 min)

### PASO 1: SUPABASE (Días 1-4)
- [ ] Crear tablas SQL (copiar de plan)
- [ ] Configurar RLS (seguridad)
- [ ] Exportar datos de Firestore
- [ ] Importar a Supabase
- [ ] Validar datos
- [ ] Crear src/services/supabase.ts
- [ ] Actualizar imports en código
- [ ] Testing local
- [ ] Testing en staging

### PASO 2: VERCEL (Días 1-5)
- [ ] Crear cuenta Vercel
- [ ] Conectar repositorio GitHub
- [ ] Crear vercel.json
- [ ] Configurar variables ambiente
- [ ] Deploy preview verificado
- [ ] Dominio personalizado (si aplica)
- [ ] SSL verificado

### PASO 3: GO-LIVE (Día 5)
- [ ] Última copia de seguridad
- [ ] Comunicar downtime (15-30 min)
- [ ] Cambiar DNS a Vercel
- [ ] Esperar propagación
- [ ] Monitoreo primeras 2 horas
- [ ] Validación funcionalidades
- [ ] Desabilitar Firebase Hosting

### PASO 4: POST-MIGRACIÓN (Week 2)
- [ ] Optimizaciones rendimiento
- [ ] Feedback usuarios
- [ ] Documentación actualizada

---

## CAMBIOS EN CÓDIGO (Resumen)

### Archivos a CREAR:
```
src/services/supabase.ts      (equivalente a firestore.ts)
src/lib/supabaseClient.ts     (instancia del cliente)
vercel.json                     (configuración Vercel)
.vercelignore                   (archivos a ignorar)
```

### Archivos a ACTUALIZAR:
```
src/pages/*.tsx               (cambiar imports)
src/hooks/useAuth.ts          (validación sin Firebase Auth)
.env.example                  (documentar variables)
package.json                  (scripts limpios)
vite.config.ts               (optimizaciones)
```

### Archivos a MANTENER:
```
src/services/firestore.ts     (como respaldo, 1 semana)
firebase.json                 (hasta desabilitar hosting)
```

---

## MAPEO DE FUNCIONES CLAVE

### Estudiantes
```typescript
// ANTES (Firestore)
const estudiantes = await getDocs(query(
  collection(db, 'estudiantes'),
  where('curso', '==', '1A')
));

// DESPUÉS (Supabase)
const { data: estudiantes } = await supabase
  .from('estudiantes')
  .select('*')
  .eq('curso', '1A');
```

### Ausencias
```typescript
// ANTES (Firestore)
await setDoc(doc(db, 'solicitudes', id), datos);

// DESPUÉS (Supabase)
await supabase
  .from('solicitudes')
  .insert([datos]);
```

### Escuchar cambios (Realtime)
```typescript
// ANTES (Firestore)
const unsubscribe = onSnapshot(query(...), snapshot => {
  // datos
});

// DESPUÉS (Supabase)
supabase
  .from('solicitudes')
  .on('*', payload => {
    // datos
  })
  .subscribe();
```

---

## PUNTOS CRÍTICOS A VIGILAR

### 1. RLS (Row Level Security)
```
- CRÍTICO: Sin RLS, usuarios ven datos de otros
- Usar políticas Supabase para cada tabla
- Probar en staging antes de go-live
```

### 2. Migraciones de datos
```
- NULL vs 0 vs empty string
- UUIDs vs Strings para IDs
- Timestamps en formato ISO
- Relaciones de integridad referencial
```

### 3. Performance
```
- Supabase carga datos más lento que Firestore (primeras veces)
- Cache IndexedDB mitiga esto (30-60 min TTL)
- Índices en BD para queries rápidas
```

### 4. Offline mode
```
- Funciona con datos en cache
- Justificativos: generar código único para sincronizar después
- Encolar cambios en IndexedDB hasta tener conexión
```

---

## COMPARATIVA COSTOS

### Firebase (Actual - Mes Típico)
```
Firestore:     6,100 lecturas × $0.06/M = $0.37
Storage:       ~100 MB × poco uso           = $0
Hosting:       10 GB gratis (< 10GB)        = $0
────────────────────────────────────────────────
TOTAL:         ≈ $0-5/mes (cuota gratuita)
```

### Supabase (Post-Migración - Mes Típico)
```
PostgreSQL:    500 MB gratis (< 500MB)      = $0
Auth:          100 usuarios gratis          = $0
Storage:       1 GB gratis                  = $0
────────────────────────────────────────────────
TOTAL:         ≈ $0/mes (cuota gratuita)

Cuando crece:  ~$25/mes (Pro) si supera cuotas
```

### Vercel (Post-Migración)
```
Hosting:       100 GB ancho de banda gratis = $0
Functions:     100 horas gratis             = $0
Analytics:     Incluido                     = $0
────────────────────────────────────────────────
TOTAL:         ≈ $0-5/mes (cuota gratuita)
```

### Ahorro Total: 80-90% de costos actuales

---

## ROLLBACK PLAN (CRÍTICO)

### Si falla Supabase:
```
1. En .env: REACT_APP_Backend_URL=FIREBASE
2. npm run build
3. firebase deploy --only hosting
4. Tráfico vuelve a Firebase (< 5 min)
5. Supabase datos intactos (backup disponible)
```

### Si falla Vercel:
```
1. En DNS: Apuntar de vuelta a Firebase Hosting
2. firebase deploy --only hosting
3. Tráfico vuelve (< 2 min, DNS propagación)
```

### Ventana de riesgo: <15 minutos máximo

---

## DOCUMENTOS ADJUNTOS

1. **PLAN_MIGRACION_FIREBASE_SUPABASE.md** (Detallado)
   - Paso a paso técnico
   - SQL para crear tablas
   - Funciones equivalentes

2. **PLAN_MIGRACION_FIREBASE_HOSTING_VERCEL.md** (Detallado)
   - Configuración Vercel
   - DNS + dominio
   - CI/CD automático

3. **Este documento** (Resumen ejecutivo)
   - Visión general
   - Timeline
   - Checklist rápido

---

## REQUISITOS PREVIOS

### Acceso/Cuentas:
- [ ] Cuenta GitHub con repo del proyecto
- [ ] Acceso a Firebase Console
- [ ] Email para crear Supabase
- [ ] Email para crear Vercel

### Conocimientos:
- [ ] SQL básico (INSERT, SELECT, UPDATE)
- [ ] Git y GitHub
- [ ] Variables de ambiente (.env)
- [ ] DNS (opcional, si dominio personalizado)

### Tiempo:
- **Estimado total**: 5-7 días de desarrollo
- **Downtime planeado**: 15-30 minutos (durante cutover)
- **Testing overhead**: 2-3 días

---

## PREGUNTAS FRECUENTES

**P: ¿Qué pasa si algo falla?**
R: Tenemos rollback plan <15 min. Supabase como backup 1 semana.

**P: ¿Se pierden datos?**
R: No. Exportamos antes, validamos, migración es copia.

**P: ¿Necesita downtime?**
R: Sí, 15-30 min durante cutover DNS.

**P: ¿Usuarios verán cambios?**
R: No, interfaz es idéntica. Solo backend cambia.

**P: ¿Se puede hacer gradual?**
R: Sí, con canario deployment (10% → 50% → 100%).

**P: ¿Qué pasa con datos offline?**
R: Se encolan en IndexedDB, sincronizan automáticamente cuando hay conexión.

---

## PRÓXIMOS PASOS

1. **HOY**: Revisar ambos planes completos (2-3 horas)
2. **MAÑANA**: Crear cuentas Supabase + Vercel (30 min)
3. **MAÑANA**: Empezar con FASE 1 (preparación)
4. **ESTA SEMANA**: Ejecutar migraciones
5. **PRÓXIMA SEMANA**: Testing + Go-live

---

## SOPORTE Y ESCALACIÓN

### Si tienes dudas:
- Planes detallados: Lee los 2 documentos completos
- SQL: ChatGPT + Supabase Docs
- Vercel: Vercel Docs + Community

### Si tienes errores:
- 1. Revisar logs (Vercel + Supabase dashboard)
- 2. Consultar checklist de troubleshooting
- 3. Activar rollback si es crítico

---

**Documento generado**: 14 de Abril 2026
**Versión**: 1.0
**Status**: Listo para implementación

