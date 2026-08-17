// ============================================================
// Servicio de base local — IndexedDB wrapper
// src/services/localDb.service.ts
//
// Almacena datos en la base de datos del navegador.
// Integra con crypto.service.ts para cifrar/descifrar.
// ============================================================

import { cifrarDatos, descifrarDatos } from './crypto.service';

const DB_NAME = 'agil_local_db';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

/**
 * Abre (o crea) la base de datos local.
 */
export async function abrirBaseDatos(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Tabla de estudiantes (datos mínimos cifrados)
      if (!db.objectStoreNames.contains('estudiantes')) {
        const store = db.createObjectStore('estudiantes', { keyPath: 'id' });
        store.createIndex('rut', 'rut', { unique: false });
        store.createIndex('curso', 'curso', { unique: false });
      }

      // Tabla de asistencia (registros offline)
      if (!db.objectStoreNames.contains('asistencia')) {
        const store = db.createObjectStore('asistencia', { keyPath: 'id' });
        store.createIndex('estudiante_id', 'estudiante_id', { unique: false });
        store.createIndex('fecha', 'fecha', { unique: false });
        store.createIndex('estado', 'estado', { unique: false });
      }

      // Tabla de cola de sync (operaciones pendientes)
      if (!db.objectStoreNames.contains('cola_sync')) {
        const store = db.createObjectStore('cola_sync', { keyPath: 'id' });
        store.createIndex('tipo', 'tipo', { unique: false });
        store.createIndex('estado', 'estado', { unique: false });
        store.createIndex('creado_en', 'creado_en', { unique: false });
      }

      // Tabla de configuración
      if (!db.objectStoreNames.contains('configuracion')) {
        db.createObjectStore('configuracion', { keyPath: 'clave' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Cierra la conexión a la base de datos.
 */
export function cerrarBaseDatos(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// ============================================================
// Operaciones CRUD genéricas
// ============================================================

/**
 * Guarda un registro en una tabla.
 */
export async function guardarRegistro<T extends { id: string }>(
  tabla: string,
  registro: T
): Promise<void> {
  const db = await abrirBaseDatos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(tabla, 'readwrite');
    const store = tx.objectStore(tabla);
    const request = store.put(registro);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda un registro cifrado en una tabla.
 */
export async function guardarRegistroCifrado<T extends { id: string }>(
  tabla: string,
  registro: T,
  password: string
): Promise<void> {
  const datosCifrados = await cifrarDatos(registro, password);
  const registroCifrado = {
    id: registro.id,
    datos_cifrados: datosCifrados,
    creado_en: new Date().toISOString(),
  };
  return guardarRegistro(tabla, registroCifrado as never);
}

/**
 * Obtiene un registro por ID.
 */
export async function obtenerRegistro<T>(
  tabla: string,
  id: string
): Promise<T | null> {
  const db = await abrirBaseDatos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(tabla, 'readonly');
    const store = tx.objectStore(tabla);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Obtiene un registro cifrado y lo descifra.
 */
export async function obtenerRegistroCifrado<T>(
  tabla: string,
  id: string,
  password: string
): Promise<T | null> {
  const registro = await obtenerRegistro<{ id: string; datos_cifrados: string }>(tabla, id);
  if (!registro?.datos_cifrados) return null;
  return descifrarDatos<T>(registro.datos_cifrados, password);
}

/**
 * Obtiene todos los registros de una tabla.
 */
export async function obtenerTodos<T>(tabla: string): Promise<T[]> {
  const db = await abrirBaseDatos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(tabla, 'readonly');
    const store = tx.objectStore(tabla);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Obtiene registros por un índice.
 */
export async function obtenerPorIndice<T>(
  tabla: string,
  nombreIndice: string,
  valor: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  const db = await abrirBaseDatos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(tabla, 'readonly');
    const store = tx.objectStore(tabla);
    const index = store.index(nombreIndice);
    const request = index.getAll(valor);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Elimina un registro por ID.
 */
export async function eliminarRegistro(
  tabla: string,
  id: string
): Promise<void> {
  const db = await abrirBaseDatos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(tabla, 'readwrite');
    const store = tx.objectStore(tabla);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Elimina todos los registros de una tabla.
 */
export async function limpiarTabla(tabla: string): Promise<void> {
  const db = await abrirBaseDatos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(tabla, 'readwrite');
    const store = tx.objectStore(tabla);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cuenta los registros de una tabla.
 */
export async function contarRegistros(tabla: string): Promise<number> {
  const db = await abrirBaseDatos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(tabla, 'readonly');
    const store = tx.objectStore(tabla);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================
// Configuración (key-value simple)
// ============================================================

/**
 * Guarda un valor de configuración.
 */
export async function guardarConfig(clave: string, valor: unknown): Promise<void> {
  return guardarRegistro('configuracion', { clave, valor } as never);
}

/**
 * Obtiene un valor de configuración.
 */
export async function obtenerConfig<T>(clave: string): Promise<T | null> {
  const registro = await obtenerRegistro<{ clave: string; valor: T }>('configuracion', clave);
  return registro?.valor ?? null;
}
