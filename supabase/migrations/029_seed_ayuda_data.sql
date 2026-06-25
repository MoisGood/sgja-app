DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.ayuda_faq LIMIT 1) THEN
    INSERT INTO public.ayuda_faq (rol, modulo, categoria, titulo, contenido, orden) VALUES
      ('{PROFESOR,INSPECTOR,ESTUDIANTE}', 'general', 'General', '¿Cómo usar este sistema?',
       'Bienvenido al SGJA. Puedes navegar usando el menú lateral izquierdo y acceder a cada módulo según tu rol.', 1),
      ('{PROFESOR,INSPECTOR}', 'justificaciones', 'Ausencias', '¿Cómo registro una ausencia?',
       'Ve a Justificaciones > Registrar. Selecciona el curso, marca los estudiantes ausentes, elige el motivo y guarda.', 2),
      ('{PROFESOR,INSPECTOR}', 'justificaciones', 'Ausencias', '¿Puedo registrar ausencias de días anteriores?',
       'Sí, puedes seleccionar una fecha anterior en el calendario antes de registrar.', 3),
      ('{PROFESOR,INSPECTOR}', 'justificaciones', 'Justificaciones', '¿Cómo revisar justificaciones?',
       'Ve a Justificaciones > Ver Justificaciones. Puedes filtrar por fecha, curso o estado.', 4),
      ('{PROFESOR,INSPECTOR}', 'justificaciones', 'Justificaciones', '¿Qué significa cada estado?',
       'Injustificada = sin documento. Justificada = con documento aprobado. Pendiente = en revisión.', 5),
      ('{PROFESOR,INSPECTOR}', 'pases', 'Pases', '¿Cómo gestionar un pase?',
       'Ve a Justificaciones > Gestión de Pases. Ahí puedes crear, aprobar o rechazar pases de estudiantes.', 6),
      ('{ESTUDIANTE}', 'general', 'Mi cuenta', '¿Dónde veo mi información?',
       'Tu perfil está disponible en el menú de configuración. Puedes actualizar tus datos personales.', 7);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.ayuda_catalogo_errores LIMIT 1) THEN
    INSERT INTO public.ayuda_catalogo_errores (categoria, titulo, descripcion) VALUES
      ('Sistema', 'Error al iniciar sesión', 'No puedo ingresar con mi usuario y contraseña.'),
      ('Sistema', 'Página no carga', 'La página se queda cargando y no muestra el contenido.'),
      ('Justificaciones', 'No aparece un estudiante', 'El estudiante no aparece en la lista del curso.'),
      ('Justificaciones', 'Error al guardar justificación', 'Aparece un mensaje de error al intentar guardar.'),
      ('Biblioteca', 'No encuentra libro', 'El libro que busco no aparece en el catálogo.'),
      ('Biblioteca', 'Error al prestar', 'No puedo registrar un préstamo de libro.');
  END IF;
END $$;
