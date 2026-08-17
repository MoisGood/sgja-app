# Análisis Estratégico — Plataforma Institucional de Operaciones Móviles

**Fecha:** 16 de agosto de 2026  
**Estado:** Análisis y propuesta arquitectónica  
**Contexto:** Evolución del módulo de asistencia a plataforma institucional completa para tablets

---

## Resumen Ejecutivo

El sistema original (módulo de justificaciones de atrasos/inasistencias) evoluciona hacia una **plataforma institucional de operaciones móviles** ejecutada desde tablets controladas por el establecimiento. El funcionario no utiliza su teléfono personal; la tablet se convierte en la herramienta operacional institucional.

**Concepto clave:**
> Tablet institucional → aplicación → datos mínimos necesarios → operaciones autorizadas → sincronización segura.

---

## 1. Capacidad de la Tablet

| Categoría | Operaciones |
|-----------|-------------|
| **Asistencia** | Registrar atrasos, inasistencias, justificaciones |
| **Consulta** | Buscar estudiantes, ver expedientes, cursos |
| **Documentos** | Escanear QR, fotografiar certificados, enviar/recibir información |
| **Validación** | Identidad, códigos temporales, tokens firmados |
| **Incidencias** | Registrar problemas de infraestructura, accidentes, situaciones administrativas |
| **Operación offline** | Funcionar sin Internet, cola de sincronización, sincronizar cuando vuelve la red |

---

## 2. Arquitectura Propuesta

### 2.1 Modelo conceptual

```
                    ┌──────────────────────┐
                    │      SUPABASE        │
                    │                      │
                    │ BD principal         │
                    │ autenticación        │
                    │ auditoría            │
                    │ documentos           │
                    └──────────┬───────────┘
                               │
                         sincronización
                               │
             ┌─────────────────┴────────────────┐
             │                                  │
       ┌─────▼─────┐                      ┌─────▼─────┐
       │ TABLET 01 │                      │ TABLET 02 │
       │ Inspector │                      │ Paradoc.  │
       └─────┬─────┘                      └─────┬─────┘
             │                                  │
       Base local                         Base local
        cifrada                            cifrada
             │                                  │
       Cola offline                        Cola offline
```

### 2.2 Capas de la aplicación

```
             ┌──────────────────┐
             │   Aplicación     │
             │                  │
             │ Atrasos          │
             │ Inasistencias    │
             │ Justificaciones  │
             │ Documentos       │
             │ Cámara           │
             │ QR               │
             │ Tokens           │
             │ Auditoría        │
             └──────────────────┘
```

### 2.3 Flujo de operación offline

```
         SIN CONEXIÓN              CONEXIÓN
         ┌──────────┐             ┌──────────┐
         │ Tablet   │             │ Servidor │
         │ trabaja  │             │          │
         │ local    │             │          │
         └────┬─────┘             └────┬─────┘
              │                        │
              ▼                        ▼
        Cola de operaciones     Sincronización
              │                 automática
              ▼                 (cuando vuelve
        Internet vuelve          Internet)
              │                        │
              └──────────┬─────────────┘
                         ▼
                  Operaciones confirmadas
                  o reintento en caso de error
```

---

## 3. Seguridad — Principios Fundamentales

La tablet no es un dispositivo confiable por defecto. Se debe asumir que puede:
- Perderse o ser robada
- Quedar sin Internet
- Ser utilizada por otra persona
- Operar en entornos de red poco seguros

### 3.1 Requisitos de seguridad

| Componente | Estrategia |
|------------|-----------|
| **Almacenamiento** | Base local cifrada (no archivos JSON planos) |
| **Sesión** | Expiración automática tras inactividad |
| **Usuario** | Identificación individual obligatoria |
| **Dispositivo** | Identidad criptográfica propia (Tablet T-03, PD-02, etc.) |
| **Operaciones** | Registro de auditoría inmutable |
| **Cámara** | Controlada por la aplicación, sin acceso a galería |
| **Datos offline** | Mínimos, con vencimiento temporal |
| **Sincronización** | Firmada/validada criptográficamente |
| **Bloqueo** | Automático después de cierto tiempo sin actividad |

### 3.2 Identidad del dispositivo

Cada tablet mantiene una identidad compuesta por:
- Identidad criptográfica del dispositivo
- Clave criptográfica
- Base local cifrada
- Token de sesión
- Cola de sincronización

---

## 4. Sistema de Tokens y Códigos

### 4.1 Modelo de token firmado

```
TOKEN
├── estudiante
├── curso
├── operación
├── timestamp
├── dispositivo emisor
├── expiración (ej. 30 segundos)
└── firma criptográfica
```

### 4.2 Caso de uso: registro de ingreso con código

**Flujo sin papel ni pantalla compartida:**

1. Paradocente registra: `María Pérez — atraso — 08:17`
2. Sistema genera internamente token firmado con código `4827`
3. Estudiante recibe solo el código: `"4827"`
4. Tablet del aula escanea/verifica el código
5. Resultado: `registro válido → 4°A → María Pérez → ingreso autorizado`

