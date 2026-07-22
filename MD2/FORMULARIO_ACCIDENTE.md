# SGJA — Formulario de Accidente Escolar: Enfoque de Implementación

## Decisión Arquitectónica (11 Jul 2026)

Se optó por un **enfoque híbrido** entre formulario HTML digital y fidelidad al documento físico original.

### Problema
El formulario de constancia de accidente escolar debe respetar el formato oficial del Ministerio/Establecimiento, pero a la vez funcionar como formulario digital con guardado en Supabase e impresión.

### Opciones Evaluadas

| Opción | Descripción | Decisión |
|--------|-------------|----------|
| **A — PDF como plantilla** | Crear el PDF en Word, el sistema rellena los datos programáticamente | ❌ Descartado: rellenar PDF es complejo, no es responsive, difícil de mantener |
| **B — Solo HTML** | Formulario HTML libre, sin respetar formato original | ❌ Descartado: no cumple con el formato oficial requerido |
| **C — Híbrido** | El usuario diseña el Word exacto → se replica en HTML → el sistema rellena los datos → la impresión es idéntica al original | ✅ Elegido |

### Enfoque Híbrido (Elegido)

```
Usuario crea Word exacto
      ↓
Guarda PDF como referencia visual
      ↓
Se replica el diseño en HTML (editor-formulario.html)
      ↓
El sistema SGJA rellena los datos desde Supabase
      ↓
La impresión (@media print) se ve IDÉNTICA al PDF original
      ↓
Si el ministerio cambia el formato → solo se ajusta el HTML
```

### Ventajas del Enfoque Híbrido
1. **Fidelidad visual**: el HTML de impresión replica exactamente el diseño del Word/PDF original
2. **Datos digitales**: los campos se guardan en Supabase (no en un PDF estático)
3. **Validación**: se pueden validar campos antes de guardar
4. **Responsive**: el editor funciona en desktop y móvil
5. **Mantenible**: si cambia el formato, solo se ajusta el HTML, no hay que rehacer lógica de negocio
6. **Imprimible**: con `@media print` se obtiene exactamente el mismo resultado que el papel original

### Flujo de Trabajo Propuesto
1. Usuario diseña el formato exacto en Microsoft Word (con todos los campos en su lugar)
2. Guarda como PDF (referencia visual)
3. Se sube a la carpeta `docs/` del proyecto
4. Se replica el diseño en `public/editor-formulario.html` (el editor visual)
5. Se genera un JSON de diseño desde el editor
6. Ese JSON se usa para construir el formulario React en `src/pages/RegistrarAccidente.tsx`
7. Los datos se guardan en `supabase/migrations/031_create_accidentes_escolares.sql`

### Archivos Relacionados
| Archivo | Propósito |
|---------|-----------|
| `MD2/FORMULARIO_ACCIDENTE.md` | Documento de diseño del formulario |
| `public/editor-formulario.html` | Editor visual para construir el formulario |
| `src/pages/RegistrarAccidente.tsx` | Página React del formulario de accidente |
| `src/services/accidentes.service.ts` | Servicio con caché offline para datos del formulario |
| `supabase/migrations/031_create_accidentes_escolares.sql` | Migración SQL de la tabla accidentes |
| `SQL_md/CREAR_TABLAS_AYUDA.sql` | Tablas de ayuda (incluye accidentes) |

### Próximos Pasos
1. ⬜ Usuario crea el Word exacto del formulario
2. ⬜ Se guarda como PDF en `docs/`
3. ⬜ Se replica en el editor HTML
4. ⬜ Se genera JSON de diseño
5. ⬜ Se implementa el formulario React definitivo
