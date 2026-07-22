# ⚠️ CFB-C — Código Corrompido

**Fecha:** 2026-07-20
**Archivo:** `public/formulario.html`
**Estado:** ❌ Corrompido → ✅ Restaurado

---

## Vulneración #2 — Campos residenciales perdidos

**Causa raíz:** El respaldo CFB-R utilizado para la restauración fue tomado ANTES de agregar los campos residenciales. Al restaurar, se perdieron sin aviso.

**Estado:** ✅ Re-agregados + nuevo CFB-R creado

**Lección aprendida:** Siempre crear respaldo DESPUÉS de cada cambio solicitado, no antes.

---

## Reporte de Vulneración

### Cambio no solicitado

Se reemplazaron los campos `<input type="date">` (calendario nativo del navegador) por tres inputs de texto separados `DIA / MES / AÑO` en las secciones FECHA REGISTRO y FECHA ACCIDENTE.

**Estado original (CFB):** Fecha con calendario nativo (`type="date"`)

**Cambio indebido:** Tres inputs de texto individuales

**Causa raíz:** El desarrollador (IA) interpretó incorrectamente la solicitud "la fecha no es del calendario" como "hay que reemplazar el calendario por texto", cuando en realidad se refería a que en el PDF la fecha no debía ser del calendario (refiriéndose al pdf.service.ts, no al formulario HTML).

### Lección aprendida

- No asumir cambios en el formulario wizard basándose en comentarios sobre el PDF
- Preguntar "¿en el wizard o en el PDF?" antes de modificar
- Los cambios no solicitados rompen la confianza del CFB

### Restauración

Se restauró el archivo `public/formulario.html` desde el respaldo CFB-R:
- `MD2/FORMULARIO_ACCIDENTE_CFB_20260720_*.html.bak`

Y se re-aplicaron únicamente los cambios solicitados:
- ✅ `soloUno()` para checkboxes mutuamente excluyentes
- ❌ NO se tocaron los campos de fecha

También se restauró `src/pages/RegistrarAccidente.tsx` en su lógica de fechas.

---

## Archivos afectados

| Archivo | Acción |
|---------|--------|
| `public/formulario.html` | Restaurado desde respaldo |
| `src/pages/RegistrarAccidente.tsx` | Restaurada lógica de `fecha_1`/`fecha_7` |

## Próximos pasos

Si se necesita cambiar el comportamiento de las fechas, se hará como **M-CFB** con solicitud explícita del usuario.
