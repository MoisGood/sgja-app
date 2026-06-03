# ✅ INSTRUCCIONES PARA CREAR TABLA INJUSTIFICADOS EN SUPABASE

## PASO 1: Abre Supabase Console
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto SGJA
3. Haz clic en **SQL Editor** (menú izquierdo)

## PASO 2: Crear tabla injustificados
1. Haz clic en **+ New Query**
2. Copia TODO el contenido de: `CREATE_TABLE_INJUSTIFICADOS.sql`
3. Pega en el editor
4. Haz clic en **▶️ Run** (esquina inferior derecha)
5. Deberías ver: ✅ "Query executed successfully"

## PASO 3: Verificar que se creó
Ejecuta esta consulta de validación:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'injustificados';
```

Deberías ver una fila con: `injustificados`

---

## 📋 RESUMEN DE LO QUE SE CREA:

### Tabla: injustificados
- **id**: UUID (Primary Key)
- **id_solicitud**: TEXT (UNIQUE) - Identificador único
- **id_estudiante**: TEXT (FK → estudiantes)
- **id_profesor**: UUID (FK → usuarios)
- **curso**: TEXT (FK → cursos)
- **id_bloque**: TEXT (FK → bloques_horarios)
- **id_establecimiento**: UUID (FK → establecimientos)
- **estado**: TEXT - 'Injustificada' o 'Pendiente'
- **fecha**: DATE - Fecha de la inasistencia
- **hora**: TIME - Hora del evento
- **bloques_afectados**: INTEGER - Cantidad de bloques afectados
- **tipo**: TEXT - 'INASISTENCIA', 'ATRASO' o 'RETIRO'
- **respaldo_recibido**: BOOLEAN
- **activo**: BOOLEAN
- **creado_en**: TIMESTAMP
- **actualizado_en**: TIMESTAMP

### Índices creados:
- idx_injustificados_estudiante (búsquedas por estudiante)
- idx_injustificados_profesor (búsquedas por profesor)
- idx_injustificados_curso (búsquedas por curso)
- idx_injustificados_fecha (búsquedas por fecha)
- idx_injustificados_establecimiento

---

## ⏳ PRÓXIMOS PASOS

Una vez creada la tabla, ejecuta (en orden):
1. `SQL_ESTUDIANTES_TEST.sql` → Inserta 3 estudiantes de prueba
2. `SQL_MOTIVOS_JUSTIFICACION_TEST.sql` → Inserta 3 motivos de justificación
3. `SQL_INJUSTIFICADOS_TEST.sql` → Inserta 3 injustificados de prueba

Esto te permitirá validar que el comportamiento de inserts es correcto antes de hacer la importación masiva desde la interfaz.
