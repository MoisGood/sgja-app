# PAUTA — Checklist de Cumplimiento Ley 21.719 (SGJA)

> **Uso:** trabajar junto a `docs/LEY_21719_CUMPLIMIENTO.md`. Esta pauta es el
> checklist operativo: primero lo existente (verificado), luego los pasos de
> implementación. Marcar cada ítem con `[x]` y la fecha cuando se complete.

---

## Cómo usar esta pauta

1. Sección A y B: **estado actual** (ya verificado en el código, no se debe re-hacer).
2. Sección C: **textos de consentimiento listos** para copiar a la página de consentimiento.
3. Sección D: **checklist de implementación por fases** (mismo orden que el plan).
4. Sección E: bitácora de avances por sesión.

---

## A. Inventario de datos personales (LO EXISTENTE)

| Dato | ¿Existe? | Dónde |
|---|---|---|
| RUN/RUT | Sí | `funcionarios` (`SQL_SUPABASE_CREAR_TABLAS.sql:118`), `estudiantes` (servicio), `datospersonalesusuarios` |
| Nombres / apellidos | Sí | `usuarios`, `funcionarios`, `estudiantes`, `datospersonalesusuarios` |
| Fecha de nacimiento | Sí | `funcionarios.fecha_nacimiento`; **NO** en `estudiantes` |
| Edad | Parcial | solo formulario de accidente (`public/formulario.html:385-388`) |
| Domicilio | Sí | `funcionarios.domicilio, comuna`; `datospersonalesusuarios.direccion, ciudad` |
| Correo electrónico | Sí | `usuarios.email`, `funcionarios.correo_*`, `datospersonalesusuarios.email_personal` |
| Teléfono | Sí | `funcionarios.celular`, `datospersonalesusuarios.telefono` |
| Contacto de emergencia | Sí | `funcionarios.emergencia_*`, `datospersonalesusuarios.emergencia_*` |
| Sexo | Sí | solo `public/formulario.html:365-372` (accidente) |
| Testigos con RUT | Sí | `public/formulario.html:502-519` (accidente) |
| Foto de perfil (Google) | Sí | `supabaseAuth.ts:148` |
| Documentos de funcionarios | Sí | `funcionario_documentos` (bucket público) |
| Estado civil | No | — |
| Datos de salud | No | — (revisar sexo+edad en accidente) |
| Datos biométricos | No | — |

---

## B. Estado actual del sistema (VERIFICADO EN CÓDIGO)

### B.1 Autenticación y roles

- [x] Login Google: `src/pages/Login.tsx:81-82`, `src/services/supabaseAuth.ts:37-38`.
- [x] Whitelist de dominios: RPC `verificar_acceso_externo`.
- [x] Roles: ADMIN, INSPECTOR, PROFESOR, ESTUDIANTE, APODERADO.
- [ ] Verificación de edad del estudiante (NO existe).

### B.2 Formularios de datos personales

- [x] FormularioRegistroInicial — solicitud de acceso.
- [x] FormularioDatosPersonales — completar perfil.
- [x] DatosPersonalesModal — modal admin.
- [x] MantenedorFuncionarios — RUN, nacimiento, domicilio, emergencia.
- [x] MantenedorEstudiantes — RUT, curso, apoderado.
- [x] RegistrarAccidente + `public/formulario.html` — accidente escolar.
- [ ] **Casilla de consentimiento en algún formulario: NO EXISTE.**

### B.3 Política de privacidad y ARCO

- [ ] Política de privacidad publicada: **NO EXISTE**.
- [ ] Canal de contacto ARCO+: **NO EXISTE**.
- [ ] Indicación de cómo revocar: **NO EXISTE**.

### B.4 Menores y apoderados

- [x] Rol APODERADO y relación `estudiantes.id_apoderado`.
- [x] Apoderados exentos de completar su propio formulario (`useUsuarioLogueado.ts:129`).
- [ ] Verificación de que el apoderado completa por un menor < 14: **NO EXISTE**.
- [ ] Declaración expresa de apoderado: **NO EXISTE**.
- [ ] Registro de quién consintió (fecha/hora/IP): **NO EXISTE**.

### B.5 RLS (seguridad de acceso)

- [x] RLS habilitado en tablas core (`012_rls_policies_core_tables.sql:32-55`).
- [ ] **PROBLEMA:** `usuarios_select` = todo autenticado lee `usuarios` (línea 113).
- [ ] **PROBLEMA:** `datospersonales_select_all` = todo autenticado lee `datospersonalesusuarios` (líneas 383-384).
- [ ] **PROBLEMA:** escritura de `datospersonalesusuarios` solo admin contradice el upsert del propio perfil → **verificar estado real en Supabase**.
- [x] `execute_sql` eliminado (vulnerabilidad corregida en `018_fix_seguridad.sql`).

