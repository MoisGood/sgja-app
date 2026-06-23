# Módulo Académico — Análisis y Plan de Implementación

## Paradigma: Aprendizaje Autodirigido con Orquestación Digital

### Premisa

El docente tradicional es reemplazado por un **Monitor** (persona multifuncional) que orquesta el sistema y los estudiantes. El departamento P.I.E. se enfoca exclusivamente en quienes necesitan apoyo profundo. El sistema es el motor pedagógico: diagnostica, recomienda, evalúa y orquesta las estaciones de aprendizaje.

### Referentes

- **SOLE (Sugata Mitra)**: Niños aprenden solos con una computadora si el entorno es estimulante
- **Videojuegos**: Tutorial interactivo, dificultad adaptativa, feedback inmediato, motivación intrínseca
- **Salas de aprendizaje**: Distintos espacios con distintos estímulos (cognitivo, audiovisual, colaborativo, práctico)

### Roles rediseñados

| Rol tradicional | Nuevo rol | Función |
|----------------|-----------|---------|
| Docente | Monitor / Guía | Orquesta salas, resuelve dudas puntuales, ve dashboard |
| Jefe UTP | Diseñador curricular | Define objetivos, configura estaciones, analiza métricas |
| PIE | Intervención especializada | Recibe alertas del sistema, trabaja con estudiantes en riesgo |
| Estudiante | Sujeto activo | Elige ruta, avanza a su ritmo, colabora, investiga |

---

## Principios de diseño

1. **Offline-first**: PWA + IndexedDB. El 100% funciona sin internet.
2. **QR como puente digital-físico**: Cada estudiante tiene un código único. Las actividades lo usan para registro y trazabilidad.
3. **Estudiante como eje**: Todo gira en torno al estudiante y su ritmo.
4. **IA como orquestadora**: Detecta patrones, sugiere cambios de sala, alerta al monitor y al PIE.
5. **Salas de aprendizaje**: El espacio físico se divide en estaciones con distintos estímulos.
6. **Integración con Moodle (futuro)**: Moodle es el repositorio de contenido. El sistema es el cerebro pedagógico.

---

## Concepto: Sala de Aprendizaje

| Sala | Estímulo | Actividad | Tecnología |
|------|----------|-----------|------------|
| **Cognitiva** | Individual | Diagnóstico adaptativo, ejercicios progresivos, test de conocimiento | Pantalla táctil, lápiz óptico |
| **Audiovisual** | Grupal | Video interactivo, simulación, realidad virtual (futuro) | Proyector, audífonos, VR |
| **Colaborativa** | Grupal | Resolución de problemas en equipo, debates, proyectos | Mesa táctil, pizarra digital |
| **Investigativa** | Individual/Grupal | Búsqueda guiada, experimentos, análisis de casos | Navegador web controlado, laboratorio físico |
| **Práctica** | Individual | Ejercicios kinestésicos, construcción, arte | Material físico, sensores |
| **Evaluación** | Individual | Prueba formal impresa con QR, captura con móvil, corrección automática | Impresión QR + cámara |

### Flujo diario

```
Monitor → Abre plataforma → Ve dashboard del día
       → Asigna estudiantes a salas según planificación
       → El sistema guía a cada estudiante a su sala
       
Estudiante → Ingresa con su QR
           → La sala detecta su llegada (QR + registro automático)
           → Realiza la actividad de la sala
           → Al terminar, el sistema recomienda la siguiente sala
           
Monitor → Ve en tiempo real:
        - Quién está en cada sala
        - Progreso de cada estudiante
        - Alertas de estudiantes atascados
        - Recomendaciones de la IA
        
PIE → Recibe alertas automáticas de estudiantes con:
     - Bajo rendimiento sostenido
     - Dificultades en múltiples salas
     - Patrones de desconexión
     → Interviene con apoyo especializado
     
Sistema → Al final del día:
        - Genera reporte de avance por estudiante
        - Actualiza perfil de aprendizaje
        - Sugiere ajustes en la planificación
```

---

## Fase 1 — Básico: Registro de Desempeño

### Objetivo
Reemplazar el libro de clases físico. El monitor registra el desempeño del estudiante en cada sala. El sistema calcula métricas y genera reportes.

