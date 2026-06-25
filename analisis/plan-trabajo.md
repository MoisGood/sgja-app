# Plan de Trabajo — Módulo Académico

## 1. Workflow general

```
┌─────────────────────────────────────────────────────────────────┐
│  Ciclo de desarrollo por feature                                   │
│                                                                    │
│  Análisis ────► Diseño ────► Código ────► Pruebas ────► Documentación ────► Difusión
│     │              │              │            │              │               │
│     └────── Docs ──┘              └──── Commit ─┘              └── Blog post ──┘
│                                                                    │
│  Cada feature pasa por:                                            │
│  1. README.md con análisis y decisión                              │
│  2. Commit con código                                              │
│  3. Post en blog interno explicando el cambio                      │
│  4. Difusión en RRSS internas (WhatsApp, grupos)                  │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Registro de Desempeño (detalle)

Es la Fase 1 — reemplazar el Excel/libro de clases:

| Componente | Qué hace |
|------------|----------|
| **CRUD de actividades** | El monitor crea una actividad (nombre, fecha, ponderación, sala, asignatura) |
| **Registro de desempeño** | El monitor ingresa nota 1.0–7.0 por estudiante por actividad |
| **Cálculo de promedios** | El sistema calcula promedio ponderado por asignatura y periodo |
| **Reportes** | Dashboard con distribución, tendencia, alertas de bajo rendimiento |
| **Alertas PIE** | Si un estudiante mantiene promedio < 4.0 en 2+ actividades consecutivas |

**¿Qué necesito de ti para avanzar?**
- ¿El registro de desempeño debe tener captura de datos offline (PWA + IndexedDB) desde el inicio, o arrancamos online y agregamos offline después?
- ¿El monitor registra uno por uno o necesita una vista tipo "planilla" donde ve a todos los estudiantes y llena notas en lote?

## 3. Intranet + Blog

| Elemento | Descripción |
|----------|-------------|
| Ubicación | Dentro de la app, nueva ruta `/blog` |
| Visibilidad | Solo usuarios autenticados (interna) |
| Contenido inicial | Posts explicando cada módulo nuevo, casos de uso, tutoriales |
| Generación automatizada | IA genera borrador del post al terminar cada feature |
| Integración RRSS | Botón compartir que abre WhatsApp con mensaje predefinido |
| Frecuencia | 1 post por feature + 1 semanal de tips |

**Dudas:**
- ¿El blog necesita comentarios o solo es lectura?
- ¿Quién escribe: tú revisas el borrador de IA o quieres que publique directo?

## 4. Claude Code vs opencode

| Aspecto | opencode | Claude Code |
|---------|----------|-------------|
| **Costo** | Gratuito (open source) | $20/mes Pro o $0.003/request API |
| **Modelo** | Usa el que configures (varios providers) | Solo Claude (Sonnet/Opus/Haiku) |
| **Calidad** | Depende del modelo que le pongas | Claude 4 Sonnet es excelente en código |
| **Offline** | Depende del provider | No, necesita internet |
| **Económico** | ✅ Sí, gratis | $20/mes fijo |

Recomendación: **opencode** es más económico (gratis + el modelo que elijas). Si quieres máxima calidad para tareas complejas, **Claude Code** con Claude Sonnet vale la $20/mes. Pero no necesitas ambos.

Mi recomendación concreta: quédate con **opencode** y usa un modelo potente pero barato (Claude Sonnet vía API o similar). El costo es mínimo comparado con el valor que produce.

## 5. Fechas push

Son fechas límite donde el sistema debe estar listo para mostrar a usuarios reales.

| Hito | Fecha tentativa | Qué debe estar listo |
|------|----------------|----------------------|
| Push 1 — Registro de desempeño | Q3 2026 | CRUD actividades + notas + promedios + dashboard básico |
| Push 2 — Blog interno | Q3 2026 | Blog funcional + primer post explicando el sistema |
| Push 3 — Evaluación QR | Q4 2026 | Generación de prueba, QR, captura móvil, corrección automática |
| Push 4 — Diagnóstico adaptativo | Q1 2027 | Test adaptativo + rutas personalizadas + alertas PIE |
| Push 5 — Piloto EE real | Q3 2027 | Todo el módulo académico funcionando en un establecimiento |

**Necesito que confirmes o ajustes estas fechas.**

## 6. Contenido automatizado

Flujo propuesto:

```
1. Terminas feature → haces commit
2. Ejecutas script o prompt que:
   - Lee el diff del commit
   - Lee el análisis en analisis/README.md
   - Genera borrador de post para el blog
3. Revisas, ajustas, publicas
4. El post se difunde automáticamente a grupos de WhatsApp/RRSS
```

**¿Quieres que integremos esto como una herramienta en el mismo proyecto?** (Ej: un script Node que lee el último commit y genera el post)

## 7. Próximos pasos inmediatos

1. ✅ Me dices si las fechas push te calzan
2. ✅ Confirmas si el registro de desempeño arranca online u offline-first
3. ✅ Definimos si el blog tiene comentarios o no
4. ✅ Arrancamos con la estructura de tablas y componentes del módulo académico
