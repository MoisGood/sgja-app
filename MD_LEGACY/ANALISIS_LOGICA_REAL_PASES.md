# 📚 Análisis: Lógica Real de Flujo de Atrasos/Inasistencias

## 🎯 Flujo Actual Real (Como Funciona en el Colegio)

### **INICIO: Profesor Pasa Lista (Antes de clase)**

```
┌─────────────────────────────────────────────────────┐
│ LIBRO DE CLASES (Profesor - Inicio de bloque)      │
│                                                     │
│ Bloque 1 (08:00-09:00)                             │
│ ┌───────────────────────────────────────────────┐  │
│ │ □ Juan López      (PRESENTE)                  │  │
│ │ ☒ María García    (AUSENTE)                   │  │
│ │ □ Carlos Díaz     (PRESENTE)                  │  │
│ │ ☒ Sofia Mendez    (AUSENTE)                   │  │
│ └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### **ESCENARIO 1: María Llega Tarde (Atraso)**

```
TIMELINE:
08:15 - María llega al aula
        │
        └─► Profesor ve a María entrando tarde
            └─► Genera PASE DE ATRASO en Web/Móvil
                ├─ Tipo: ATRASO
                ├─ Hora: 08:15
                ├─ Bloque: 1 (08:00-09:00)
                └─ Estado: INJUSTIFICADA
            
            └─► Profesor ACTUALIZA libro de clases
                ├─ Cambia María de AUSENTE a PRESENTE
                └─ Anota "Atraso 08:15"

RESULTADO EN SISTEMA:
✓ Pase registrado
✓ María tiene ATRASO en su historial
✓ María cuenta como PRESENTE para asistencia
```

### **ESCENARIO 2: Sofia NO Llega (Inasistencia)**

```
TIMELINE:
09:00 - Termina Bloque 1 (clase finaliza)
        │
        └─► Profesor cierra lista de Bloque 1
            ├─ Sofia permanece como AUSENTE
            └─► NO genera pase (NO llegó en todo el bloque)

09:00-10:00 - Bloque 2
            │
            └─► ¿Qué pasó con Sofia?
                ├─ OPCIÓN A: Llegó al siguiente bloque
                │            └─► Genera PASE DE INASISTENCIA
                │                (faltó bloque anterior)
                │
                └─ OPCIÓN B: No llegó en todo el día
                             └─► INASISTENCIA registrada en Libro
```

---

## 🔄 Ciclo de Vida de un Pase

```
┌─────────────────────────────────────────────────────────────────┐
│ VIDA DE UN PASE (ATRASO O INASISTENCIA)                         │
└─────────────────────────────────────────────────────────────────┘

1️⃣ GENERACIÓN
   ├─ Profesor pasa lista al inicio del bloque
   ├─ Marca estudiante como AUSENTE
   └─ Registra HORA LÍMITE: fin del bloque (09:00, 10:00, etc.)

2️⃣ DETECCIÓN (Durante el bloque)
   ├─ Estudiante llega tarde → ATRASO
   ├─ Estudiante llega muy tarde (siguiente bloque) → INASISTENCIA
   └─ Estudiante no llega → INASISTENCIA

3️⃣ REGISTRO POR PROFESOR
   ├─ Genera pase: tipo, hora, bloque
   ├─ Marca en libro: PRESENTE
   └─ Estado inicial: INJUSTIFICADA

4️⃣ VALIDEZ DEL PASE
   ├─ ✓ VÁLIDO: Solo dentro del bloque correspondiente
   ├─ ✗ INVÁLIDO: Después del fin del bloque
   └─ 🔄 MODIFICABLE: Profesor puede cambiar o eliminar

5️⃣ JUSTIFICACIÓN (Inspectoría/Paradocente)
   ├─ Revisa documentación
   ├─ Cambia estado: INJUSTIFICADA → JUSTIFICADA/RECHAZADA
   └─ Agrega motivo (enfermo, cita médica, etc.)