### Flujo

```
Monitor → Crea actividad de sala (nombre, fecha, sala, ponderación, asignatura)
        → Ingresa desempeño (1.0 - 7.0) por estudiante
        → Sistema calcula: promedio, tendencia, alertas
        → Genera reportes: por estudiante, por sala, por asignatura
```

### Tablas base

```sql
asignaturas (id, nombre, nivel, horas_semanales, activo)

periodos (id, nombre, fecha_inicio, fecha_fin, activo)

salas_aprendizaje (id, nombre, tipo, capacidad, activo)
-- tipo: cognitiva, audiovisual, colaborativa, investigativa, practica, evaluacion

actividades (id, id_asignatura, id_periodo, id_sala, nombre, ponderacion, fecha, activo)

desempeno (id, id_actividad, id_estudiante, nota, observaciones, created_at, activo)

promedios (id, id_estudiante, id_asignatura, id_periodo, promedio_final, estado, activo)
```

### Dashboard del monitor

```
┌────────────────────────────────────────────────────────────┐
│  📊 Panel de Monitoreo   2026 · Semestre 1                 │
├────────────────────────────────────────────────────────────┤
│  Asignatura: Matemática    Sala: Cognitiva                 │
├───────────┬────────────────────────────────────────────────┤
│ Estudiante│ Desempeño                          ┌─────────┐ │
│───────────│                                     │+Nueva   │
│ Pérez     │ ████████ 6.5 ✅  Progreso: 80%     │Actividad│
│ González  │ ██████   4.0 ✅  Progreso: 65%     └─────────┘ │
│ Muñoz     │ ███      2.3 ❌  Progreso: 30%  ⚠️              │
│───────────│─────────────────────────────────────────────── │
│ Rodríguez │ ███████  5.8 ✅  Progreso: 70%                 │
│ Soto      │ ████     3.5 ⚠️  Progreso: 40%                │
├───────────┴────────────────────────────────────────────────┤
│ Promedio sala: 4.8  |  Tasa progreso: 68%                  │
│ 📈 [Tendencia sala]  📉 [Comparación entre salas]          │
│                                                             │
│ 🚨 Alertas: 2 estudiantes requieren revisión PIE           │
└────────────────────────────────────────────────────────────┘
```

---

## Fase 2 — Medio: Evaluación con QR

### Objetivo
El monitor genera una prueba formal, la imprime con QR único por estudiante, el estudiante responde en papel, el monitor captura con el móvil y el sistema corrige automáticamente.

### Flujo

```
Monitor → Crea prueba desde plantilla o nuevo diseño
        → Define preguntas con alternativas
        → Sistema genera PDF por estudiante con QR único
        → Imprime y aplica en Sala de Evaluación
        → Estudiante marca círculos
        → Monitor captura hojas con cámara del móvil
        → QR identifica estudiante + prueba
        → Detección de círculos → respuestas
        → Corrección automática contra plantilla
        → Nota se registra en desempeño
        → Estadísticas: por pregunta, por estudiante, curva
        → IA sugiere qué sala recomendar según resultados
```

### Tablas adicional

```sql
preguntas (id, id_asignatura, tipo, enunciado, alternativas_json, respuesta_correcta, dificultad, activo)

pruebas (id, id_actividad, instrucciones, preguntas_ids, created_at, activo)

pruebas_estudiante (id, id_prueba, id_estudiante, qr_hash, pdf_url, estado, created_at)

respuestas (id, id_prueba_estudiante, id_pregunta, alternativa_marcada, correcta, created_at)

resultados_prueba (id_prueba, id_estudiante, puntaje_total, nota)
```

### Algoritmo de detección de círculos

```
1. Capturar imagen desde cámara → canvas 2D
2. Escala de grises
3. Umbral adaptativo (binarización)
4. Detección de contornos (Canny)
5. Filtrar:
   - Relación aspecto 0.8-1.2 (circular)
   - Radio > 8px
   - Densidad píxeles oscuros > umbral
6. Mapa de respuestas → [A, B, C, D, E] → [0, 1, 0, 0, 0]
7. Comparar con plantilla → puntaje → nota
```

---

## Fase 3 — Avanzado: Diagnóstico y Rutas Personalizadas

