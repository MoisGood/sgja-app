# 📋 Análisis: Lógica de Validación de Pases

## 🎯 Problemas a Resolver

1. **Corrección de errores**: Profesor se equivoca → estudiante está presente (no es atraso/inasistencia)
2. **Validez temporal del atraso**: Solo cuenta durante su bloque horario, luego se borra
3. **Validez temporal de inasistencia**: Similar al atraso, aplica mientras estudiante no asista

---

## 📊 Comparativa de Soluciones

### **SOLUCIÓN 1: Boton "Marcar Presente" (MÁS SIMPLE)**

**Concepto**: El profesor registra el atraso/inasistencia y luego puede "desmarcarlo" marcando al estudiante como presente.

**Pros:**
- ✅ Interface super simple
- ✅ No requiere cambios complejos en BD
- ✅ El profesor controla el estado en tiempo real
- ✅ Fácil de entender para usuarios

**Contras:**
- ❌ Requiere que profesor esté atento manualmente
- ❌ Sin validación automática del bloque horario
- ❌ Depende del comportamiento del profesor

**Implementación:**
```typescript
// En GestionPases.tsx, agregar botón en la tabla de pases
<button onClick={() => marcarPresente(solicitud.id_solicitud)}>
  ✓ Marcar Presente
</button>

// Función que cambia estado a "JUSTIFICADA" (o crea nueva)
const marcarPresente = async (idSolicitud: string) => {
  await actualizarSolicitud(idSolicitud, {
    estado: EstadoSolicitud.JUSTIFICADA,
    motivo_descripcion: 'Estudiante presente',
  });
};
```

**Complejidad**: ⭐ (Muy bajo)
**Tiempo de implementación**: 30 minutos

---

### **SOLUCIÓN 2: Auto-Limpiar por Bloque Horario (RECOMENDADO)**

**Concepto**: El sistema automáticamente invalida atraso/inasistencia cuando:
- Sale del bloque horario actual
- Detecta que el estudiante se marcó presente en otro bloque

**Pros:**
- ✅ Automático y transparente
- ✅ Respeta horarios reales del colegio
- ✅ Inteligente: valida contra registros existentes
- ✅ Mejor experiencia usuario
- ✅ Compatible con BloqueHorario existente

**Contras:**
- ⚠️ Requiere lógica más compleja
- ⚠️ Necesita guardar info del bloque en la solicitud
- ⚠️ Requiere chequear bloques al crear/actualizar

**Implementación Técnica:**

1. **Extender interface Solicitud** (en firestore.ts):
```typescript
export interface Solicitud {
  // ... campos existentes ...
  id_bloque?: string;           // Bloque donde ocurrió el atraso
  hora_registro_bloque?: string; // Hora exacta del registro
  se_presento_mas_tarde?: boolean; // Si se marcó presente después
}
```

2. **Obtener bloques al iniciar GestionPases**:
```typescript
const [bloques, setBloques] = useState<BloqueHorario[]>([]);

useEffect(() => {
  const cargarBloques = async () => {
    const bloquesData = await obtenerBloquesDelEstablecimiento(idEstablecimiento);
    setBloques(bloquesData);
  };
  cargarBloques();
}, [idEstablecimiento]);
```

3. **Validar antes de registrar atraso**:
```typescript
const validarPaseEnBloque = async (
  idEstudiante: string,
  fecha: string,
  hora: string
): Promise<{ valido: boolean; razon?: string }> => {
  // Encontrar bloque actual
  const bloqueActual = obtenerBloqueActual(hora);
  
  if (!bloqueActual) {
    return { valido: false, razon: 'No hay bloque horario en esta hora' };
  }

  // Verificar si ya se marcó presente en otro bloque
  const otrosRegistros = solicitudes.filter(
    s => s.id_estudiante === idEstudiante && s.fecha === fecha
  );

  if (otrosRegistros.length > 0) {
    const tiposRegistrados = otrosRegistros.map(r => r.tipo);
    return {
      valido: false,
      razon: `Ya hay registros para este estudiante: ${tiposRegistrados.join(', ')}`
    };
  }

  return { valido: true };
};
```

