# Estado Actual vs. Propuesto — Decisión de Prioridades

**Fecha:** 16 de agosto de 2026  
**Objetivo:** Comparar lo que tenemos con lo propuesto, identificar qué vale la pena hacer, qué descartar y en qué orden.

---

## 1. Resumen del Estado Actual

**Stack:** React + Vite + PWA / Supabase (PostgreSQL + Auth + Storage) / Vercel  
**Migraciones:** 44 aplicadas (matrículas, asistencia, accidentes, biblioteca, etc.)  
**Módulos funcionales:**

| Módulo | Estado | Acceso |
|--------|--------|--------|
| Login + Roles (ADMIN, INSPECTOR, PARADOCENTE, SECRETARÍA, etc.) | ✅ Funcional | Web + Móvil |
| Dashboard por rol | ✅ Funcional | Web |
| Asistencia paradocente (atrasos, inasistencias, justificaciones) | ✅ Funcional | Móvil (InspectoriaMobile) |
| Historial de movilidad del estudiante | ✅ Funcional | Móvil |
| Matrículas (nuevas + continuidad) | ✅ Funcional | Web |
| Retiros de estudiantes | ✅ Funcional | Web |
| Consentimientos Ley 21.719 (PDFs) | ✅ Funcional | Web |
| Accidentes escolares | ✅ Funcional | Web |
| Solicitudes de registro | ✅ Funcional | Web |
| Correos institucionales | ✅ Funcional | Web |
| Inventario de equipos | ✅ Funcional | Web + Móvil |
| Biblioteca (catálogo, circulación, historial) | ✅ Funcional | Web |
| Configuración (roles, usuarios, parámetros, feriados) | ✅ Funcional | Web |
| QR Scanner (escaneo) | ✅ Funcional | Móvil |
| Soporte/Tickets | ✅ Funcional | Web |

**Lo que YA funciona en móvil (PWA en tablet/teléfono):**
- Login móvil
- Dashboard paradocente
- Registro de atrasos/inasistencias
- Historial del estudiante
- Escaneo QR
- Inventario móvil

---

## 2. Lo Propuesto (Análisis de 16/08)

El análisis plantea transformar la PWA en una **plataforma institucional de tablets** con estas capacidades:

| # | Capacidad | Descripción |
|---|-----------|-------------|
| A | **Base local cifrada** | Datos del estudiante guardados en la tablet, cifrados, no en JSON plano |
| B | **Operación 100% offline** | Registrar atrasos, inasistencias, justificaciones sin Internet |
| C | **Cola de sincronización** | Operaciones pendientes → se sincronizan cuando vuelve Internet |
| D | **Tokens firmados / QR criptográficos** | Códigos de ingreso verificables sin Internet, con vencimiento |
| E | **Cámara institucional controlada** | Fotos de certificados/incidencias van al expediente, NO a la galería |
| F | **Reemplazo de WhatsApp** | Envío de documentos trazable desde la tablet |
| G | **Identidad de dispositivo** | Cada tablet tiene su propia identidad criptográfica |
| H | **Sesión con expiración** | Bloqueo automático tras inactividad |
| I | **Auditoría firmada** | Cada operación queda registrada con dispositivo + usuario + timestamp |
| J | **Migración a app híbrida Android** | Evaluar si PWA es suficiente o se necesita app nativa/híbrida |

---

## 3. Lista Comparativa: Actual vs. Propuesto

