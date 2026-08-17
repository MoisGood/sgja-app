// Tests para localDb.service.ts
// Archivo: src/services/__tests__/localDb.service.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  abrirBaseDatos,
  cerrarBaseDatos,
  guardarRegistro,
  obtenerRegistro,
  obtenerTodos,
  obtenerPorIndice,
  eliminarRegistro,
  limpiarTabla,
  contarRegistros,
  guardarConfig,
  obtenerConfig,
} from '../localDb.service';

// Simular IndexedDB para el entorno de test
import 'fake-indexeddb/auto';

describe('localDb.service', () => {
  beforeEach(async () => {
    await abrirBaseDatos();
    await limpiarTabla('estudiantes');
    await limpiarTabla('asistencia');
    await limpiarTabla('cola_sync');
    await limpiarTabla('configuracion');
  });

  afterEach(() => {
    cerrarBaseDatos();
  });

  describe('guardarRegistro / obtenerRegistro', () => {
    it('guarda y obtiene un registro', async () => {
      const estudiante = {
        id: '1',
        rut: '12.345.678-9',
        nombre: 'Juan Pérez',
        curso: '4°A',
      };

      await guardarRegistro('estudiantes', estudiante);
      const resultado = await obtenerRegistro('estudiantes', '1');

      expect(resultado).toEqual(estudiante);
    });

    it('retorna null si no existe', async () => {
      const resultado = await obtenerRegistro('estudiantes', 'no-existe');
      expect(resultado).toBeNull();
    });

    it('actualiza un registro existente', async () => {
      const estudiante = { id: '1', nombre: 'Juan' };
      await guardarRegistro('estudiantes', estudiante);

      const actualizado = { id: '1', nombre: 'Juan Pérez' };
      await guardarRegistro('estudiantes', actualizado);

      const resultado = await obtenerRegistro('estudiantes', '1');
      expect(resultado).toEqual(actualizado);
    });
  });

  describe('obtenerTodos', () => {
    it('retorna todos los registros', async () => {
      await guardarRegistro('estudiantes', { id: '1', nombre: 'Juan' });
      await guardarRegistro('estudiantes', { id: '2', nombre: 'María' });
      await guardarRegistro('estudiantes', { id: '3', nombre: 'Pedro' });

      const todos = await obtenerTodos('estudiantes');
      expect(todos).toHaveLength(3);
    });

    it('retorna array vacío si no hay registros', async () => {
      const todos = await obtenerTodos('estudiantes');
      expect(todos).toHaveLength(0);
    });
  });

  describe('eliminarRegistro', () => {
    it('elimina un registro', async () => {
      await guardarRegistro('estudiantes', { id: '1', nombre: 'Juan' });
      await eliminarRegistro('estudiantes', '1');

      const resultado = await obtenerRegistro('estudiantes', '1');
      expect(resultado).toBeNull();
    });
  });

  describe('limpiarTabla', () => {
    it('elimina todos los registros de una tabla', async () => {
      await guardarRegistro('estudiantes', { id: '1', nombre: 'Juan' });
      await guardarRegistro('estudiantes', { id: '2', nombre: 'María' });

      await limpiarTabla('estudiantes');

      const todos = await obtenerTodos('estudiantes');
      expect(todos).toHaveLength(0);
    });
  });

  describe('contarRegistros', () => {
    it('cuenta los registros', async () => {
      await guardarRegistro('estudiantes', { id: '1', nombre: 'Juan' });
      await guardarRegistro('estudiantes', { id: '2', nombre: 'María' });

      const count = await contarRegistros('estudiantes');
      expect(count).toBe(2);
    });
  });

  describe('guardarConfig / obtenerConfig', () => {
    it('guarda y obtiene configuración', async () => {
      await guardarConfig('ultima_sesion', '2026-08-16');
      const valor = await obtenerConfig<string>('ultima_sesion');
      expect(valor).toBe('2026-08-16');
    });

    it('retorna null si no existe la clave', async () => {
      const valor = await obtenerConfig('no-existe');
      expect(valor).toBeNull();
    });
  });
});