### Objetivo
Plataforma que diagnostica al estudiante, le asigna salas según su perfil, recomienda contenido y mide progreso en tiempo real.

### Flujo

```
Estudiante → Ingresa con QR a Sala Cognitiva
           → Test diagnóstico adaptativo (15-20 preguntas)
           → IA analiza: fortalezas, debilidades, estilo de aprendizaje
           → Asigna ruta personalizada:
              - Sala Audiovisual → si necesita contexto visual
              - Sala Colaborativa → si aprende en grupo
              - Sala Cognitiva → si necesita práctica individual
              - Sala Investigativa → si tiene base y necesita profundizar
           → Monitor ve dashboard con rutas asignadas
           → Estudiante rota entre salas según progreso
           → Alerta al monitor si el estudiante se estanca
           → Alerta al PIE si detecta patrón de dificultad severa
```

### Algoritmo adaptativo

```
1. Banco de preguntas etiquetadas por:
   - Eje temático (números, álgebra, geometría, datos)
   - Habilidad (conocer, aplicar, analizar, evaluar, crear)
   - Dificultad (1-5)
   - Sala recomendada si falla

2. Comienza con dificultad media (3)

3. Por cada respuesta:
   - Correcta → +1 dificultad
   - Incorrecta → -1 dificultad

4. Tras 15-20 preguntas estima:
   - Nivel por eje temático
   - Nivel por habilidad
   - Sala prioritaria para reforzar

5. Sistema asigna siguiente sala automáticamente

6. Monitor confirma o ajusta
```

### Tablas adicional

```sql
perfiles_aprendizaje (id, id_estudiante, id_asignatura, nivel_general, ejes_json, habilidades_json, sala_recomendada, ultima_actualizacion)

rutas_aprendizaje (id, id_estudiante, id_asignatura, salas_json, progreso, estado, activo)
-- salas_json: orden de salas asignadas + estado de cada una

sesiones_sala (id, id_estudiante, id_sala, id_actividad, hora_entrada, hora_salida, metricas_json, activo)

contenido (id, id_asignatura, titulo, tipo, url, nivel_dificultad, sala_origen, activo)

progreso_contenido (id, id_estudiante, id_contenido, estado, intentos, puntaje_post, created_at)
```

### Dashboard del monitor con rutas

```
┌──────────────────────────────────────────────────────────────────┐
│  📈 Panel de Aprendizaje — Matemática · 3° Medio A              │
├──────────────────────────────────────────────────────────────────┤
│  Sala activa: Cognitiva  |  Estudiantes en sala: 12/30          │
│  Ocupación: 🟢 Cog 40%  🟡 Aud 25%  🔵 Col 20%  🟣 Inv 15%    │
├──────────────────────────────────────────────────────────────────┤
│  Distribución de rutas                            Alertas        │
│ ┌──────────────────────────────────────────────┐│ ⚠️ Muñoz      │
│ │ 🔵 Pérez   → Cog → Col → Inv → Aud  ████ 80%││   Atascado en │
│ │ 🟢 González → Cog → Aud → Col       ██   30%││   Cognitiva   │
│ │ 🔴 Muñoz   → Cog (repite)           █    10%││   3 días      │
│ │ 🟣 Rodríguez → Cog → Inv → Aud      ████ 75%││               │
│ │ 🟢 Soto    → Cog → Col → Aud       ███   55%││ 🚨 PIE: Pérez │
│ └──────────────────────────────────────────────┘│   bajo rendim │
│                                                  │   sostenido   │
│ [🎯 Reasignar sala] [📊 Ver detalle]             │               │
└──────────────────────────────────────────────────────────────────┘
```

### Integración con IA

```json
{
  "context": "Resultados de 30 estudiantes en Sala Cognitiva",
  "data": {
    "preguntas": [
      { "id": 1, "eje": "numeros", "habilidad": "aplicar", "aciertos": 22, "total": 30 },
      { "id": 2, "eje": "algebra", "habilidad": "analizar", "aciertos": 8, "total": 30 }
    ],
    "estudiantes_riesgo": ["id_5", "id_12"],
    "rutas_actuales": { ... }
  },
  "instruccion": "Analiza y genera: 1) Resumen de la sesión 2) 3 estudiantes que deberían cambiar de sala 3) Alertas para PIE 4) Sugerencia de contenido para cada sala"
}
```

