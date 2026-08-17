// Tests para asistenciaOffline.service.ts
// Archivo: src/services/__tests__/asistenciaOffline.service.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  descargarEstudiantesCurso,
  obtenerEstudiantesCurso,
  contarEstudiantesCurso,
  registrarAsistenciaOffline,
  registrarAsistenciaCursoOffline,
  obtenerAsistenciaCursoFecha,
  obtenerAsistenciaEstudiante,
  generarResumen,
  yaRegistrado,
  contarPendientesSync,
} from '../asistenciaOffline.service';
import { limpiarTabla } from '../localDb.service';
import 'fake-indexeddb/auto';

const ESTUDIANTES_MOCK = [
  { id: 'e1', rut: '11111111-1', nombre: 'Juan Pérez', curso: '4°A', nivel: '4° Medio' },
  { id: 'e2', rut: '22222222-2', nombre: 'María González', curso: '4°A', nivel: '4° Medio' },
  { id: 'e3', rut: '33333333-3', nombre: 'Pedro Soto', curso: '4°A', nivel: '4° Medio' },
];

describe('asistenciaOffline.service', () => {
  beforeEach(async () => {
    await limpiarTabla('estudiantes');
    await limpiarTabla('asistencia');
    await limpiarTabla('cola_sync');
  });

  describe('descargarEstudiantesCurso', () => {
    it('descarga estudiantes a IndexedDB', async () => {
      const guardados = await descargarEstudiantesCurso('4°A', ESTUDIANTES_MOCK);
      expect(guardados).toBe(3);
    });

    it('cuenta estudiantes descargados', async () => {
      await descargarEstudiantesCurso('4°A', ESTUDIANTES_MOCK);
      const count = await contarEstudiantesCurso('4°A');
      expect(count).toBe(3);
    });
  });

  describe('obtenerEstudiantesCurso', () => {
    it('retorna solo estudiantes del curso', async () => {
      await descargarEstudiantesCurso('4°A', ESTUDIANTES_MOCK);
      await descargarEstudiantesCurso('3°B', [
        { id: 'e4', rut: '44444444-4', nombre: 'Ana Torres', curso: '3°B', nivel: '3° Medio' },
      ]);

      const estudiantes4A = await obtenerEstudiantesCurso('4°A');
      expect(estudiantes4A).toHaveLength(3);
      expect(estudiantes4A.every((e) => e.curso === '4°A')).toBe(true);
    });
  });

  describe('registrarAsistenciaOffline', () => {
    it('registra asistencia de un estudiante', async () => {
      const registro = await registrarAsistenciaOffline(
        'e1',
        '2026-08-16',
        'presente',
        'func-001'
      );

      expect(registro.id).toBeDefined();
      expect(registro.estado).toBe('presente');
      expect(registro.sincronizado).toBe(false);
    });

    it('registra atraso con minutos', async () => {
      const registro = await registrarAsistenciaOffline(
        'e1',
        '2026-08-16',
        'atrasado',
        'func-001',
        15,
        'Motivo: transporte'
      );

      expect(registro.estado).toBe('atrasado');
      expect(registro.minutos_atraso).toBe(15);
      expect(registro.motivo).toBe('Motivo: transporte');
    });
  });

  describe('registrarAsistenciaCursoOffline', () => {
    it('registra asistencia para todo el curso', async () => {
      await descargarEstudiantesCurso('4°A', ESTUDIANTES_MOCK);

      const registros = await registrarAsistenciaCursoOffline(
        '4°A',
        '2026-08-16',
        [
          { estudianteId: 'e1', estado: 'presente' },
          { estudianteId: 'e2', estado: 'atrasado', minutosAtraso: 10 },
          { estudianteId: 'e3', estado: 'ausente' },
        ],
        'func-001'
      );

      expect(registros).toHaveLength(3);
      expect(registros[0].estado).toBe('presente');
      expect(registros[1].estado).toBe('atrasado');
      expect(registros[2].estado).toBe('ausente');
    });
  });

  describe('obtenerAsistenciaCursoFecha', () => {
    it('retorna asistencia de un curso en una fecha', async () => {
      await descargarEstudiantesCurso('4°A', ESTUDIANTES_MOCK);
      await registrarAsistenciaCursoOffline(
        '4°A',
        '2026-08-16',
        [
          { estudianteId: 'e1', estado: 'presente' },
          { estudianteId: 'e2', estado: 'ausente' },
        ],
        'func-001'
      );

      const asistencia = await obtenerAsistenciaCursoFecha('4°A', '2026-08-16');
      expect(asistencia).toHaveLength(2);
    });

    it('retorna vacío si no hay asistencia', async () => {
      const asistencia = await obtenerAsistenciaCursoFecha('4°A', '2026-08-16');
      expect(asistencia).toHaveLength(0);
    });
  });

  describe('generarResumen', () => {
    it('genera resumen correcto', async () => {
      await descargarEstudiantesCurso('4°A', ESTUDIANTES_MOCK);
      await registrarAsistenciaCursoOffline(
        '4°A',
        '2026-08-16',
        [
          { estudianteId: 'e1', estado: 'presente' },
          { estudianteId: 'e2', estado: 'atrasado', minutosAtraso: 10 },
          { estudianteId: 'e3', estado: 'ausente' },
        ],
        'func-001'
      );

      const resumen = await generarResumen('4°A', '2026-08-16');
      expect(resumen.total).toBe(3);
      expect(resumen.presentes).toBe(1);
      expect(resumen.atrasados).toBe(1);
      expect(resumen.ausentes).toBe(1);
    });
  });

  describe('yaRegistrado', () => {
    it('retorna true si ya hay asistencia', async () => {
      await descargarEstudiantesCurso('4°A', ESTUDIANTES_MOCK);
      await registrarAsistenciaOffline('e1', '2026-08-16', 'presente', 'func-001');

      const registrado = await yaRegistrado('4°A', '2026-08-16');
      expect(registrado).toBe(true);
    });

    it('retorna false si no hay asistencia', async () => {
      const registrado = await yaRegistrado('4°A', '2026-08-16');
      expect(registrado).toBe(false);
    });
  });

  describe('contarPendientesSync', () => {
    it('cuenta registros no sincronizados', async () => {
      await descargarEstudiantesCurso('4°A', ESTUDIANTES_MOCK);
      await registrarAsistenciaOffline('e1', '2026-08-16', 'presente', 'func-001');
      await registrarAsistenciaOffline('e2', '2026-08-16', 'ausente', 'func-001');

      const pendientes = await contarPendientesSync();
      expect(pendientes).toBe(2);
    });
  });
});
