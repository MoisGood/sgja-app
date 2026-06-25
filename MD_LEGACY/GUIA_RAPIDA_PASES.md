# 🚀 Guía Rápida - Gestión de Pases

## 🎯 Inicio Rápido

### 1. Acceder al Módulo
1. Inicia sesión como **ADMIN**, **INSPECTOR** o **PROFESOR**
2. En el menú, ve a **📖 Justificaciones → Gestión de Pases**
3. Verás 3 opciones: ➕ Crear Pase | 📋 Ver Pases | 📊 Historial

---

## 📝 Crear un Pase (Tab 1: ➕)

### Paso 1: Seleccionar Estudiante
```
🔘 Selecciona estudiante del dropdown
   └─ Aparecen: Nombre, Curso, RUT
```

### Paso 2: Autocompletar Datos
```
✅ Curso → Se autocompleta
✅ RUT   → Se autocompleta
```

### Paso 3: Definir Tipo
```
Opciones:
┌─ Atraso (llegada tarde)
└─ Inasistencia (no llegó)
```

### Paso 4: Fecha y Hora
```
📅 Fecha: Selecciona del calendario
🕐 Hora:  Ingresa en formato HH:MM
```

### Paso 5: Motivo
```
Opciones predefinidas:
├─ ENFERMEDAD (requiere certificado)
├─ CITA_MEDICA (requiere certificado)
├─ TRANSPORTE (sin certificado)
├─ RAZONES_FAMILIARES (sin certificado)
└─ Otros (ingresa el motivo, máx 20 caracteres)
```

### Paso 6: Guardar
```
Botón: ✓ Crear Pase
└─ Si todo es correcto → ✅ "Pase creado exitosamente"
└─ Si hay error → ❌ Muestra mensaje de error
```

### Ejemplo Completo
```
┌────────────────────────────────────────┐
│ Crear Pase                             │
├────────────────────────────────────────┤
│ Estudiante: Juan Pérez - 1°A         │
│ Tipo: Atraso                          │
│ Fecha: 23-03-2026                     │
│ Hora: 08:15                           │
│ Motivo: ENFERMEDAD                    │
│                                        │
│ [✓ Crear Pase]                        │
│ ✅ Pase creado exitosamente           │
└────────────────────────────────────────┘
```

---

## 📋 Ver Pases por Curso (Tab 2: 📋)

### Visualizar Pases
```
┌─────────────────────────────────────┐
│ Curso: 1°A                          │
├─────────────────────────────────────┤
│ Estudiante    │ Tipo      │ Motivo  │
│────────────────────────────────────│
│ Juan Pérez    │ Atraso    │ Enferm. │
│ RUT: 19123456 │ 08:15     │         │
│               │           │ [📊][✕] │
├─────────────────────────────────────┤
│ ◀ Anterior │ Página 1 de 1 │ Siguiente ▶
└─────────────────────────────────────┘
```

### Acciones Rápidas
```
📊 Historial
└─ Click para ver últimos 10 atrasos del estudiante

✕ Anular
└─ Click para cancelar el pase
└─ Requiere confirmación
```

### Paginación
```
- Si hay múltiples cursos:
  └─ ◀ Anterior → Página anterior
  └─ Siguiente ▶ → Página siguiente
```

---

## 📊 Ver Historial (Tab 3: 📊)

### Historial del Estudiante
```
┌────────────────────────────────────┐
│ Historial de Atrasos               │
│ Juan Pérez - 1°A                   │
├────────────────────────────────────┤
│ Últimos 10 atrasos:                │
│                                    │
│ Fecha       Motivo          Estado │
│ 23-03-2026  Enfermedad   [Aprob.] │
│ 08:15                             │
├────────────────────────────────────┤
│ Calendario del mes actual          │
│                                    │
│ Marzo 2026                         │
│ Lun Mar Mié Jue Vie Sáb Dom       │
│              1   2   3   4   5     │
│  6   7   8   9  10  11  12        │
│ ...                [23] ...        │ ← Hoy
│                                    │
│ [Volver]                           │
└────────────────────────────────────┘
```

### Información del Historial
```
- Muestra máximo 10 últimos atrasos
- Ordenado de más reciente a más antiguo
- Incluye estado de cada pase
- Calendario interactivo del mes actual
```

---

## ⚠️ Validaciones Importantes

### Errores Comunes

❌ **"Debes seleccionar un estudiante"**
```
Solución: Selecciona un estudiante del dropdown
```

❌ **"Debes especificar el motivo personalizado"**
```
Solución: Si elegiste "Otros", ingresa el motivo (máx 20 caracteres)
```

❌ **Motivo no se guarda**
```
Verificar:
- Motivo no esté vacío
- Si es "Otros", verificar que haya texto
```

### Validaciones Automáticas
```
✅ Fecha: Solo puedes seleccionar fechas válidas
✅ Hora: Formato automático HH:MM
✅ Motivo personalizado: Límite 20 caracteres (se corta automáticamente)
```

---

## 💡 Tips y Trucos

### 1. Autocompletar Rápido
```
Cuando seleccionas estudiante:
- Curso se llena automáticamente ✅
- RUT se llena automáticamente ✅
→ No necesitas escribir nada
```

### 2. Cambiar de Motivo a "Otros"
```
1. Selecciona motivo "Otros"
2. Aparece campo de texto
3. Escribe el motivo (máx 20 caracteres)
4. Click crear pase
```