```

---

## 🎓 Actores y sus Roles

```
┌────────────────────────────────────────────────────────────────┐
│ PROFESOR (Crea pases)                                          │
├────────────────────────────────────────────────────────────────┤
│ • Pasa lista al inicio de cada bloque                          │
│ • Marca estudiante como AUSENTE en libro                       │
│ • Ve llegar estudiante tarde → Genera ATRASO                  │
│ • Ve llegar en bloque siguiente → Genera INASISTENCIA         │
│ • Puede ELIMINAR o MODIFICAR sus propios pases                │
│ • RESPONSABLE DE: Precisión en hora/tipo                      │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ INSPECTORÍA/PARADOCENTE (Justifica pases)                      │
├────────────────────────────────────────────────────────────────┤
│ • Ve pases INJUSTIFICADAS                                      │
│ • Revisa documento/justificación del apoderado                 │
│ • Cambia estado: JUSTIFICADA (si válido) o RECHAZADA         │
│ • Agrega motivo: "Enfermo", "Cita médica", etc.              │
│ • RESPONSABLE DE: Validar documentación                        │
│ • PUEDE: Generar pases para estudiantes sin profesor           │
│         (ingresó sin pasar por libro)                          │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ADMIN (Control total)                                          │
├────────────────────────────────────────────────────────────────┤
│ • Ver todos los pases de todos                                 │
│ • Eliminar pases si es necesario                               │
│ • Generar reportes                                             │
│ • Control de auditoría                                         │
└────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Problemas Actuales en Sistema (Sin validación)

```
PROBLEMA 1: Profesor se equivoca con la hora
┌──────────────────────────────────────────┐
│ Bloque 2: 10:00-11:00                    │
│ Profesor registra: ATRASO a las 14:30    │ ❌ 4.5 horas después
│                                           │    (pasó de clases)
│ Sistema acepta: ✓ Registrado              │
│ Resultado: Pase inválido/sin sentido     │
└──────────────────────────────────────────┘

PROBLEMA 2: Profesor registra en bloque equivocado
┌──────────────────────────────────────────┐
│ Estudiante llega a Bloque 2 (10:00)       │
│ Profesor registra: ATRASO a las 08:15    │ ❌ En Bloque 1
│                                           │    (no existió)
│ Sistema acepta: ✓ Registrado              │
│ Resultado: Historial confuso              │
└──────────────────────────────────────────┘

PROBLEMA 3: Registrar atraso después del bloque
┌──────────────────────────────────────────┐
│ Bloque 1: 08:00-09:00                    │
│ Estudiante llega 08:50 (ATRASO válido)   │
│ Profesor llega tarde, registra a las 12:00│ ❌ Bloque terminó
│                                           │    hace 3 horas
│ Sistema acepta: ✓ Registrado              │
│ Resultado: Temporal inexacto              │
└──────────────────────────────────────────┘
```

---

## ✅ LÓGICA CORRECTA A IMPLEMENTAR

### **VALIDACIÓN AL CREAR PASE**