### B.6 Auditoría

- [x] `monitoreo_logs` / `monitoreo_correos` (log operativo, no sistemático).
- [x] `usuarios_eliminados` (respaldo de eliminados).
- [ ] Log de accesos a datos personales: **NO EXISTE**.
- [ ] `updated_by` en tablas de datos personales: **NO EXISTE**.

---

## C. Textos de consentimiento por tramo de edad (PARA LA PÁGINA DE CONSENTIMIENTO)

> Reglas: casillas desmarcadas por defecto, una por finalidad, texto claro y breve,
> enlace a política de privacidad, indicación de cómo revocar.

### C.1 Menor de 14 años — lo completa el APODERADO

```text
CONSENTIMIENTO INFORMADO - LEY 21.719
Datos de un estudiante menor de 14 años

Declaro que soy el/la apoderado/a legal del estudiante [NOMBRE] y otorgo
mi consentimiento para el tratamiento de sus datos personales.

Datos recopilados: RUN, nombres, fecha de nacimiento, edad, curso,
domicilio, correo electrónico, teléfono y datos de contacto de emergencia.

Finalidades:
  □ Autorizo a [INSTITUCIÓN] a tratar los datos del estudiante para la
    gestión administrativa del sistema educativo (registro, justificación
    de atrasos e inasistencias, certificados y trámites internos).
  □ Autorizo el envío de comunicaciones institucionales (circulares,
    avisos y actividades) por los canales de contacto registrados.
  □ Autorizo que, en caso de emergencia, se contacte al apoderado o al
    contacto de emergencia registrado.

Responsable: [NOMBRE INSTITUCIÓN]
Duración: mientras se mantenga la relación educativa.
Derechos: acceso, rectificación, cancelación y oposición (ARCO+) en [CORREO].
Revocación: puede revocar este consentimiento contactando a [CORREO].

RUN del apoderado: ______________
Firma del apoderado: ______________
Fecha: ______________
```

### C.2 Adolescente 14 a 17 años — consiente el estudiante (datos comunes)

```text
CONSENTIMIENTO INFORMADO - LEY 21.719
Datos de un estudiante adolescente (14 a 17 años)

[INSTITUCIÓN] solicita su autorización para tratar sus datos personales:
RUN, nombres, fecha de nacimiento, edad, curso, domicilio, correo
electrónico, teléfono y datos de contacto de emergencia.

Finalidades:
  □ Acepto el tratamiento de mis datos para la gestión administrativa
    del sistema educativo (registro, justificación de atrasos e
    inasistencias, certificados y trámites internos).
  □ Acepto recibir comunicaciones institucionales (circulares, avisos
    y actividades) por los canales de contacto registrados.
  □ Acepto que, en caso de emergencia, se contacte a mi apoderado o al
    contacto de emergencia registrado.

Responsable: [NOMBRE INSTITUCIÓN]
Duración: mientras se mantenga la relación educativa.
Derechos: ARCO+ en [CORREO].
Revocación: puede revocar este consentimiento contactando a [CORREO].

Firma: ______________
Fecha: ______________
```

> Nota: si en el futuro se agregan **datos sensibles** de adolescentes, se
> necesitará además el consentimiento del apoderado.

### C.3 Funcionario 18+ — consiente el propio titular

```text
CONSENTIMIENTO INFORMADO - LEY 21.719
Datos de funcionario/a (mayor de 18 años)

[INSTITUCIÓN] solicita su autorización para tratar sus datos personales:
RUN, nombres, fecha de nacimiento, domicilio, comuna, teléfono, correos,
título profesional y datos de contacto de emergencia.

Finalidades:
  □ Acepto el tratamiento de mis datos para la gestión administrativa
    y de recursos humanos (contrato, horario, ausencias, documentación).
  □ Acepto recibir comunicaciones institucionales por los canales
    registrados.
  □ Acepto que, en caso de emergencia, se contacte al contacto de
    emergencia registrado.

Responsable: [NOMBRE INSTITUCIÓN]
Duración: mientras se mantenga la relación laboral/educativa.
Derechos: ARCO+ en [CORREO].
Revocación: puede revocar este consentimiento contactando a [CORREO].

Firma: ______________
Fecha: ______________
```

---

## D. Checklist de implementación por fases