### 3. Buscar Historial de Estudiante
```
1. Ve a tab "Ver Pases"
2. Encuentra al estudiante en la tabla
3. Click botón "Historial"
4. Se abre automáticamente tab 3
```

### 4. Anular Pase Erróneo
```
1. Ve a tab "Ver Pases"
2. Click "Anular" en el pase
3. Confirma en la pregunta
4. El pase se marca como anulado
→ No se elimina, solo se marca inactivo
```

---

## 🔄 Flujos de Trabajo Comunes

### Flujo 1: Crear y Revisar Pase
```
1. ➕ Crear Pase → Completa formulario → Guardar
2. 📋 Ver Pases → Verifica que aparezca
3. ✅ Listo
```

### Flujo 2: Revisar Historial de Estudiante
```
1. 📋 Ver Pases → Encuentra estudiante
2. Click [📊 Historial]
3. 📊 Historial → Ve últimos 10 atrasos
4. [Volver] → Regresa a Ver Pases
```

### Flujo 3: Anular Pase Erróneo
```
1. 📋 Ver Pases → Busca pase
2. Click [✕ Anular]
3. Confirma → Se marca como anulado
4. ✅ No aparece en acciones
```

### Flujo 4: Ver Calendario del Mes
```
1. 📋 Ver Pases → Estudiante → [📊 Historial]
2. 📊 Historial → Desplaza abajo
3. Ves "Calendario del mes actual"
4. Hoy está resaltado en azul
```

---

## 🎯 Casos de Uso Reales

### Caso 1: Estudiante Llega Atrasado
```
PROFESOR registra el atraso:
1. ➕ Crear Pase
2. Estudiante: Juan Pérez
3. Tipo: Atraso
4. Fecha: Hoy
5. Hora: 08:15 (cuando llegó)
6. Motivo: TRANSPORTE (se paró el bus)
7. ✓ Crear Pase
✅ Queda registrado para revisión del INSPECTOR
```

### Caso 2: Estudiante Falta sin Aviso
```
INSPECTOR registra la inasistencia:
1. ➕ Crear Pase
2. Estudiante: María González
3. Tipo: Inasistencia
4. Fecha: Ayer
5. Hora: 08:00 (inicio de clases)
6. Motivo: Otros
7. Motivo personalizado: "No avisó"
8. ✓ Crear Pase
✅ Pase registrado para seguimiento
```

### Caso 3: Estudiante Repite Atrasos
```
ADMIN revisa historial:
1. 📋 Ver Pases → Busca estudiante
2. Click [📊 Historial]
3. Ve 5 atrasos en el último mes
4. Analiza patrones
✅ Puede tomar acciones disciplinarias
```

---

## 🔒 Permisos por Rol

| Acción | ADMIN | INSPECTOR | PROFESOR | ESTUDIANTE |
|--------|-------|-----------|----------|-----------|
| Crear Pase | ✅ | ✅ | ✅ | ❌ |
| Ver Pases | ✅ | ✅ | ✅ | ❌ |
| Ver Historial | ✅ | ✅ | ✅ | ❌ |
| Anular Pase | ✅ | ✅ | ✅ | ❌ |
| Acceder Módulo | ✅ | ✅ | ✅ | ❌ |

---

## 📞 Solución de Problemas

### Problema: No veo el módulo en el menú
**Solución**: 
- Verifica que hayas iniciado sesión como ADMIN, INSPECTOR o PROFESOR
- No aparece para ESTUDIANTE ni APODERADO

### Problema: No aparecen estudiantes en dropdown
**Solución**:
- Verifica que existan estudiantes en el establecimiento
- Ejecuta: `node scripts/seed-data.cjs`

### Problema: Pase no se guarda
**Solución**:
- Verifica que no haya error en pantalla
- Revisa que tengas conexión a internet
- Intenta nuevamente

### Problema: Historial vacío
**Solución**:
- Estudiante no tiene atrasos registrados
- Ve a "Crear Pase" para agregar uno primero

### Problema: Calendario no se ve
**Solución**:
- Desplaza hacia abajo en tab Historial
- Está debajo de la tabla de atrasos

---

## 📊 Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| Tab | Navega entre campos |
| Enter | Envía formulario |
| Esc | Cierra modal (si aplica) |

---

## 🎓 Videos Educativos (Sugerido)

Se recomienda crear tutoriales en video para:
- ✏️ Crear un pase
- 👁️ Ver pases y filtrar
- 📅 Consultar historial
- ❌ Anular un pase

---

## 📝 Checklista Diaria

```
☐ Revisar pases nuevos (tab Ver Pases)
☐ Anular pases errados
☐ Revisar historial de estudiantes problemáticos
☐ Generar reportes (próxima versión)
☐ Comunicar con apoderados si es necesario
```

---

## 🔗 Enlaces Relacionados

- 📋 Documentación completa: `GESTION_PASES.md`
- 🔧 Implementación técnica: `IMPLEMENTACION_PASES.md`
- 📖 Manual del Sistema: `README.md`

---

## 💬 Feedback y Sugerencias

Si encuentras bugs o tienes sugerencias:
1. Anota qué hiciste
2. Anota qué esperabas
3. Anota qué pasó
4. Contacta al administrador

---

**¡Estás listo para usar Gestión de Pases!** 🚀

Última actualización: 23 de marzo de 2026