4. **Limpiar atrasos al salir del bloque**:
```typescript
const limpiarPasesVencidos = () => {
  const ahora = new Date();
  const horaActual = ahora.toTimeString().slice(0, 5);
  
  solicitudes.forEach(solicitud => {
    if (!solicitud.id_bloque) return;
    
    const bloque = bloques.find(b => b.id_bloque === solicitud.id_bloque);
    if (!bloque) return;
    
    // Si la hora actual es después del fin del bloque y el estado es INJUSTIFICADA
    if (horaActual > bloque.hora_fin && solicitud.estado === EstadoSolicitud.INJUSTIFICADA) {
      // Opción A: Marcar como RECHAZADA (fue corregido)
      // Opción B: Borrar el registro
      // Opción C: Marcar se_presento_mas_tarde = true
    }
  });
};
```

**Complejidad**: ⭐⭐⭐ (Medio)
**Tiempo de implementación**: 2-3 horas

---

### **SOLUCIÓN 3: Sistema de Historial con Correcciones (COMPLETO)**

**Concepto**: Mantener historial de todos los cambios, permitir deshacer acciones, auditar cambios.

**Pros:**
- ✅ Transparencia total
- ✅ Auditoría completa
- ✅ Permite deshacer errores
- ✅ Historial para reportes

**Contras:**
- ❌ Muy complejo
- ❌ Requiere tabla de auditoría
- ❌ Performance impactado
- ❌ Overkill para necesidad actual

**Complejidad**: ⭐⭐⭐⭐⭐ (Muy alto)
**Tiempo de implementación**: 5-7 horas

---

## 🎯 RECOMENDACIÓN FINAL

### **Opción Híbrida (MEJOR):**

Combinar **Solución 1 + 2**:

```
1. Interface simple: Botón "Marcar Presente" (Solución 1)
   └─ Para correcciones manuales rápidas

2. Validación automática por bloque (Solución 2, versión simplificada)
   └─ Prevenir atrasos en bloques sin clase
   └─ Limpiar atrasos vencidos automáticamente
   └─ Alertar si ya existe registro
```

**Ventajas:**
- ✅ Simple para casos normales (Solución 1)
- ✅ Inteligente para casos complejos (Solución 2)
- ✅ Balance perfecto complejidad/funcionalidad
- ✅ Implementable en 2-3 horas

---

## 📝 Plan de Implementación

### **Fase 1: Solución Simple (30 min)**
1. Agregar botón "Marcar Presente" en tabla de pases
2. Función para actualizar estado a JUSTIFICADA
3. Testing básico

### **Fase 2: Validación por Bloque (1.5 horas)**
1. Cargar bloques horarios en GestionPases
2. Validar que hora esté en rango de bloque
3. Mostrar alerta si está fuera de horario

### **Fase 3: Auto-limpieza (1 hora)**
1. Función que marque pases como RECHAZADOS al vencer bloque
2. Ejecutar en background cada 5 minutos
3. Logging de cambios automáticos

---

## 💾 Cambios en BD Necesarios

### Mínimo (Solución 1):
- ❌ Sin cambios

### Recomendado (Solución 1+2):
- ✅ Agregar `id_bloque` a Solicitud
- ✅ Agregar `hora_registro_bloque` a Solicitud
- ✅ Opcional: `se_presento_mas_tarde` booleano

### Completo (Solución 3):
- ✅ Nueva colección: `auditoria_pases`
- ✅ Migración de datos históricos
- ✅ Índices adicionales

---

## 🚀 SIGUIENTE PASO

**¿Deseas que implemente la Opción Híbrida (Solución 1+2)?**

Incluiría:
1. Botón "Marcar Presente" en tabla
2. Validación por bloque horario
3. Auto-limpieza de atrasos vencidos
4. Alertas visuales

**Estimado**: 2.5-3 horas de implementación
