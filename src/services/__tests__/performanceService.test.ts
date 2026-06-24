import { describe, it, expect, beforeEach } from 'vitest';
import { performanceService } from '../performanceService';
import { offlineStore } from '../offlineStore';

beforeEach(async () => {
  await offlineStore.clear('desempeno');
  await offlineStore.clear('sync_queue');
});

const mockActividades = [
  { id: 'act-1', id_asignatura: 'mat-101', id_periodo: 'per-1', ponderacion: 2, nombre: 'Prueba 1' },
  { id: 'act-2', id_asignatura: 'mat-101', id_periodo: 'per-1', ponderacion: 3, nombre: 'Prueba 2' },
];

describe('performanceService', () => {
  it('guarda desempeno offline', async () => {
    const result = await performanceService.saveDesempeno({
      id_actividad: 'act-1',
      id_estudiante: 'est-1',
      nota: 5.5,
      observaciones: '',
      activo: true,
    });
    expect(result).not.toBeNull();
    expect(result?.nota).toBe(5.5);
    expect(result?.id_actividad).toBe('act-1');
  });

  it('guarda batch de desempenos', async () => {
    const count = await performanceService.saveDesempenoBatch([
      { id_actividad: 'act-1', id_estudiante: 'est-1', nota: 6.0, observaciones: '', activo: true },
      { id_actividad: 'act-1', id_estudiante: 'est-2', nota: 4.5, observaciones: '', activo: true },
      { id_actividad: 'act-1', id_estudiante: 'est-3', nota: 3.2, observaciones: '', activo: true },
    ]);
    expect(count).toBe(3);
  });

  it('actualiza nota existente', async () => {
    const saved = await performanceService.saveDesempeno({
      id_actividad: 'act-1', id_estudiante: 'est-1', nota: 4.0, observaciones: '', activo: true,
    });
    const ok = await performanceService.updateDesempeno(saved!.id, { nota: 5.0 });
    expect(ok).toBe(true);
    const updated = await performanceService.getDesempeno(saved!.id);
    expect(updated?.nota).toBe(5.0);
  });

  it('retorna desempenos por actividad', async () => {
    await performanceService.saveDesempeno({ id_actividad: 'act-1', id_estudiante: 'est-1', nota: 6.0, observaciones: '', activo: true });
    await performanceService.saveDesempeno({ id_actividad: 'act-1', id_estudiante: 'est-2', nota: 5.0, observaciones: '', activo: true });
    await performanceService.saveDesempeno({ id_actividad: 'act-2', id_estudiante: 'est-1', nota: 4.0, observaciones: '', activo: true });

    const results = await performanceService.getDesempenoByActividad('act-1');
    expect(results).toHaveLength(2);
  });

  it('retorna desempenos por estudiante', async () => {
    await performanceService.saveDesempeno({ id_actividad: 'act-1', id_estudiante: 'est-1', nota: 6.0, observaciones: '', activo: true });
    await performanceService.saveDesempeno({ id_actividad: 'act-2', id_estudiante: 'est-1', nota: 5.0, observaciones: '', activo: true });
    await performanceService.saveDesempeno({ id_actividad: 'act-1', id_estudiante: 'est-2', nota: 4.0, observaciones: '', activo: true });

    const results = await performanceService.getDesempenoByEstudiante('est-1');
    expect(results).toHaveLength(2);
  });

  it('calcula promedio ponderado', async () => {
    await performanceService.saveDesempeno({ id_actividad: 'act-1', id_estudiante: 'est-1', nota: 6.0, observaciones: '', activo: true });
    await performanceService.saveDesempeno({ id_actividad: 'act-2', id_estudiante: 'est-1', nota: 4.0, observaciones: '', activo: true });
    const prom = await performanceService.calcularPromedio('est-1', 'mat-101', 'per-1', mockActividades);
    expect(prom).not.toBeNull();
    const esperado = (6.0 * 2 + 4.0 * 3) / (2 + 3);
    expect(prom?.promedio_final).toBeCloseTo(esperado, 1);
  });

  it('detecta riesgo cuando promedio < 4.0', async () => {
    await performanceService.saveDesempeno({ id_actividad: 'act-1', id_estudiante: 'est-1', nota: 3.0, observaciones: '', activo: true });
    await performanceService.saveDesempeno({ id_actividad: 'act-2', id_estudiante: 'est-1', nota: 3.5, observaciones: '', activo: true });
    const prom = await performanceService.calcularPromedio('est-1', 'mat-101', 'per-1', mockActividades);
    expect(prom?.estado).toBe('riesgo');
  });

  it('retorna null si no hay notas', async () => {
    const prom = await performanceService.calcularPromedio('est-99', 'mat-101', 'per-1', mockActividades);
    expect(prom).toBeNull();
  });

  it('elimina desempeno de offlineStore', async () => {
    const saved = await performanceService.saveDesempeno({
      id_actividad: 'act-1', id_estudiante: 'est-1', nota: 5.0, observaciones: '', activo: true,
    });
    await performanceService.removeDesempeno(saved!.id);
    const result = await offlineStore.getById<Record<string, unknown>>('desempeno', saved!.id);
    expect(result).toBeNull();
  });
});
