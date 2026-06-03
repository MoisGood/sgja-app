-- ========================================================================
-- AUTO-GENERADO: Migración Firestore → Supabase PostgreSQL (v2 - UUIDs Válidos)
-- Fecha: 2026-04-21T14:59:38.849Z
-- Total de INSERT statements: 151
-- ========================================================================

-- ⚠️  ANTES DE EJECUTAR:
-- 1. Desabilitar RLS temporalmente (mejor performance)
-- 2. Asegúrat que las tablas existen en Supabase
-- 3. Verifica que las credenciales de Supabase sean correctas

-- INICIAR TRANSACCIÓN
BEGIN TRANSACTION;

-- INSERTAR DATOS
INSERT INTO establecimientos (id, nombre, codigo, region, activo)
VALUES ('513f4cbb-da42-5815-a373-0f47449d4b5c', 'Liceo Público San José', 'EST-001', 'Valparaíso', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO establecimientos (id, nombre, codigo, region, activo)
VALUES ('9ec75241-1cd9-5fe2-aff2-8d6265f8a1e0', 'Liceo Público San José', 'EST-002', 'Valparaíso', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, uid, email, nombre_completo, rol, id_establecimiento, activo)
VALUES ('01c063eb-d5d2-5a6d-ad8d-f17b8bc18910', '01c063eb-d5d2-5a6d-ad8d-f17b8bc18910', 'moises.zepedar@andaliensur.cl', 'Moi', 'PROFESOR', '513f4cbb-da42-5815-a373-0f47449d4b5c', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, uid, email, nombre_completo, rol, id_establecimiento, activo)
VALUES ('733f5ad1-386b-52a3-a84a-b949bb6fd368', '733f5ad1-386b-52a3-a84a-b949bb6fd368', 'soymoizelo@gmail.com', 'Mois', 'ADMIN', '513f4cbb-da42-5815-a373-0f47449d4b5c', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, uid, email, nombre_completo, rol, id_establecimiento, activo)
VALUES ('93676896-a764-54df-a850-4f92b799ba25', '93676896-a764-54df-a850-4f92b799ba25', 'moiseszepedar@gmail.com', 'Inspector Moi', 'PROFESOR', '513f4cbb-da42-5815-a373-0f47449d4b5c', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, uid, email, nombre_completo, rol, id_establecimiento, activo)
VALUES ('d202ef6b-3852-586c-aa85-8fb42fd1f6a8', 'd202ef6b-3852-586c-aa85-8fb42fd1f6a8', 'soportetipresente@gmail.com', 'Administrador CRAReservas', 'ADMIN', '513f4cbb-da42-5815-a373-0f47449d4b5c', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, uid, email, nombre_completo, rol, id_establecimiento, activo)
VALUES ('4eef1e1e-a348-59a2-ae60-c60815927ed9', '4eef1e1e-a348-59a2-ae60-c60815927ed9', 'admin@sgja.cl', 'Administrador Sistema', 'ADMIN', '513f4cbb-da42-5815-a373-0f47449d4b5c', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, uid, email, nombre_completo, rol, id_establecimiento, activo)
VALUES ('542030da-e4a9-592a-a4db-7d3bd425ed0a', '542030da-e4a9-592a-a4db-7d3bd425ed0a', 'apoderado@sgja.cl', 'María González López', 'APODERADO', '513f4cbb-da42-5815-a373-0f47449d4b5c', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, uid, email, nombre_completo, rol, id_establecimiento, activo)
VALUES ('e33545ae-b0db-5f68-a0f3-8d1ca647f2f7', 'e33545ae-b0db-5f68-a0f3-8d1ca647f2f7', 'estudiante@sgja.cl', 'Juan Pérez González', 'ESTUDIANTE', '513f4cbb-da42-5815-a373-0f47449d4b5c', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, uid, email, nombre_completo, rol, id_establecimiento, activo)
VALUES ('734aa59a-e1e8-5d81-a117-9295fac2f5da', '734aa59a-e1e8-5d81-a117-9295fac2f5da', 'inspector@sgja.cl', 'Inspector Educacional', 'INSPECTOR', '513f4cbb-da42-5815-a373-0f47449d4b5c', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, uid, email, nombre_completo, rol, id_establecimiento, activo)
VALUES ('2322a46a-2e54-5e83-a4e5-06cbe2eb270b', '2322a46a-2e54-5e83-a4e5-06cbe2eb270b', 'profesor@sgja.cl', 'Profesor de Matemáticas', 'PROFESOR', '513f4cbb-da42-5815-a373-0f47449d4b5c', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('666c8a7d-65cb-5114-a734-e48a93778b35', '1N636h9I9rG4gKEU6TCt', 'Joaquín Gallardo Fernández', NULL, '1D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('16c7a5a7-3f8c-52cc-aeb6-d02909c0053a', '1i8AMdZWCGbHHejssrxt', 'Daniela Sepúlveda López', NULL, '2D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('e6814b27-6b47-51e3-af1d-3bd3307775e6', '29gbOpZbnkXzRbiziWIF', 'Paula Espinoza Pérez', NULL, '4B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('aececd41-ee6f-5735-a94a-4387bf903dc8', '2cXQBGomQrWFc6gRkPoQ', 'Lucas Herrera Soto', NULL, '4C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('fd113a91-100c-57de-a93a-cff1d5ddffee', '3oFDJw46fxVeMAgQiuH0', 'Benjamín Castro Díaz', NULL, '2B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('6f1350f9-6c0d-5ce6-a7c3-552e89fdcd91', '3q5Y2vd9rHaTZp1z6upD', 'Maximiliano Ulloa Díaz', NULL, '1C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('eb761e45-30a1-59f6-a29e-18c14a52f4be', '3ztxSK8hL607KVFh4T4b', 'Maximiliano Ortiz Soto', NULL, '2C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('27dd57a2-fb70-530c-a5c7-41d6e38bbc92', '48OHjYP2cS1CpUXy7ccP', 'Simón Escobar Castillo', NULL, '3B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('25e64d59-9dc9-5470-ac84-d4ddc0e72ff1', '59jo02WxYJaNymGbKyNX', 'Carlos Martínez Silva', NULL, '3A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('9de76087-ceec-53e7-af84-f389df598209', '5ZmLncV92IT0gj3JzRZX', 'Agustín Morales Vargas', NULL, '3C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('c93a2658-563f-5bac-a76b-9aa21089a3ec', '5r3tIsfkCxuANMFkBbOo', 'Felipe Reyes Fernández', NULL, '1C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('b306d2a3-b76d-54e3-a76b-39f7ed652944', '6Tu3PwS7yWKJfqMKbOVV', 'Ignacio León Morales', NULL, '3C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('6a5c2f13-7895-5603-a935-ff6fa388b07b', '77gWNeiaa4MjlbRkoVTm', 'Tomás Fuentes Rojas', NULL, '1C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('54d6d3c9-8647-595e-a80b-fec6b93cddc8', '7vEchZafOsERpYjUd2vV', 'Iván Toledo Soto', NULL, '1D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('5305bb4f-56a6-53ff-aab8-89430120683e', '7xLI2GJsnwRiM90U9yr6', 'Nicolás Vargas Morales', NULL, '3A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('8f614916-b618-5368-a8e6-9d592cc2e9af', '9Csi8pyyHhSmIwdSPIA3', 'Rodrigo Bustos Rojas', NULL, '3D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('fd2266d9-fc4f-5906-a097-af9dff627dfa', 'A8bhDh9gwIKSPpowNy3y', 'Florencia Araya Muñoz', NULL, '1D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('4d38b0f8-01ee-563a-a433-6955d79502cb', 'AYnWDEXlEMDPZHZNA0yV', 'Laura Zúñiga Torres', NULL, '4D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('6ba3d847-792d-588a-a445-d7d5eb6d6b19', 'AevN4WdUwHFGiFxVvod7', 'Juan García López', NULL, '4A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('099f8f36-1dc6-5846-a283-24bdb801bb08', 'ArCp2pYsGCtb7ZLNdsEz', 'Andrés Riquelme Rojas', NULL, '3B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('28b23ecf-35d8-506d-afcc-488f7e514093', 'BhOdR3zAoDG8LF9Zy20S', 'Pablo Maldonado Castillo', NULL, '3C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('fb3853ca-0cbf-5737-a3e1-52ac393fdf32', 'D8ED5OD2LKUjG9vDCtw6', 'Camila Peña Herrera', NULL, '4D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('3b110bfe-e468-5f91-a1dd-1b535f83243e', 'DlM9bDVI1FIRMMhJYHan', 'Catalina Bravo Pérez', NULL, '4A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('3b8f9864-59ab-5ba4-ac79-a5a2c249f471', 'FAOYUG47Ct6Q5KefXnJh', 'Vicente Méndez Castillo', NULL, '3D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('3d7108e1-3866-58c3-a5a3-df7ba7106fa3', 'FaYykRyfwBSBluDpod0V', 'Andrea Parra Silva', NULL, '2C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('3fe7bb2d-5d73-58b9-a528-33fc6be3ba0c', 'GK3eNiu5L1F2uEMRYfoE', 'Matías Zamorano Díaz', NULL, '1B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('50d38779-ce6b-52b3-aa86-fc541694f446', 'GwHQVjstVFPgcF2zWy5c', 'Isidora Vega López', NULL, '1B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('b7569766-c3de-58c0-a073-d9a4ee80b04d', 'Ib92eVUXM84XcFw0uQPk', 'Daniela Godoy Torres', NULL, '4C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('74fe6824-9fb3-56ba-a73f-f396ec4c0082', 'IlJbYCoDb0UQF8rco9o1', 'Tomás Ríos Castillo', NULL, '3A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('eb4be0f8-08fb-5c09-a0e1-34e7acb42793', 'JGwQDPIt7j4WCFFgex81', 'Emilia Donoso Pérez', NULL, '4D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('b6afeb6c-7457-5bc5-a003-7dd52a6a263f', 'MjCg17Md3zsAQIPDaK8y', 'Felipe Bustos Díaz', NULL, '1D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('78ad0a39-889b-552a-a721-ace7376eef0e', 'P9UMtzRbrHoLAmA1OCLJ', 'Ángela Yáñez Muñoz', NULL, '2A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('2147dfc7-c0ec-54c2-ac73-351daba52f9f', 'PEYuob4Bzq2D7Ijwgy8S', 'Karla Valdés Torres', NULL, '4A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('dfec480f-6066-52d4-aa81-13b9c1e304e8', 'PrBUKcykZNvmc08CopBo', 'Fernanda Cuevas Torres', NULL, '4C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('8f516f9a-8266-521a-adbd-10bfc5bc55df', 'R8dtJSLf0oDPV5BMFTXa', 'Constanza Tapia López', NULL, '2B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('391132fd-aaaf-5fa7-ad4d-7f2d44104a49', 'ROijQunaBnQUmMsBjQ3B', 'Daniela Farías Silva', NULL, '2B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('c9a591ee-8b71-59d8-a4ac-e7ad48b43197', 'SIcEjQnzTrXtEnAmHTL6', 'Isidora Henríquez López', NULL, '2A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('905d5053-1f01-56ec-ad01-717ff01fa227', 'SUCAfJ2ZpGqYwDC3XAKF', 'Nicolás Fuenzalida Rojas', NULL, '3D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('d56f434f-03f1-586d-ac53-1ea000952cab', 'TFqDEGJPGc38ftibHvWN', 'Claudio Olivares Castillo', NULL, '3A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('6756f51c-4d80-5449-af5d-6da2c6593440', 'TrGnTz15rt8exBlBh1F3', 'Fernanda Carrasco Silva', NULL, '2D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('999f6b89-adbd-5ea6-a8f5-7c137a8c8325', 'VFZgPTDOZ1AAJHRQgQ1M', 'Rafael Cornejo Morales', NULL, '3D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('3ee7821c-c1ca-5559-aef6-fd07c72adaaa', 'VJHIf0eEQrkjPTeS0MhD', 'Antonia Carrillo Pérez', NULL, '4A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('f790dd2a-731c-51d4-a709-3e91f3f41569', 'VsyRzhvbOdZWUyOjS2M9', 'Camila Navarro Pérez', NULL, '4C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('b9b73063-94af-5079-a99e-b3cf5eca2c23', 'WGIhCznZ4faUUl160280', 'Marcela Quiroz Herrera', NULL, '4C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('9208e5de-829a-5bd6-ae49-ae98c0419791', 'WIGOLUDqoqOnxPog9LQo', 'Esteban Saavedra Díaz', NULL, '1B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('534d222e-31fc-5fee-a88d-a6c775999ad0', 'WIkOXG3xO2yze9CRr3qv', 'Martina Valenzuela Herrera', NULL, '4B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('1e2c1ee9-27b5-539d-a0d1-5518489245db', 'XBsCh1RAnFZp8OGPCiMj', 'Lucas Villagra Soto', NULL, '1A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('3c6a1922-c013-5555-a763-fc3e83140172', 'ZvsGQNnd4NhJtRF18Ci6', 'Daniela Mella López', NULL, '2B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('91a6667c-8894-57d2-a297-162155c041f1', 'bfE4no670sER33PBLCLQ', 'Florencia Arcos Silva', NULL, '2D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('bb6a995d-8374-524f-a1b1-efeb959658fe', 'cGYHyQYxd5rEEIrmo2Mh', 'Diego Jara Soto', NULL, '1C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('6af615ee-71a0-51d4-a832-03bcd4f549c4', 'cJD3KlFU1XHuyWtcdVe5', 'Patricia Sanhueza Muñoz', NULL, '2D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('94993b5d-a522-54b5-a567-fca32696e4e9', 'dNfXEFkDhXNZ8OnKyZeX', 'Cristóbal Toledo Fernández', NULL, '1A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('8eece500-02c5-5b19-a870-60192526432d', 'elTdcXMv41vHdVSRZFRE', 'Javiera Leiva Muñoz', NULL, '2A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('d48addf3-1e19-5519-a945-f51738815682', 'eq9ZebxX8cwv0QDNUUXu', 'Renato Villalobos Fernández', NULL, '1C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('513f4cbb-da42-5815-a373-0f47449d4b5c', 'est001', 'Juan Pérez González', NULL, '1A', NULL, true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('13474e10-b0d6-5425-a8b1-fc2d09c3dc21', 'est002', 'María García López', NULL, '1A', NULL, true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('83eb255f-827b-50a9-a5a5-2ff1263eb847', 'est003', 'Carlos Rodríguez Silva', NULL, '1B', NULL, true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('922be9e9-9b7f-59c8-ab65-13791a2037ed', 'est004', 'Ana Martínez Hernández', NULL, '1B', NULL, true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('c5cdea35-1f81-5bb4-a117-4fced14a0f38', 'est005', 'Pedro López Flores', NULL, '2A', NULL, true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('6fb01931-4c2e-5c6a-a28a-d448e9e50308', 'est006', 'Sofia Fernández Castro', NULL, '2A', NULL, true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('03629e1d-e6e1-551d-a8f5-ebbcc9ad403f', 'est007', 'Diego Sánchez Ramírez', NULL, '2B', NULL, true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('1cd0908a-5e32-5766-a1ab-534a8b4d3d80', 'est008', 'Lucia Torres Molina', NULL, '2B', NULL, true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('c79ebeec-e522-5bca-ab9a-8230494fed11', 'est009', 'Roberto Núñez Vega', NULL, '3A', NULL, true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('33fb67ca-0537-5fcc-aacc-69d5b20b7cf3', 'est010', 'Valeria Ortiz Gómez', NULL, '3A', NULL, true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('f1b6fb44-cb47-53f8-a6e7-2fc2f2ca2620', 'etUCeAgz1qHd6CdtE39Y', 'Mateo Rivas Castillo', NULL, '3B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('d4ff1137-5966-5905-a919-06879a2dcc31', 'f85bSLADAgkDt9fi4N6v', 'Joaquín Rojas Fernández', NULL, '2A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('22d20478-9fe4-56d0-a0b8-2e465e67efb6', 'fphuzStjfTIpZ768bEIR', 'Valentina Cáceres Torres', NULL, '4B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('72959337-ce5b-5462-a6b0-fa03f89e887d', 'i4hmYTM3WtzKlIOCs67t', 'Hugo Cabrera Rojas', NULL, '3C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('7e1ada1d-ffd7-5c03-a13d-09534b02fd0f', 'ipAvkE52fiVgoCPQxrzQ', 'Sofía Orellana Muñoz', NULL, '2B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('e4eb7382-a46f-5038-ae18-634dc00b8558', 'j8EWMJgAV7YynSCTQf5Y', 'Sofía Delgado Muñoz', NULL, '1A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('ab60ba68-22ee-5522-a6b0-213bad6ed8ae', 'jLJuV0OnwUC7J8CdwPHb', 'Agustín Riquelme Rojas', NULL, '3A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('6d6f3b7a-a2df-5208-a21b-163b44d67dd1', 'kArJFbWtiEhFrwJG6gbx', 'Benjamín Arriagada Morales', NULL, '3B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('da2d1eda-2382-58ab-abd9-d5ba5a418ff9', 'm9DjSiOqeN4bUbK8gWOG', 'Paula Sandoval Herrera', NULL, '4D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('3743c11c-1ee7-583e-aeb0-e9319b42b707', 'nKLK8pnpe9PGg3dkuFJV', 'Sergio Pino Fernández', NULL, '1B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('a4ffd998-8b3e-50be-af86-ae3c4f74b4f2', 'o4y5j3gudUY7oCQxJSTA', 'Catalina Loyola Silva', NULL, '2C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('ff6a3d82-dad9-572f-aa43-351e3949068e', 'obUlWlYoA6SXiGBAUZ3W', 'Javiera Vergara Muñoz', NULL, '2D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('8d02075e-5000-53eb-abba-0ea13c1417e2', 'pBmqS2WEtYC0PQNDDg0t', 'María Rodríguez Pérez', NULL, '4B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('0350f3bb-6156-5d88-a662-540cae423ce2', 'qvMRKyOPwAjhHfIRCVSe', 'Lauro Conaf', NULL, '1A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('a42cd0ba-9ded-5b6a-a9fc-58f120b51c47', 'r61DUIKre3EMuDOQwAxA', 'Valentina Soto Pérez', NULL, '2D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('7cd626fe-7c23-5b6a-a0b3-574a34890354', 'rcPK8owguyvbdpeTqakH', 'Paula Bustamante Herrera', NULL, '4A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('d3478e11-4621-54a5-a97f-a5fabf747b0f', 'sctXEIBdhVfxyM20nEl1', 'Daniela Canales Torres', NULL, '4A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('721e622b-7b08-5e0f-a71e-fb5f751fb321', 'tsDwzZCfM6tJmMHPCm5V', 'Cristóbal Figueroa Soto', NULL, '1D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('ea12ec61-e028-5834-a399-d509d89757d0', 'u1TdIFzwUcOphb6un1oY', 'Moisés Carrasco Rojas', NULL, '1A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('58104a14-63c5-568c-a5b1-34c31aa5775a', 'ujMoeiFJgbDthtcBd7lv', 'Andrea Lagos López', NULL, '2C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('b654cb9f-e29f-5e03-a12c-245204b786d2', 'vEWDfwEfIaP3i7PiZJ3S', 'Vicente Poblete Castillo', NULL, '3C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('4f8efbb8-19e4-5de9-ab0f-ff30f6a8410c', 'vNNOfV7CeB3KMt0Dd3Pr', 'Martina Paredes Silva', NULL, '3A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('789e5b54-dab5-571d-a9db-83e1c9e311fc', 'vPUWV24VEY8kg1517i4f', 'Sebastián Núñez Díaz', NULL, '1A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('5b278992-ba7c-5426-a049-6ad7a758044d', 'vhjneAHklCJwyvcATEY2', 'Martín Venegas Díaz', NULL, '1A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('a1fbba9d-693d-5ca0-a75f-f434d4e26c11', 'wQ15sUiD4LCH83E41xsZ', 'Bruno Cárdenas Morales', NULL, '3A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('aaebdc43-d078-5758-a898-4b27bd8479ee', 'wQwS7f3voR4RpZuQlx3q', 'Sebastián Palma Soto', NULL, '1C', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('999012e2-643f-5189-a436-cf3f35d29518', 'wn0mJT8CqWBrfU22u3Ss', 'Antonia Silva Herrera', NULL, '4B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('e0a92352-9597-56e7-a452-fac088fa5135', 'wtRu1a0waH8Q9mGlQ4aS', 'Emilia Navarro Torres', NULL, '4D', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('da1ac8af-50d4-5647-a07e-29a273823411', 'xB85vaab7cLx8jNOG4bL', 'Diego Salinas Rojas', NULL, '3B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('d3ce9ee1-beda-51eb-a8bf-fc741f69025a', 'zRjDUaEMZWoQ7JCEiGGB', 'Verónica Alarcón Pérez', NULL, '4B', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO estudiantes (id, id_estudiante, nombre_completo, email, curso, id_establecimiento, activo, apoderado_id)
VALUES ('4c7bd613-de5f-5fb4-a532-c8bd3c01414b', 'zYpebJ4nV1OBYLrWZgjK', 'Francisca Aravena Silva', NULL, '2A', '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO solicitudes (id, id_solicitud, id_estudiante, id_profesor, id_profesor_nombre, tipo, estado, fecha, hora, id_bloque, curso, id_establecimiento, motivo_codigo, motivo_descripcion, observaciones, respaldo_recibido)
VALUES ('4240930b-fd5e-5a87-aeee-692bdbb9341d', NULL, 'est001', '2322a46a-2e54-5e83-a4e5-06cbe2eb270b', NULL, 'ATRASO', 'Solicitada', NULL, NULL, NULL, NULL, NULL, NULL, 'Problema de transporte', 'Fue causado por tráfico en la ruta 5', false) ON CONFLICT (id) DO NOTHING;

INSERT INTO solicitudes (id, id_solicitud, id_estudiante, id_profesor, id_profesor_nombre, tipo, estado, fecha, hora, id_bloque, curso, id_establecimiento, motivo_codigo, motivo_descripcion, observaciones, respaldo_recibido)
VALUES ('aeaa233e-8e6c-5ce1-a0ad-a42576cce7c6', NULL, 'est002', '2322a46a-2e54-5e83-a4e5-06cbe2eb270b', NULL, 'INASISTENCIA', 'En revisión', NULL, NULL, NULL, NULL, NULL, NULL, 'Enfermedad', 'Requiere certificado médico', false) ON CONFLICT (id) DO NOTHING;

INSERT INTO solicitudes (id, id_solicitud, id_estudiante, id_profesor, id_profesor_nombre, tipo, estado, fecha, hora, id_bloque, curso, id_establecimiento, motivo_codigo, motivo_descripcion, observaciones, respaldo_recibido)
VALUES ('3bb5e1a8-6385-56c3-a292-af23abc30fea', NULL, 'est003', '2322a46a-2e54-5e83-a4e5-06cbe2eb270b', NULL, 'ATRASO', 'Aprobada', NULL, NULL, NULL, NULL, NULL, NULL, 'Cita médica', NULL, false) ON CONFLICT (id) DO NOTHING;

INSERT INTO solicitudes (id, id_solicitud, id_estudiante, id_profesor, id_profesor_nombre, tipo, estado, fecha, hora, id_bloque, curso, id_establecimiento, motivo_codigo, motivo_descripcion, observaciones, respaldo_recibido)
VALUES ('fdbdd770-da01-5afa-a194-3116503030f5', NULL, 'est001', '2322a46a-2e54-5e83-a4e5-06cbe2eb270b', NULL, 'ATRASO', 'Rechazada', NULL, NULL, NULL, NULL, NULL, NULL, 'Retraso personal', 'No se consideró justificación válida', false) ON CONFLICT (id) DO NOTHING;

INSERT INTO bloques_horarios (id, id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('f32507f3-03e4-5e36-ac8a-3516299bc700', '02pZFhHeG2jNqegdFcgr', 'Bloque 5', '11:30', '00:15', 7, '513f4cbb-da42-5815-a373-0f47449d4b5c', false, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO bloques_horarios (id, id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('87d59dbe-808c-58f3-aeba-5714e9279a5c', '6xXaWJXAmBlHmPaqMTt4', 'Bloque 3', '09:45', '10:30', 4, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO bloques_horarios (id, id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('b7e07658-eb0a-5953-a10d-1076d1ca3eed', 'ZJnBwjMlhLvoYEAMvwe3', 'Recreo 2', '11:15', '11:30', 6, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO bloques_horarios (id, id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('987e246c-49e5-5855-a854-dcfe9087bad1', 'gi5WasyZtsyPzCTWJ9Tg', 'Recreo 2', '09:30', '09:45', 3, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO bloques_horarios (id, id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('e0906616-5559-5923-a258-eb866eb88561', 'hI7uGEna6ogLvEBY7x2m', 'Bloque 4', '10:30', '11:15', 5, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO bloques_horarios (id, id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('1db40271-b438-5337-a749-824f574990f5', 'jk67ML7z22wTNnJn7nz0', 'Bloque 2', '08:46', '09:30', 2, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO bloques_horarios (id, id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('a64da9d3-6af3-5a09-ad73-eedf467f6452', 'nlOjESO4vHn148DUuvun', 'Bloque 6', '12:15', '12:40', 8, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO bloques_horarios (id, id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('a3408ac7-933f-5f0d-aea2-522c8343f798', 'pLGHlMugs5QmRYHJ4hF8', 'Bloque 5', '11:30', '12:15', 7, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO bloques_horarios (id, id_bloque, nombre_bloque, hora_inicio, hora_fin, orden, id_establecimiento, activo, creado_en)
VALUES ('183a285c-b012-5061-a429-25d173e4aa7a', 'rRoOOkMwaUgNvedGYKJZ', 'Bloque 1', '08:00', '08:45', 1, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('f4773a61-9244-5018-a6cf-9ceb6626e3ef', '4D', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('72678bf1-bc80-5d28-a122-fc91f1c5a616', '2B', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('d3fb3fbd-1171-5ccf-a66f-297982906721', '2D', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('9fcae6d4-5abd-5f85-a976-3d4459d27681', '1C', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('cb3c2b9b-545e-50fd-ab44-0938606b68b8', '1A', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('96083993-5c61-59e3-a9ee-863fff630d2b', '3B', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('a374b4d3-c6df-5490-aec7-87935a9d82ce', '4A', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('e1440fc8-b45f-5f9d-a7af-c97803ed977f', '1D', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('c925d81f-237f-531a-a16a-4ae69e165db3', '4C', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('512138ef-495d-5c7d-a87a-6ff8cf51cb61', '1B', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('d76b5c34-f706-57dd-a418-a5e8a559ceba', '3D', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('18fff668-6107-5ae9-add9-f952ed72108f', '2A', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('4a2451f8-caa5-545f-ad57-b012011fd85e', '3°A', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('7353df6a-113a-53ce-a25c-f2a4a21b7033', '4°A', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('431294a7-12b5-5220-a28b-5d6a792a17da', '4°B', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('aa2455aa-5215-5408-a692-5b25b93a57a6', '2C', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('4f702325-367d-54fa-a743-9050fb73d8fe', '3C', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('7ceb08f8-760f-5d90-a24f-8d797b49a017', '4B', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO cursos (id, nombre, grado, nombre_corto, id_establecimiento, activo, creado_en)
VALUES ('99b0947d-0f4a-5102-ad61-e2cd8c3a5271', '3A', NULL, NULL, '513f4cbb-da42-5815-a373-0f47449d4b5c', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO funcionarios (rut, rut_formateado, nombre_completo, fecha_nacimiento, domicilio, comuna, celular, correo_personal, correo_institucional, titulo_profesional, universidad, ano_titulacion, fecha_ingreso, fecha_termino, horas_contrato, vigente, usuario_registrado_sistema)
VALUES ('198453560', '19.845.356-0', 'Macarena Rocio Zuñiga Reynero', '1998-01-03', 'Avenida Los Presidentes 1336', 'Concepción', '945433069', 'macarena.zuniga@example.com', 'macarena.rocio.zuniga.reynero@andaliensur.cl', 'Terapeuta Ocupacional', 'Universidad Andres Bello', 2022, '2026-04-08', '2026-04-08', 19, true, false) ON CONFLICT (rut) DO NOTHING;

INSERT INTO motivos_justificacion (id, codigo, descripcion, activo, creado_en)
VALUES ('7780daa6-1d4c-58b8-ade6-1c6b7a4c6093', NULL, 'El estudiante estaba enfermo', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO motivos_justificacion (id, codigo, descripcion, activo, creado_en)
VALUES ('00a86a32-6a11-51e8-a296-0e53c65fbc75', NULL, 'Cita médica agendada', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO motivos_justificacion (id, codigo, descripcion, activo, creado_en)
VALUES ('47f52b5e-d7e9-5dfa-a19f-629bd062a3a1', NULL, 'Problema con transporte', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO motivos_justificacion (id, codigo, descripcion, activo, creado_en)
VALUES ('e92a920a-ca72-504a-aab2-ceda18f352c7', NULL, 'Asuntos familiares importantes', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO motivos_justificacion (id, codigo, descripcion, activo, creado_en)
VALUES ('94cd8a0f-c13a-591a-abaa-e726bc0453a7', 'ATRASOINTERMEDIOCONP', 'Atraso intermedio Con Psicologa', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO motivos_justificacion (id, codigo, descripcion, activo, creado_en)
VALUES ('ecf6f349-f8c1-5d77-a3ed-80233dffaf38', 'ATRASOINTERMEDIOCONP_C', 'Atraso intermedio Con Psicologa (Copia)', false, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO motivos_justificacion (id, codigo, descripcion, activo, creado_en)
VALUES ('303697b7-9f74-5ff3-ad4e-9555a778738f', 'ATRASOINTERMEDIOCONT', 'Atraso intermedio Con Trabajador Social', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO motivos_justificacion (id, codigo, descripcion, activo, creado_en)
VALUES ('36d1771a-2e74-59be-aa8e-37d3d4eb390d', 'ATRASOINTERMEDIOENCR', 'Atraso intermedio en CRA', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO motivos_justificacion (id, codigo, descripcion, activo, creado_en)
VALUES ('042ced8a-d3ec-58c6-aec7-07283092a4bb', 'ATRASOINTERMEDIODELE', 'Atraso intermedio del Estudiante Incumple el reglamente', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO motivos_justificacion (id, codigo, descripcion, activo, creado_en)
VALUES ('59c51793-f5e7-585f-aeb6-be46ebc414d1', 'LENTITUDTRANSPORTEPB', 'Lentitud Transporte Público', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO motivos_justificacion (id, codigo, descripcion, activo, creado_en)
VALUES ('2abe8efd-eee7-52f7-ae3b-aeedb9b2b7fa', 'ATRASOTRANSPORTEPBLI', 'Atraso Transporte Público', true, NULL) ON CONFLICT (id) DO NOTHING;

INSERT INTO motivos_justificacion (id, codigo, descripcion, activo, creado_en)
VALUES ('843886dd-48ef-570c-ac85-67e425b20285', 'ACCIDENTETRANSPORTEP', 'Accidente Transporte Público', true, NULL) ON CONFLICT (id) DO NOTHING;

-- CONFIRMAR TRANSACCIÓN
COMMIT;

-- 🎯 POST-IMPORTACIÓN:
-- 1. Re-habilitar RLS
-- 2. Crear índices (ver FASE3_MIGRACION_DATOS_GUIA_PASOS.md)
-- 3. Validar integridad de datos