```typescript
interface ValidacionPase {
  valido: boolean;
  errores: string[];
  advertencias: string[];
  bloqueDetectado?: BloqueHorario;
}

function validarNuevoPase(
  tipo: TipoRegistro,
  fecha: string,
  hora: string,
  idEstudiante: string,
  bloques: BloqueHorario[]
): ValidacionPase {
  
  const errores: string[] = [];
  const advertencias: string[] = [];
  let bloqueDetectado: BloqueHorario | null = null;

  // ✓ VALIDACIÓN 1: ¿La hora está en un bloque?
  bloqueDetectado = bloques.find(b => {
    return b.tipo === 'clase' && 
           hora >= b.hora_inicio && 
           hora < b.hora_fin;
  });

  if (!bloqueDetectado) {
    // Buscar bloque más cercano para sugerir
    const bloquesMasAdelante = bloques.filter(b => 
      b.hora_inicio > hora && b.tipo === 'clase'
    ).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    
    errores.push(
      `⏰ Hora ${hora} está fuera de horarios de clase. ` +
      (bloquesMasAdelante.length > 0 
        ? `¿Quisiste decir ${bloquesMasAdelante[0].nombre_bloque}?` 
        : 'No hay clase después de esta hora.')
    );
  }

  // ✓ VALIDACIÓN 2: Si es INASISTENCIA, la hora debe ser inicio/fin de bloque
  if (tipo === TipoRegistro.INASISTENCIA && bloqueDetectado) {
    // INASISTENCIA puede ser:
    // - Al inicio del bloque (no llegó)
    // - Al inicio del siguiente bloque (llegó tarde pero sin atraso)
    const esAlInicio = Math.abs(
      timeToMinutes(hora) - timeToMinutes(bloqueDetectado.hora_inicio)
    ) < 5; // Margen de 5 minutos

    if (!esAlInicio) {
      advertencias.push(
        `⚠️ Inasistencia registrada a las ${hora}, ` +
        `pero bloque ${bloqueDetectado.nombre_bloque} comienza a ${bloqueDetectado.hora_inicio}`
      );
    }
  }

  // ✓ VALIDACIÓN 3: ¿Ya existe un pase para este estudiante HOY?
  const pasesDelDia = obtenerPasesDelDia(idEstudiante, fecha);
  
  if (pasesDelDia.length > 0) {
    const tiposExistentes = [...new Set(pasesDelDia.map(p => p.tipo))];
    
    if (tipo === TipoRegistro.ATRASO && tiposExistentes.includes('INASISTENCIA')) {
      errores.push(
        `❌ Este estudiante ya tiene INASISTENCIA registrada. ` +
        `No puede tener ATRASO después.`
      );
    }
    
    if (tiposExistentes.includes(tipo)) {
      advertencias.push(
        `⚠️ Este estudiante ya tiene ${tipo} hoy. ` +
        `¿Registrar otro?`
      );
    }
  }

  // ✓ VALIDACIÓN 4: ¿Hora actual es mayor a la registrada? (registrando en tiempo real)
  const ahora = new Date();
  const horaActualEnMinutos = ahora.getHours() * 60 + ahora.getMinutes();
  const horaRegistroEnMinutos = parseInt(hora.split(':')[0]) * 60 + 
                                 parseInt(hora.split(':')[1]);
  
  if (horaRegistroEnMinutos > horaActualEnMinutos) {
    advertencias.push(
      `⏳ Está registrando una hora futura (${hora}). ` +
      `Hora actual: ${ahora.toTimeString().slice(0, 5)}`
    );
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    bloqueDetectado: bloqueDetectado || undefined,
  };
}
```

---

## 🔧 CAMBIOS NECESARIOS EN SOLICITUD

```typescript
export interface Solicitud {
  // Campos ACTUALES
  id_solicitud: string;
  id_establecimiento: string;
  id_estudiante: string;
  id_profesor: string;
  tipo: TipoRegistro;
  fecha: string;
  hora: string;
  estado: EstadoSolicitud;
  motivo_codigo: string | null;
  motivo_descripcion: string | null;
  observaciones: string | null;
  respaldo_recibido: boolean;
  tipo_respaldo: string | null;
  id_token_qr: string | null;

  // Campos NUEVOS para validación
  id_bloque?: string;              // ← ID del bloque donde ocurrió
  nombre_bloque?: string;           // ← Nombre del bloque (cache)
  hora_inicio_bloque?: string;      // ← Inicio del bloque
  hora_fin_bloque?: string;         // ← Fin del bloque
  validacion_errores?: string[];    // ← Errores de validación si los hay
  puede_justificar?: boolean;       // ← Si inspectoría puede justificar
}
```

---

## 📋 INTERFACE MEJORADA PARA GESTIONPASES

