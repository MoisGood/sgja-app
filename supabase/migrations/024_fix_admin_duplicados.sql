-- ============================================================
-- SOLUCIÓN DEFINITIVA para "Permiso denegado: se requiere rol ADMIN"
-- 1. Fusiona admins duplicados (seed id ≠ auth.uid)
-- 2. Actualiza DINÁMICAMENTE todas las FKs que apuntan a usuarios.id
-- 3. Normaliza is_admin() para que funcione con id real
-- ============================================================

DO $$
DECLARE
  v_rec           record;
  v_seed_data     jsonb;
  v_auth_uid      uuid;
  v_seed_id       uuid;
  v_count         int;
  v_admin_email   text;
  v_fk            record;
  v_sql           text;
  v_updated       int;
BEGIN
  -- Buscar TODOS los emails que tienen rol ADMIN y existen en auth.users
  FOR v_rec IN
    SELECT DISTINCT u.email
    FROM public.usuarios u
    INNER JOIN auth.users au ON au.email = u.email
    WHERE u.rol = 'ADMIN' AND u.activo = true
  LOOP
    v_admin_email := v_rec.email;
    RAISE NOTICE 'Procesando admin: %', v_admin_email;

    SELECT id INTO v_auth_uid FROM auth.users WHERE email = v_admin_email;
    SELECT count(*) INTO v_count FROM public.usuarios WHERE email = v_admin_email;

    RAISE NOTICE '  auth.uid() = %  registros = %', v_auth_uid, v_count;

    -- Si solo hay 1 registro y ya coincide, está bien
    IF v_count = 1 THEN
      SELECT id INTO v_seed_id FROM public.usuarios WHERE email = v_admin_email;
      IF v_seed_id = v_auth_uid THEN
        RAISE NOTICE '  ✅ Ya está correcto';
      ELSE
        RAISE NOTICE '  ⚠️  Un solo registro pero id=% ≠ auth.uid', v_seed_id;

        -- 1. Capturar datos del seed ANTES de modificarlo
        SELECT to_jsonb(u) INTO v_seed_data FROM public.usuarios u WHERE id = v_seed_id;

        -- 2. Liberar uid y email del seed para evitar conflictos UNIQUE al insertar el auth row
        UPDATE public.usuarios SET
          uid = 'TEMP_' || gen_random_uuid()::text,
          email = 'TEMP_' || gen_random_uuid()::text || '@temp.com'
        WHERE id = v_seed_id;

        -- 3. Insertar auth row con id y uid correctos
        INSERT INTO public.usuarios (id, uid, email, nombre, apellidos, rol, id_establecimiento, activo, creado_en, actualizado_en)
        VALUES (
          v_auth_uid,
          v_auth_uid::text,
          (v_seed_data->>'email')::text,
          (v_seed_data->>'nombre')::text,
          (v_seed_data->>'apellidos')::text,
          (v_seed_data->>'rol')::text,
          (v_seed_data->>'id_establecimiento')::uuid,
          (v_seed_data->>'activo')::boolean,
          (v_seed_data->>'creado_en')::timestamp,
          now()
        );

        -- 4. Migrar TODAS las FKs DINÁMICAMENTE
        FOR v_fk IN
          SELECT
            conrelid::regclass::text AS tabla,
            a.attname AS columna
          FROM pg_constraint c
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
          WHERE c.confrelid = 'public.usuarios'::regclass
            AND c.contype = 'f'
            AND c.confkey @> ARRAY(
              SELECT attnum FROM pg_attribute
              WHERE attrelid = 'public.usuarios'::regclass AND attname = 'id'
            )
        LOOP
          v_sql := format(
            'UPDATE %I SET %I = $1 WHERE %I = $2',
            v_fk.tabla, v_fk.columna, v_fk.columna
          );
          EXECUTE v_sql USING v_auth_uid, v_seed_id;
          GET DIAGNOSTICS v_updated = ROW_COUNT;
          IF v_updated > 0 THEN
            RAISE NOTICE '    → %: % registros actualizados', v_fk.tabla, v_updated;
          END IF;
        END LOOP;

        -- 5. También migrar columnas TEXT que almacenan el uid como texto
        FOR v_fk IN
          SELECT
            conrelid::regclass::text AS tabla,
            a.attname AS columna
          FROM pg_constraint c
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
          WHERE c.confrelid = 'public.usuarios'::regclass
            AND c.contype = 'f'
            AND c.confkey @> ARRAY(
              SELECT attnum FROM pg_attribute
              WHERE attrelid = 'public.usuarios'::regclass AND attname = 'uid'
            )
        LOOP
          v_sql := format(
            'UPDATE %I SET %I = $1 WHERE %I = $2',
            v_fk.tabla, v_fk.columna, v_fk.columna
          );
          EXECUTE v_sql USING v_auth_uid::text, v_seed_id::text;
          GET DIAGNOSTICS v_updated = ROW_COUNT;
          IF v_updated > 0 THEN
            RAISE NOTICE '    → %: % registros actualizados (uid text)', v_fk.tabla, v_updated;
          END IF;
        END LOOP;

        -- 6. Tablas conocidas con uid como TEXT (sin FK formal)
        UPDATE public.solicitudes_registro SET uid = v_auth_uid::text WHERE uid = v_seed_id::text;
        GET DIAGNOSTICS v_updated = ROW_COUNT;
        IF v_updated > 0 THEN
          RAISE NOTICE '    → solicitudes_registro: % actualizados (manual)', v_updated;
        END IF;

        UPDATE public.datospersonalesusuarios SET uid = v_auth_uid::text WHERE uid = v_seed_id::text;
        GET DIAGNOSTICS v_updated = ROW_COUNT;
        IF v_updated > 0 THEN
          RAISE NOTICE '    → datospersonalesusuarios: % actualizados (manual)', v_updated;
        END IF;

        UPDATE public.usuarios_eliminados SET id_usuario = v_auth_uid::text WHERE id_usuario = v_seed_id::text;
        GET DIAGNOSTICS v_updated = ROW_COUNT;
        IF v_updated > 0 THEN
          RAISE NOTICE '    → usuarios_eliminados: % actualizados (manual)', v_updated;
        END IF;

        -- 7. Eliminar seed
        DELETE FROM public.usuarios WHERE id = v_seed_id;
        RAISE NOTICE '  ✅ Creado auth row con id=% y eliminado seed', v_auth_uid;
      END IF;
      CONTINUE;
    END IF;

    -- Múltiples registros: identificar seed (el que NO coincide con auth.uid)
    SELECT id INTO v_seed_id
    FROM public.usuarios
    WHERE email = v_admin_email AND id != v_auth_uid
    LIMIT 1;

    IF EXISTS (SELECT 1 FROM public.usuarios WHERE email = v_admin_email AND id = v_auth_uid) THEN
      RAISE NOTICE '  🔀 Duplicado: seed=% auth=%', v_seed_id, v_auth_uid;

      -- Promover auth row a ADMIN con datos del seed
      UPDATE public.usuarios
      SET rol = 'ADMIN',
          nombre = COALESCE((SELECT nombre FROM public.usuarios WHERE id = v_seed_id), nombre),
          apellidos = COALESCE((SELECT apellidos FROM public.usuarios WHERE id = v_seed_id), apellidos),
          id_establecimiento = COALESCE((SELECT id_establecimiento FROM public.usuarios WHERE id = v_seed_id), id_establecimiento),
          activo = true,
          uid = v_auth_uid::text,
          actualizado_en = now()
      WHERE id = v_auth_uid;

      -- Migrar FKs DINÁMICAMENTE
      FOR v_fk IN
        SELECT
          conrelid::regclass::text AS tabla,
          a.attname AS columna
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        WHERE c.confrelid = 'public.usuarios'::regclass
          AND c.contype = 'f'
          AND c.confkey @> ARRAY(
            SELECT attnum FROM pg_attribute
            WHERE attrelid = 'public.usuarios'::regclass AND attname = 'id'
          )
      LOOP
        v_sql := format(
          'UPDATE %I SET %I = $1 WHERE %I = $2',
          v_fk.tabla, v_fk.columna, v_fk.columna
        );
        EXECUTE v_sql USING v_auth_uid, v_seed_id;
      END LOOP;

      -- Tablas manuales (uid text)
      UPDATE public.solicitudes_registro SET uid = v_auth_uid::text WHERE uid = v_seed_id::text;
      UPDATE public.datospersonalesusuarios SET uid = v_auth_uid::text WHERE uid = v_seed_id::text;
      UPDATE public.usuarios_eliminados SET id_usuario = v_auth_uid::text WHERE id_usuario = v_seed_id::text;

      DELETE FROM public.usuarios WHERE id = v_seed_id;
      RAISE NOTICE '  ✅ Seed % eliminado, auth % promovido', v_seed_id, v_auth_uid;
    ELSE
      RAISE NOTICE '  ⚠️  No hay registro con id = auth.uid. Sin acción para %', v_admin_email;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- Recrear is_admin() y es_admin() con soporte DUAL:
--    id = auth.uid()   → funciona después de la fusión
--    OR
--    email = auth.email() → funciona SIEMPRE (fallback)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE (id = auth.uid() OR email = auth.email())
      AND rol = 'ADMIN' AND activo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE (id = auth.uid() OR email = auth.email())
      AND rol = 'ADMIN' AND activo = true
  );
$$;
