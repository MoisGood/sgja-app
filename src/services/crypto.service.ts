// ============================================================
// Servicio de cifrado — Web Crypto API (AES-GCM)
// src/services/crypto.service.ts
//
// Cifra datos antes de guardar en IndexedDB.
// Usa la contraseña del login del usuario como clave.
// ============================================================

const ALGORITMO = 'AES-GCM';
const LONGITUD_IV = 12;
const LONGITUD_SALT = 16;
const ITERACIONES_PBKDF2 = 100000;

function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer as ArrayBuffer;
}

function bufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(new Uint8Array(buffer));
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

function generarSalt(): ArrayBuffer {
  return crypto.getRandomValues(new Uint8Array(LONGITUD_SALT)).buffer as ArrayBuffer;
}

function generarIV(): ArrayBuffer {
  return crypto.getRandomValues(new Uint8Array(LONGITUD_IV)).buffer as ArrayBuffer;
}

export async function generarClave(
  password: string,
  salt: ArrayBuffer
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    stringToBuffer(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERACIONES_PBKDF2,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGORITMO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function cifrarDatos<T>(
  datos: T,
  password: string
): Promise<string> {
  const salt = generarSalt();
  const iv = generarIV();
  const clave = await generarClave(password, salt);

  const jsonStr = JSON.stringify(datos);
  const datosBuffer = stringToBuffer(jsonStr);

  const cifradoBuffer = await crypto.subtle.encrypt(
    { name: ALGORITMO, iv },
    clave,
    datosBuffer
  );

  const saltBase64 = bufferToBase64(salt);
  const ivBase64 = bufferToBase64(iv);
  const datosBase64 = bufferToBase64(cifradoBuffer);

  return `${saltBase64}.${ivBase64}.${datosBase64}`;
}

export async function descifrarDatos<T>(
  datosCifrados: string,
  password: string
): Promise<T> {
  const partes = datosCifrados.split('.');
  if (partes.length !== 3) {
    throw new Error('Formato de datos cifrados inválido');
  }

  const [saltBase64, ivBase64, datosBase64] = partes;
  const salt = base64ToBuffer(saltBase64);
  const iv = base64ToBuffer(ivBase64);
  const datosCifradosBuffer = base64ToBuffer(datosBase64);

  const clave = await generarClave(password, salt);

  const descifradoBuffer = await crypto.subtle.decrypt(
    { name: ALGORITMO, iv },
    clave,
    datosCifradosBuffer
  );

  const jsonStr = bufferToString(descifradoBuffer);
  return JSON.parse(jsonStr) as T;
}

export async function verificarPassword(
  datosCifrados: string,
  password: string
): Promise<boolean> {
  try {
    await descifrarDatos(datosCifrados, password);
    return true;
  } catch {
    return false;
  }
}