---

## Fase 4 — Futuro: Sala Inteligente con Visión Artificial

### Visión

| Componente | Descripción | Tecnología |
|------------|-------------|------------|
| **Asistencia facial** | Cámara detecta rostros al entrar a la sala | TensorFlow.js |
| **Monitoreo de atención** | Detecta si el estudiante está enfocado o distraído | TensorFlow.js |
| **Reconocimiento de gestos** | Estudiante levanta la mano → alerta al monitor | TensorFlow.js |
| **Test interactivo táctil** | Estudiante responde con gestos, arrastre, dibujo | Canvas + Touch |
| **Evaluación de habilidades blandas** | Participación, turnos, comunicación en sala colaborativa | Métricas de interacción |

### Flujo aula del futuro

```
1. Entrada → Cámara detecta estudiantes → Registro automático en sala
2. Instrucción → Sistema reproduce contenido según ruta del estudiante
3. Monitoreo → IA detecta desconexión → Alerta al monitor
4. Interacción → Estudiante responde en pantalla táctil:
   - Análisis: ordenar, clasificar, relacionar
   - Investigación: buscar en material, sintetizar
   - Resolución: resolver problema paso a paso
5. Síntesis → Sistema genera reporte por habilidad
6. Cierre → Recomienda siguiente sala según desempeño
```

---

## Integración con Moodle

```
┌──────────────────────┐          ┌──────────────────────┐
│     Sistema          │◄────────►│      Moodle           │
│  (orquestador)       │   API    │   (repositorio LMS)   │
│                      │          │                       │
│ - Rutas aprendizaje  │          │ - Contenido asincrónico│
│ - Diagnóstico IA     │          │ - Foros               │
│ - Desempeño por sala │          │ - Tareas              │
│ - Alertas PIE        │          │ - Certificaciones     │
│ - Dashboard monitor  │          │                       │
└──────────────────────┘          └──────────────────────┘
```

| Dato | Origen | Destino | Frecuencia |
|------|--------|---------|------------|
| Desempeño | Sistema | Moodle | Diario |
| Estudiantes | Moodle → inicial | Sistema | Semestral |
| Contenido | Moodle | Sistema (caché offline) | Al conectarse |
| Diagnósticos | Sistema | Moodle (campo personalizado) | Después del test |

---

## Roadmap

```
Q2 2026 ──── Módulos base (tickets, equipos, mapa) ✅

Q3 2026 ──── Registro de desempeño por sala (básico)
                 ↓
Q4 2026 ──── Evaluación digital con QR + corrección automática
                 ↓
Q1 2027 ──── Diagnóstico adaptativo + rutas personalizadas + alertas PIE
                 ↓
Q2 2027 ──── Integración Moodle
                 ↓
Q3 2027 ──── Piloto en establecimiento real
                 ↓
2028     ──── Sala inteligente con visión artificial
```

---

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Monitores no adoptan el sistema | Alto | Capacitación gradual, interfaz simple, modo offline |
| Internet inestable | Alto | PWA + IndexedDB + SQLite futuro |
| Resistencia al cambio | Medio | Mostrar reducción de carga administrativa |
| Privacidad de datos (Ley 21.719) | Alto | Datos cifrados, logs de acceso, roles |
| Dependencia de una persona | Medio | Documentación, código modular, formación de segundo monitor |
| Integración Moodle frágil | Medio | API versionada, fallback manual |

---

## Notas para implementación

1. **Estructura de archivos**: Los módulos académicos vivirán en `src/pages/academico/` con componentes y servicios propios.
2. **Tecnologías futuras**: OpenCV.js (detección de círculos), TensorFlow.js (visión), Web Speech API, jsPDF.
3. **Offline-first**: Toda la lógica académica funciona sin conexión. La sincronización es diferida.
4. **QR**: El sistema actual ya tiene zxing-wasm. Se reutiliza para identificación y evaluaciones.
5. **Salas como eje**: La tabla `salas_aprendizaje` es central. Todo actividad, ruta y reporte se organiza en torno a ella.