### Fase 1 — Base de datos (RLS + tabla de consentimientos)

- [ ] Versionar DDL de `datospersonalesusuarios` (no existe `CREATE TABLE` en el repo).
- [ ] Corregir RLS de `usuarios` (quitar lectura universal; self + admin + roles).
- [ ] Corregir RLS de `datospersonalesusuarios` (self + admin; eliminar `_select_all`).
- [ ] Restringir lectura de `solicitudes` (admin + propio usuario).
- [ ] **Verificar en el dashboard de Supabase** qué políticas están activas y la región del proyecto.
- [ ] Crear tabla `consentimientos_ley21719` (DDL en `LEY_21719_CUMPLIMIENTO.md` §6 Fase 1).
- [ ] Definir RLS de `consentimientos_ley21719` (self, admin, apoderado-por-menores).

### Fase 2 — Acceso ESTUDIANTE y APODERADO

- [ ] Agregar `fecha_nacimiento` a `estudiantes` (o derivar edad) para tramos de edad.
- [ ] RLS: estudiante solo su ficha; apoderado solo las fichas de sus estudiantes.
- [ ] Permitir que un apoderado tenga varios estudiantes.
- [ ] Validación de RUN del apoderado al completar por un menor.
- [ ] Declaración expresa de apoderado + registro de quién consintió (fecha/hora/IP).

### Fase 3 — Página de consentimiento (UI)

- [ ] Nueva ruta `/consentimiento` (hash) que intercepta al ingreso.
- [ ] Detección de tramo de edad: MENOR_14 / ADOLESCENTE_14_17 / ADULTO_18.
- [ ] Textos de la sección C insertados (según tramo).
- [ ] Checkboxes desmarcados por defecto, una por finalidad.
- [ ] Validación: para < 14 solo apoderado (RUN + declaración); bloquear al menor.
- [ ] Botones: "Aceptar y continuar" (guarda FIRMADO_DIGITAL) / "Descargar PDF" / "Rechazar".
- [ ] Guardar en `consentimientos_ley21719` (IP, user_agent, finalidades, versión).

### Fase 4 — Exportar PDF y entrega física

- [ ] Generar PDF con pdf-lib (reusar patrón de `src/services/pdf.service.ts`).
- [ ] PDF incluye: texto de consentimiento, datos del titular, tramo, casillas,
      campo de firma y campo de timbre del liceo, fecha.
- [ ] Botón admin: "Marcar consentimiento firmado entregado" → `FIRMADO_PAPEL` +
      `fecha_entrega_papel` + subir escaneo a bucket privado + `timbrado`.
- [ ] Mostrar estado del consentimiento (PENDIENTE / FIRMADO_DIGITAL / FIRMADO_PAPEL).

### Fase 5 — Política de privacidad y ARCO+

- [ ] Página `/privacidad` (responsable, datos, finalidades, base legal, duración,
      transferencias, ARCO+, contacto).
- [ ] Canal de contacto ARCO (correo institucional).
- [ ] Enlaces a la política desde login y todos los formularios.

### Fase 6 — Auditoría

- [ ] `updated_by` en tablas de datos personales o log de modificaciones.
- [ ] Registrar acciones sobre datos personales en `monitoreo_logs`.
- [ ] Log de accesos a fichas de estudiantes por funcionarios.

### Fase 7 — Verificación final

- [ ] Probar flujos: <14 (apoderado), 14-17, 18+, firma digital, entrega papel,
      rechazo, revocación, ARCO.
- [ ] Verificar RLS con cuentas de estudiante, apoderado y admin.
- [ ] Actualizar `analisis/README.md:372` y `analisis/modulo-academico.html:1383`
      (cambiar "Pendiente" → "Implementado").

---

## E. Bitácora de avances por sesión

| Fecha | Fase | Qué se hizo | Estado |
|---|---|---|---|
| 2026-08-07 | Fase 0 | Diagnóstico + esta pauta | ✔ Documentado |
| | | | |
| | | | |

---

## Notas de decisión pendientes

- [ ] Definir el texto final de la institución responsable (nombre, correo de
      contacto ARCO, duración).
- [ ] Definir si el consentimiento se bloquea (sin acceso) o permite acceso
      limitado mientras esté PENDIENTE.
- [ ] Definir política de retención de datos (cuánto tiempo tras el egreso/cese).
- [ ] Evaluar bucket privado para `funcionario_documentos` (URL firmada).
- [ ] Revisar datos personales reales versionados en `python/` y `scripts/`.
- [ ] Verificar región de Supabase y DPAs con proveedores.