| CapacActual | Estado Actual | Propuesto | ¿Vale la pena? |
|-------------|---------------|-----------|-----------------|
| **A** Base local cifrada | ❌ No existe (usa localStorage para borradores) | IndexedDB cifrado | **SÍ** — los datos del estudiante en la tablet deben estar protegidos |
| **B** Offline completo | ⚠️ Parcial (PWA cachea archivos, pero sin sync de datos) | Cola de operaciones offline | **SÍ** — la asistencia no puede depender del Wi-Fi |
| **C** Cola de sync | ❌ No existe | PENDIENTE → SINCRONIZANDO → CONFIRMADO | **SÍ** — pérdida de datos por caída de red es inaceptable |
| **D** Tokens/QR firmados | ⚠️ QR existe pero sin firma criptográfica | Tokens con firma + vencimiento | **SÍ** — verificar ingreso sin Internet, sin papel |
| **E** Cámara controlada | ⚠️ No implementada | Captura → cifrado → expediente → sync | **SÍ** — certificados/incidencias quedan en el sistema, no en galería |
| **F** Reemplazo WhatsApp | ❌ No existe | Envío trazable de documentos | **SÍ** — trazabilidad institucional completa |
| **G** Identidad dispositivo | ❌ No existe | Certificado/clave por tablet | **SÍ** — saber qué tablet hizo qué operación |
| **H** Sesión expirable | ⚠️ Auth básica (Supabase) | Expiración + bloqueo por inactividad | **SÍ** — seguridad en dispositivo compartido |
| **I** Auditoría firmada | ⚠️ Parcial (Supabase auth_logs) | Operación + dispositivo + usuario + timestamp | **SÍ** — trazabilidad completa |
| **J** App híbrida Android | ❌ PWA actual | Evaluar React Native / Capacitor / Flutter | **DEPENDE** — solo si cámara/sync local requiere nativo |

---

## 4. Lista de lo Importante (por criticidad)

| Prioridad | Ítem | Por qué es importante |
|-----------|------|----------------------|
| 🔴 **CRÍTICO** | **B** Offline completo | Si el Wi-Fi falla durante la jornada, la asistencia se pierde. No hay segunda oportunidad. |
| 🔴 **CRÍTICO** | **C** Cola de sync | Sin esto, los datos offline no llegan al servidor de forma confiable. |
| 🔴 **CRÍTICO** | **A** Base local cifrada | Si la tablet se pierde/roba, los datos de estudiantes deben estar protegidos. |
| 🟠 **ALTO** | **E** Cámara controlada | Certificados médicos e incidencias se capturan directo al sistema, sin WhatsApp. |
| 🟠 **ALTO** | **I** Auditoría firmada | Saber qué tablet, qué usuario, qué hora, qué operación. Obligatorio para defensa legal. |
| 🟠 **ALTO** | **G** Identidad dispositivo | Sin esto, no se puede distinguir entre tablets. |
| 🟡 **MEDIO** | **D** Tokens/QR firmados | Verificación de ingreso sin Internet. Mejora la experiencia, no es bloqueante. |
| 🟡 **MEDIO** | **F** Reemplazo WhatsApp | Traazabilidad documental. Importante pero el envío actual (correo) funciona. |
| 🟡 **MEDIO** | **H** Sesión expirable | Seguridad extra. Supabase ya maneja tokens JWT con expiración. |
| 🟢 **BAJO** | **J** App híbrida Android | Solo necesario si la PWA no puede dar cámara/sync local robusto. Evaluar después. |

---

## 5. Lo que YA Tenemos y se Mantiene

No hay que rehacer lo que funciona:

| Módulo | Se mantiene | Se integra con tablets |
|--------|-------------|----------------------|
| Login + Auth (Supabase) | ✅ | Sí — cada tablet usa la misma auth |
| Roles y permisos | ✅ | Sí — paradocente/inspector en tablet |
| Dashboard paradocente móvil | ✅ | Sí — es la base de la pantalla de tablet |
| Registro atrasos/inasistencias | ✅ | Sí — se adapta para offline + sync |
| Historial estudiante | ✅ | Sí — se consulta local desde la tablet |
| QR Scanner | ✅ | Sí — se mejora con tokens firmados |
| Inventario móvil | ✅ | Se mantiene |
| Matrículas | ✅ (web) | Se mantiene en web (no es operación de tablet) |
| Accidentes | ✅ (web) | Se evalúa si se migra a tablet |
| Biblioteca | ✅ (web) | Se mantiene en web |
| Consentimientos PDF | ✅ (web) | Se mantiene en web |

