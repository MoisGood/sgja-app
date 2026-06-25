# Pauta de Mejoras en Diseño para Dashboard de Técnico

## Análisis Preliminar
Tras revisar el componente `src/pages/Tecnico.tsx` y considerando las necesidades operativas del rol de técnico en SGJA, se identifican oportunidades de diseño enfocadas en:
- Reducir carga cognitiva mediante mejor jerarquía visual
- Aumentar visibilidad de estados críticos y alertas
- Acelerar acceso a acciones frecuentes
- Mejorar consistencia y retroalimentación de interfaz
- Optimizar para tareas típicas: monitoreo, respuesta rápida a incidentes, gestión de equipos

Estas propuestas se enfocan exclusivamente en aspectos de diseño (UI/UX) sin modificar la lógica de negocio subyacente.

## Pauta de Implementación (Cambios de Diseño Numerados)
A continuación, los cambios propuestos enumerados para seguimiento incremental. Cada punto representa una mejora de diseño específica, independiente y verificable:

1. **Iconos descriptivos en pestañas de navegación**
   Añadir iconos significativos junto al texto de cada tab para identificación visual inmediata: 
   🗺️ Mapa, 🎫 Tickets, 💻 Equipos, 👥 Usuarios, ⚙️ Configurar, 🎨 Editor

2. **Indicadores de estado dinámicos en pestañas**
   Implementar puntos de color (rojo/naranja/verde) en las pestañas para alertas en tiempo real:
   - Rojo en "Tickets" si hay ≥3 tickets urgentes sin atender
   - Naranja en "Equipos" si hay equipos con mantenimiento vencido
   - Verde cuando todo está normal

3. **Avatar de usuario contextual en barra superior**
   Mostrar foto/íniciales del usuario con nombre corto y rol (ej.: "Ana G. • Técnico") alineado a la derecha para acceso rápido a perfil y cierre de sesión

4. **Capa de calor de incidencias en mapa**
   Implementar visualización opcional de densidad de tickets abiertos mediante degradado (verde→rojo) para identificar zonas críticas de forma inmediata

5. **Estado de conectividad de equipos en mapa**
   Mostrar íconos claros de estado (🟢 Conectado / 🔴 Desconectado) sobre los equipos en el mapa indicando disponibilidad en tiempo real

6. **Panel lateral informativo contextual en mapa**
   Al hacer clic en un equipo o zona, mostrar panel colapsable con:
   - Último ticket asociado y su estado
   - Estado actual del equipo (Operativo, En Mantenimiento, Falla)
   - Próximo mantenimiento programado
   - Acciones rápidas: "Ver historial", "Crear ticket relacionado"

7. **Tarjetas métricas de estado en pestaña Tickets**
   Añadir sección resumen visual encima de la tabla con contadores por estado:
   - 🟢 Abiertos (con número)
   - 🟡 En Proceso (con número)
   - 🟢 Resueltos Hoy (con número)
   - ⏳ Vencidos (con número y alerta visual roja)
   Cada tarjeta al click aplica filtro automático a la tabla

8. **Vista alternativa de Línea de Tiempo en Tickets**
   Ofrecer opción de visualización de tickets en formato cronológico vertical (además de tabla) para mejor seguimiento de incidentes complejos o recurrentes

9. **Sistema de acciones en lote mejorado en Tickets**
   Implementar:
   - Checkbox de selección por fila
   - Menú agrupado en cabecera con operaciones: 
     * Cambiar estado de seleccionados 
     * Asignar a mí
     * Exportar filtrado (CSV)
   - Tooltips explicativos al hover sobre todos los íconos de acción

10. **Rediseño de lista de Equipos a vista de tarjetas informativas**
    Transformar tabla densa en tarjetas por equipo con:
    - Miniatura/foto del equipo (si disponible)
    - Indicadores visuales: barra de progreso para vida útil restante, icono de advertencia si mantenimiento pendiente <7 días
    - Acciones primarias destacadas: "Ver historial", "Crear ticket", "Programar mantenimiento"
    - Información clave: ubicación, Tipo de equipo, estado operativo

11. **Barra de filtros persistente y avanzada en Equipos**
    Mantener siempre visible la barra de filtros (tipo de equipo, estado operativo, ubicación/zona, próximo mantenimiento) para ajustes rápidos sin menús expandibles

12. **Indicadores de actividad y estado en lista de Usuarios**
    Añadir información contextual:
    - Última actividad: "Activo hace 2h", "Inactivo >3d"
    - Última acción realizada si está disponible (ej.: "Actualizó equipos ayer")
    - Indicador visual de disponibilidad para asignación inmediata

13. **Filtros por rol táctico en gestión de Usuarios**
    Implementar botones de filtro rápido para vistas especializadas:
    - [Todos] [Técnicos] [Administrativos] [Docentes] [Apoderados]
    (Facilita asignación de recursos según roles operativos)

14. **Sistema global de tooltips contextuales**
    Implementar explicaciones emergentes al hover sobre:
    - Todos los íconos de interacción (✏️, ▶️, ✓, ✕, 🗑️, ⚙️, etc.)
    - Botones primarios y secundarios
    - Campos de formulario con validaciones especiales
    - Indicadores de estado y métricas
    Para reducir errores de interacción y curva de aprendizaje

15. **Indicador global y permanente de estado de conexión**
    Mostrar siempre visible en barra superior (ej.: 🟢 Conectado / 🔴 Reconectando... / ⚠️ Sin conexión o datos desactualizados) para awareness inmediato del estado de sincronización con backend

---
**Nota de uso**: Este documento constituye tanto el análisis de partida como la pauta de trabajo acordada. Los items numerados servirán como checklist de implementación. Se recomienda iniciar con los items 1-3, 5, 7 y 9 para generar impacto inicial significativo con esfuerzo moderado de diseño/implementación.