### 4.3 Verificación offline

La otra tablet puede verificar el código localmente si dispone de la información necesaria (base local cifrada + token firmado). No necesita conexión a Internet.

### 4.4 QR + código temporal

La tablet puede mostrar un QR que contiene el token firmado:
- La otra tablet escanea el QR
- Se verifica la firma criptográfica
- No se exponen todos los datos personales
- Vencimiento automático del código

---

## 5. Cámara Institucional Controlada

### 5.1 Uso de la cámara

| Uso | Ejemplo |
|-----|---------|
| Certificados médicos | Fotografiar certificado y asociarlo al expediente |
| Documentos | Cédulas, documentos de identidad, autorizaciones |
| Incidencias | Fotografías de problemas de infraestructura |
| QR | Escanear códigos de ingreso/egreso |

### 5.2 Flujo controlado

```
Cámara → Captura → Cifrado → Asociación al expediente → Subida/sincronización → Eliminación de copia temporal
```

**Regla fundamental:** la fotografía NO queda en la galería normal del dispositivo.

---

## 6. Reemplazo de WhatsApp

### 6.1 Sistema de envío de documentos

```
Enviar documento
  → [Fotografiar]
  → [Revisar]
  → [Enviar]
  → Servidor
  → Inspectoría
```

### 6.2 Recepción institutional

```
Nuevo documento recibido
  Estudiante: XXXXX
  Tipo: Certificado médico
  Fecha: 16/08
  Emitido por: Tablet PD-02
```

**Ventaja:** trazabilidad completa. WhatsApp no está diseñado para ser el sistema documental del establecimiento.

---

## 7. Cola de Sincronización (Offline Queue)

### 7.1 Estructura de cada operación

```
ID: 847293
Dispositivo: PD-02
Usuario: paradocente03
Hora local: 08:17:23
Operación: REGISTRAR_ATRASO
Estado: PENDIENTE_SYNC
```

### 7.2 Ciclo de vida

```
PENDIENTE_SYNC → SINCRONIZANDO → SERVIDOR → CONFIRMADO
                                          → ERROR_SYNC → REINTENTAR
```

No se pierde operación por una caída de Wi-Fi.

---

## 8. Evolución del Proyecto

| Fase | Alcance |
|------|---------|
| **Original** | Sistema de justificación de atrasos/inasistencias |
| **Actual** | Módulo de matrículas + asistencia + documentos |
| **Propuesto** | Plataforma institucional de operaciones móviles |

### 8.1 Módulos futuros posibles

| Módulo | Operaciones |
|--------|-------------|
| **Asistencia** | Atrasos, inasistencias, justificaciones |
| **Documentación** | Certificados, fotografías, documentos |
| **Comunicación** | Avisos institucionales, recepción de información, confirmaciones |
| **Incidencias** | Problemas de infraestructura, accidentes, situaciones administrativas |
| **Inventario** | Escaneo, recepción, entrega |
| **Biblioteca** | ISBN, préstamos, devoluciones |

---

## 9. Stack Actual vs. Stack Propuesto

| Aspecto | Actual | Evaluar para futuro |
|---------|--------|---------------------|
| Frontend | React + PWA | Considerar app híbrida Android |
| Backend | Supabase | Mantener (BD + auth + storage) |
| Deploy | Vercel | Mantener para la web administrativa |
| Almacenamiento local | localStorage | Base cifrada (IndexedDB + cifrado) |
| Cámara | No implementada | API del dispositivo (requiere app nativa/híbrida) |
| Offline | Parcial (Service Worker) | Cola de operaciones + sync robusta |
| Identidad dispositivo | No implementada | Certificado/clave por tablet |

> **Nota importante:** una PWA pura puede no ser suficiente para cámara controlada, almacenamiento cifrado local avanzado, control del dispositivo y sincronización robusta. Evaluar si se mantiene PWA o se migra a una aplicación instalada/híbrida sobre Android.

---

## 10. Próximos Pasos Recomendados (antes de programar)

| # | Tarea | Descripción |
|---|-------|-------------|
| 1 | **Modelo de operación offline/online** | Definir qué datos se almacenan localmente, cuánto viven, cuándo se eliminan |
| 2 | **Identidad y autenticación** | Diseñar autenticación de usuarios + identidad de dispositivos tablets |
| 3 | **Sistema de tokens/códigos/QR** | Modelar tokens firmados, vencimiento, verificación offline |
| 4 | **Cifrado de datos locales** | Seleccionar tecnología (IndexedDB + Web Crypto API, o nativa Android) |
| 5 | **Sincronización y auditoría** | Diseñar cola de operaciones, estados, reintento, registro de auditoría |

**Decisión arquitectónica crítica antes de todo esto:** determinar si se mantiene PWA o se migra a app híbrida Android. Esta decisión afecta todo lo demás.

---

## Nota

Este análisis fue generado el 16/08/2026 como documento de referencia para la planificación arquitectónica del giro estratégico del proyecto AGIL hacia una plataforma institucional completa de operaciones móviles con tablets.