---

## 6. Lo que hay que CREAR desde cero

| # | Componente | Esfuerzo | Notas |
|---|-----------|----------|-------|
| 1 | **Servicio offline** (IndexedDB + cifrado) | 🟠 Alto | Nuevo módulo completo |
| 2 | **Cola de operaciones** (offline queue) | 🟠 Alto | Nuevo módulo completo |
| 3 | **Sync manager** (retry, estados, reconciliación) | 🔴 Muy alto | Lo más complejo del proyecto |
| 4 | **Tokens/QR firmados** | 🟡 Medio | Nuevo módulo, requiere diseño criptográfico |
| 5 | **Cámara institucional** (capture → cifrado → upload) | 🟡 Medio | Depende de cámara nativa o PWA MediaDevices |
| 6 | **Identidad de dispositivo** (certificado/clave) | 🟡 Medio | Nuevo concepto en la app |
| 7 | **Sesión + bloqueo por inactividad** | 🟢 Bajo | Hook + timer, relativamente simple |
| 8 | **Migración a híbrida** (si se decide) | 🔴 Muy alto | Evaluar antes de todo lo demás |

---

## 7. Decisión Pendiente

**Pregunta clave:** ¿Migramos a app híbrida (Capacitor/React Native) o nos quedamos en PWA?

| Opción | Ventajas | Desventajas |
|--------|----------|-------------|
| **PWA (actual)** | Ya funciona, deploy fácil, sin App Store | Cámara limitada, sin control real del dispositivo, sync offline pobre |
| **Capacitor** | Migración mínima (mismo código React), cámara nativa, sync local robusto | Requiere build Android, upload a Play Store |
| **React Native** | Rendimiento nativo, mejor control | Reescribir toda la UI, mucho esfuerzo |
| **Flutter** | Rendimiento excelente | Tecnología diferente, reescribir todo |

**Mi recomendación:** Capacitor si se decide migrar. Mismo código React, se agrega cámara nativa, sync local, y se publica en Play Store. Si la PWA + IndexedDB + MediaDevices API alcanza para cámara y sync, no migrar.

---

## 8. Propuesta de Fases (para que decidas)

| Fase | Descripción | Depende de |
|------|-------------|-----------|
| **FASE 0** | Decidir PWA vs. híbrida | Nada — se decide primero |
| **FASE 1** | Base local cifrada + Cola offline (A + B + C) | FASE 0 |
| **FASE 2** | Sync manager + Auditoría firmada (C + I) | FASE 1 |
| **FASE 3** | Cámara institucional (E) | FASE 0 (si híbrida, aquí va) |
| **FASE 4** | Tokens/QR firmados (D) | FASE 1 |
| **FASE 5** | Reemplazo WhatsApp + Identidad dispositivo (F + G) | FASE 2 |

**¿Qué descartar?** Nada de lo actual se descarta. Los módulos web (matrículas, biblioteca, accidentes) se mantienen. Las tablets ejecutan asistencia + cámara + tokens. La web administra el resto.

---

## 9. Resumen para Decidir

| Hacer primero | Hacer después | Evaluar | Descartar |
|---------------|---------------|---------|-----------|
| Base local cifrada | Tokens/QR firmados | App híbrida (Capacitor) | Nada se descarta |
| Cola offline + sync | Cámara institucional | | |
| Auditoría firmada | Reemplazo WhatsApp | | |
| Identidad dispositivo | | | |
| Sesión expirable | | | |

**La FASE 0 (PWA vs. híbrida) es la decisión que bloquea todo lo demás.** Si la PWA alcanza para cámara y sync, no vale la pena migrar. Si no alcanza, Capacitor es la mejor opción con el mismo código React.