```typescript
// En GestionPases.tsx

interface FormPaseValidado extends FormPase {
  id_bloque?: string;
  validacion?: ValidacionPase;
  bloqueDetectado?: BloqueHorario;
}

const [validacionActual, setValidacionActual] = useState<ValidacionPase | null>(null);
const [bloques, setBloques] = useState<BloqueHorario[]>([]);

useEffect(() => {
  cargarBloques();
}, [idEstablecimiento]);

// Cuando cambia hora, validar
const handleHoraChange = (nuevaHora: string) => {
  setFormData({ ...formData, hora: nuevaHora });
  
  const validacion = validarNuevoPase(
    formData.tipo,
    formData.fecha,
    nuevaHora,
    formData.id_estudiante,
    bloques
  );
  
  setValidacionActual(validacion);
};

// Al submit
const handleSubmit = async (e) => {
  const validacion = validarNuevoPase(
    formData.tipo,
    formData.fecha,
    formData.hora,
    formData.id_estudiante,
    bloques
  );

  // ❌ Si hay errores críticos, mostrar y no enviar
  if (validacion.errores.length > 0) {
    setError(validacion.errores.join('\n'));
    return;
  }

  // ⚠️ Si hay advertencias, pedir confirmación
  if (validacion.advertencias.length > 0) {
    if (!confirm(`⚠️ Advertencias:\n\n${validacion.advertencias.join('\n')}\n\n¿Continuar?`)) {
      return;
    }
  }

  // ✅ Si llegó aquí, crear pase con bloque validado
  const solicitud: Solicitud = {
    ...formData,
    id_bloque: validacion.bloqueDetectado?.id_bloque,
    nombre_bloque: validacion.bloqueDetectado?.nombre_bloque,
    hora_inicio_bloque: validacion.bloqueDetectado?.hora_inicio,
    hora_fin_bloque: validacion.bloqueDetectado?.hora_fin,
    validacion_errores: validacion.errores,
  };

  await crearSolicitud(solicitud);
};
```

---

## 🎯 MEJORAS PROPUESTAS (PRIORIZADAS)

### **PRIORIDAD 1: CRÍTICA (Implica ahora)**
- [ ] **Validar que hora está en un bloque horario válido**
  - Impedirá registrar atrasos fuera de horarios
  - Mostrará sugerencias de bloques disponibles
  - Tiempo: 1 hora

- [ ] **Guardar id_bloque en Solicitud**
  - Auditoría de cuál bloque fue afectado
  - Permite limpiar pases más adelante
  - Tiempo: 30 min

### **PRIORIDAD 2: ALTA (Próxima sesión)**
- [ ] **No permitir ATRASO si ya existe INASISTENCIA ese día**
  - Lógica: Si no llegó todo el bloque, no puede tener atraso
  - Mostrar lista de pases existentes
  - Tiempo: 1 hora

- [ ] **Botón "Marcar Presente"** (para correcciones)
  - Elimina el pase o lo marca como JUSTIFICADA
  - Mejor UX para errores del profesor
  - Tiempo: 1.5 horas

### **PRIORIDAD 3: MEDIA (Futuro)**
- [ ] **Auto-limpiar pases después del bloque**
  - Cambiar estado a RECHAZADA si pasó el bloque sin justificar
  - Ejecutar cada 5-10 minutos
  - Tiempo: 1.5 horas

---

## 📊 RESUMEN: ANTES vs DESPUÉS

```
┌────────────────────────────────────────────────────────────────┐
│                         ANTES                                  │
├────────────────────────────────────────────────────────────────┤
│ ❌ Profesor puede registrar hora arbitraria                    │
│ ❌ Sin validación de bloques                                    │
│ ❌ Registrar ATRASO después del bloque (12:00)                 │
│ ❌ Permitir ATRASO si ya existe INASISTENCIA                   │
│ ❌ Sin información del bloque asociado                          │
│ ❌ Difícil auditar qué bloque fue afectado                     │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                         DESPUÉS                                │
├────────────────────────────────────────────────────────────────┤
│ ✅ Sistema solo acepta horas dentro de bloques                 │
│ ✅ Sugiere bloque automáticamente                              │
│ ✅ Alerta si está registrando fuera de horario                 │
│ ✅ Valida conflictos (ATRASO + INASISTENCIA)                   │
│ ✅ Guarda id_bloque para auditoría                             │
│ ✅ Permite investigar "qué pasó en bloque X"                   │
│ ✅ Mejor experiencia para profesor (menos errores)             │
│ ✅ Inspectoría puede justificar con contexto de bloque         │
└────────────────────────────────────────────────────────────────┘
```

---

## 🚀 SIGUIENTE PASO

**Recomendación: Implementar PRIORIDAD 1 (2 funcionalidades críticas)**

1. ✅ **Validación por bloque horario** (1 hora)
2. ✅ **Guardar id_bloque** (30 min)

**Total: 1.5 horas**

Esto prevendrá el 90% de errores sin agregar complejidad excesiva.

¿Deseas que comience la implementación?
