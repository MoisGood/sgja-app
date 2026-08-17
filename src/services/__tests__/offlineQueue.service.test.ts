// Tests para offlineQueue.service.ts
// Archivo: src/services/__tests__/offlineQueue.service.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  agregarOperacion,
  obtenerPendientes,
  obtenerPorTipo,
  obtenerTodas,
  marcarSincronizando,
  marcarConfirmada,
  marcarError,
  eliminarOperacion,
  limpiarConfirmadas,
  obtenerEstadisticas,
  reintentarErrores,
} from '../offlineQueue.service';
import { limpiarTabla } from '../localDb.service';
import 'fake-indexeddb/auto';

describe('offlineQueue.service', () => {
  beforeEach(async () => {
    await limpiarTabla('cola_sync');
  });

  describe('agregarOperacion', () => {
    it('agrega una operación a la cola', async () => {
      const op = await agregarOperacion('asistencia', {
        estudiante_id: '1',
        estado: 'presente',
      });

      expect(op.id).toBeDefined();
      expect(op.tipo).toBe('asistencia');
      expect(op.estado).toBe('pendiente');
      expect(op.datos).toEqual({ estudiante_id: '1', estado: 'presente' });
      expect(op.intentos).toBe(0);
    });

    it('genera IDs únicos', async () => {
      const op1 = await agregarOperacion('asistencia', { id: '1' });
      const op2 = await agregarOperacion('asistencia', { id: '2' });

      expect(op1.id).not.toBe(op2.id);
    });
  });

  describe('obtenerPendientes', () => {
    it('retorna solo operaciones pendientes', async () => {
      await agregarOperacion('asistencia', { id: '1' });
      const op2 = await agregarOperacion('retiro', { id: '2' });
      await marcarConfirmada(op2.id);

      const pendientes = await obtenerPendientes();
      expect(pendientes).toHaveLength(1);
      expect(pendientes.every((p) => p.estado === 'pendiente')).toBe(true);
    });
  });

  describe('obtenerPorTipo', () => {
    it('filtra por tipo de operación', async () => {
      await agregarOperacion('asistencia', { id: '1' });
      await agregarOperacion('retiro', { id: '2' });
      await agregarOperacion('asistencia', { id: '3' });

      const asistencia = await obtenerPorTipo('asistencia');
      expect(asistencia).toHaveLength(2);
    });
  });

  describe('marcarSincronizando', () => {
    it('cambia estado a sincronizando e incrementa intentos', async () => {
      const op = await agregarOperacion('asistencia', { id: '1' });
      await marcarSincronizando(op.id);

      const actualizada = (await obtenerTodas()).find((o) => o.id === op.id);
      expect(actualizada?.estado).toBe('sincronizando');
      expect(actualizada?.intentos).toBe(1);
    });
  });

  describe('marcarConfirmada', () => {
    it('cambia estado a confirmado con timestamp', async () => {
      const op = await agregarOperacion('asistencia', { id: '1' });
      await marcarConfirmada(op.id);

      const actualizada = (await obtenerTodas()).find((o) => o.id === op.id);
      expect(actualizada?.estado).toBe('confirmado');
      expect(actualizada?.confirmado_en).toBeDefined();
    });
  });

  describe('marcarError', () => {
    it('cambia estado a error con mensaje', async () => {
      const op = await agregarOperacion('asistencia', { id: '1' });
      await marcarError(op.id, 'Error de red');

      const actualizada = (await obtenerTodas()).find((o) => o.id === op.id);
      expect(actualizada?.estado).toBe('error');
      expect(actualizada?.ultimo_error).toBe('Error de red');
    });
  });

  describe('eliminarOperacion', () => {
    it('elimina una operación de la cola', async () => {
      const op = await agregarOperacion('asistencia', { id: '1' });
      await eliminarOperacion(op.id);

      const todas = await obtenerTodas();
      expect(todas).toHaveLength(0);
    });
  });

  describe('limpiarConfirmadas', () => {
    it('elimina operaciones confirmadas antiguas', async () => {
      const op1 = await agregarOperacion('asistencia', { id: '1' });
      await marcarConfirmada(op1.id);

      // Simular que fue confirmada hace 8 días
      const todas = await obtenerTodas();
      const opConfirmada = todas[0];
      opConfirmada.confirmado_en = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      const { guardarRegistro } = await import('../localDb.service');
      await guardarRegistro('cola_sync', opConfirmada as never);

      await agregarOperacion('retiro', { id: '2' }); // Pendiente, no se elimina

      const eliminadas = await limpiarConfirmadas(7);
      expect(eliminadas).toBe(1);

      const restantes = await obtenerTodas();
      expect(restantes).toHaveLength(1);
      expect(restantes[0].tipo).toBe('retiro');
    });
  });

  describe('obtenerEstadisticas', () => {
    it('cuenta por estado', async () => {
      const op1 = await agregarOperacion('asistencia', { id: '1' });
      await agregarOperacion('retiro', { id: '2' });

      const op3 = await agregarOperacion('asistencia', { id: '3' });
      await marcarConfirmada(op3.id);

      await marcarError(op1.id, 'Falla');

      const stats = await obtenerEstadisticas();
      expect(stats.total).toBe(3);
      expect(stats.pendientes).toBe(1);
      expect(stats.confirmadas).toBe(1);
      expect(stats.errores).toBe(1);
    });
  });

  describe('reintentarErrores', () => {
    it('retorna operaciones en error con menos de 3 intentos', async () => {
      const op1 = await agregarOperacion('asistencia', { id: '1' });
      await marcarError(op1.id, 'Falla 1');

      const op2 = await agregarOperacion('retiro', { id: '2' });
      // Simular 3 intentos fallidos
      await marcarSincronizando(op2.id);
      await marcarError(op2.id, 'Falla');
      await marcarSincronizando(op2.id);
      await marcarError(op2.id, 'Falla');
      await marcarSincronizando(op2.id);
      await marcarError(op2.id, 'Falla');

      const reintentables = await reintentarErrores();
      expect(reintentables).toHaveLength(1);
      expect(reintentables[0].id).toBe(op1.id);
    });
  });
});
