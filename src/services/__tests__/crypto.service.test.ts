// Tests para crypto.service.ts
// Archivo: src/services/__tests__/crypto.service.test.ts

import { describe, it, expect } from 'vitest';
import {
  generarClave,
  cifrarDatos,
  descifrarDatos,
  verificarPassword,
} from '../crypto.service';

describe('crypto.service', () => {
  const password = 'MiContraseñaSegura123!';

  describe('cifrarDatos / descifrarDatos', () => {
    it('cifra y descifra un objeto simple', async () => {
      const datos = { rut: '12.345.678-9', nombre: 'Juan Pérez' };
      const cifrado = await cifrarDatos(datos, password);

      expect(cifrado).not.toBe(JSON.stringify(datos));
      expect(cifrado.split('.')).toHaveLength(3);

      const descifrado = await descifrarDatos<typeof datos>(cifrado, password);
      expect(descifrado).toEqual(datos);
    });

    it('cifra y descifra un objeto complejo', async () => {
      const datos = {
        estudiante: { rut: '12.345.678-9', nombre: 'Juan', edad: 15 },
        apoderado: { nombre: 'María', telefono: '+56912345678' },
        notas: ['primera', 'segunda', 'tercera'],
        activo: true,
      };

      const cifrado = await cifrarDatos(datos, password);
      const descifrado = await descifrarDatos<typeof datos>(cifrado, password);

      expect(descifrado).toEqual(datos);
    });

    it('genera resultados diferentes para los mismos datos (por IV y salt aleatorios)', async () => {
      const datos = { rut: '12.345.678-9' };
      const cifrado1 = await cifrarDatos(datos, password);
      const cifrado2 = await cifrarDatos(datos, password);

      expect(cifrado1).not.toBe(cifrado2);
    });

    it('falla al descifrar con contraseña incorrecta', async () => {
      const datos = { rut: '12.345.678-9' };
      const cifrado = await cifrarDatos(datos, password);

      await expect(
        descifrarDatos(cifrado, 'ContraseñaIncorrecta')
      ).rejects.toThrow();
    });

    it('falla con formato inválido', async () => {
      await expect(
        descifrarDatos('datos-invalidos', password)
      ).rejects.toThrow('Formato de datos cifrados inválido');
    });
  });

  describe('verificarPassword', () => {
    it('retorna true con contraseña correcta', async () => {
      const datos = { test: 'valor' };
      const cifrado = await cifrarDatos(datos, password);

      const resultado = await verificarPassword(cifrado, password);
      expect(resultado).toBe(true);
    });

    it('retorna false con contraseña incorrecta', async () => {
      const datos = { test: 'valor' };
      const cifrado = await cifrarDatos(datos, password);

      const resultado = await verificarPassword(cifrado, 'Incorrecta');
      expect(resultado).toBe(false);
    });
  });
});
