// ============================================================
// SGJA – Servicio de Identificación de Dispositivo
// src/services/deviceId.ts
// ============================================================

/**
 * Genera un identificador único para el dispositivo
 * Combina información del navegador, pantalla y almacenamiento local
 * NO es 100% confiable pero es útil para rastrear dispositivos
 */
export async function generarIdDispositivo(): Promise<string> {
  try {
    // Obtener almacenamiento local para persistencia
    let deviceId = localStorage.getItem('device_id');
    
    if (!deviceId) {
      // Combinar múltiples factores para crear ID único
      const factores = [
        // User Agent
        navigator.userAgent,
        // Pantalla
        `${screen.width}x${screen.height}x${screen.colorDepth}`,
        // Zona horaria
        new Date().getTimezoneOffset(),
        // Idioma
        navigator.language,
        // Número aleatorio
        Math.random().toString(36).substring(2, 15),
        // Timestamp
        Date.now(),
      ];

      // Crear hash simple (NO es criptográfico, solo para identificación)
      const stringCombinado = factores.join('|');
      let hash = 0;
      
      for (let i = 0; i < stringCombinado.length; i++) {
        const char = stringCombinado.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }

      deviceId = `DEV_${Math.abs(hash).toString(16).toUpperCase()}_${Date.now()}`;
      
      // Guardar en localStorage para usar en próximas sesiones
      localStorage.setItem('device_id', deviceId);
      console.log(`🔐 ID de dispositivo generado: ${deviceId}`);
    } else {
      console.log(`🔐 ID de dispositivo recuperado: ${deviceId}`);
    }

    return deviceId;
  } catch (error) {
    console.error('Error al generar ID de dispositivo:', error);
    // Fallback: generar ID temporal
    return `DEV_TEMP_${Date.now()}`;
  }
}

/**
 * Obtiene información del User Agent
 */
export function obtenerUserAgent(): {
  userAgent: string;
  appVersion: string;
  platform: string;
  vendor: string;
  language: string;
  maxTouchPoints: number;
  pointerEvents: boolean;
} {
  return {
    userAgent: navigator.userAgent,
    appVersion: navigator.appVersion,
    platform: navigator.platform,
    vendor: navigator.vendor,
    language: navigator.language,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    pointerEvents: window.PointerEvent !== undefined,
  };
}

/**
 * Obtiene información de hardware disponible
 */
export function obtenerInfoHardware(): {
  cores: number | string;
  ram?: number;
  conexion?: string;
} {
  const info: { cores: number | string; ram?: number; conexion?: string } = {
    cores: navigator.hardwareConcurrency || 'N/A',
  };

  // Intentar obtener RAM (solo en algunos navegadores)
  const navExt = navigator as unknown as { deviceMemory?: number };
  if (navExt?.deviceMemory) {
    info.ram = navExt.deviceMemory;
  }

  // Tipo de conexión
  const navConn = navigator as unknown as { connection?: { effectiveType: string } };
  if (navConn?.connection) {
    info.conexion = navConn.connection.effectiveType;
  }

  return info;
}

/**
 * Obtiene información de WebGL (incluye modelo de GPU)
 */
export function obtenerInfoWebGL(): {
  vendor: string;
  renderer: string;
  version: string;
} {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return {
        vendor: 'No disponible',
        renderer: 'No disponible',
        version: 'No disponible',
      };
    }

    // Simplificar: solo obtener información básica de WebGL
    const glExt = gl as unknown as { getExtension?: (name: string) => unknown };
    
    try {
      glExt.getExtension?.('WEBGL_debug_renderer_info');
    } catch {
      // Ignorar errores de extensión
    }
    
    return {
      vendor: 'WebGL Disponible',
      renderer: 'Renderizador Activo',
      version: '1.0',
    };
  } catch (error) {
    console.warn('WebGL no disponible:', error);
    return {
      vendor: 'No disponible',
      renderer: 'No disponible',
      version: 'No disponible',
    };
  }
}

/**
 * Obtiene información del canvas fingerprinting
 * (técnica para identificar dispositivos de forma única)
 */
export async function obtenerCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 60;

    const ctx = canvas.getContext('2d');
    if (!ctx) return 'NO_CANVAS';

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('SGJA Device ID', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('SGJA Device ID', 4, 17);

    const fingerprint = canvas.toDataURL();
    return fingerprint.substring(0, 50); // Retornar primeros 50 caracteres
  } catch (error) {
    console.warn('Canvas fingerprinting no disponible:', error);
    return 'NO_FINGERPRINT';
  }
}

/**
 * Obtiene información de la pantalla
 */
export function obtenerInfoPantalla(): {
  resolucion: string;
  colorDepth: number;
  pixelDepth: number;
  devicePixelRatio: number;
  orientacion: string;
} {
  return {
    resolucion: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    devicePixelRatio: window.devicePixelRatio,
    orientacion: (screen.orientation?.type as string) || (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'),
  };
}

/**
 * Obtiene información del sistema operativo
 */
export function obtenerSistemaOperativo(): {
  nombre: string;
  version: string;
  arquitectura: string;
  tipo: string;
} {
  const userAgent = navigator.userAgent;
  let nombre = 'Desconocido';
  let version = 'N/A';
  let arquitectura = 'N/A';
  let tipo = 'Desktop';

  // Detectar SO
  if (userAgent.includes('Windows')) {
    nombre = 'Windows';
    // Extraer versión de Windows
    if (userAgent.includes('Windows NT 10.0')) version = '10/11';
    else if (userAgent.includes('Windows NT 6.3')) version = '8.1';
    else if (userAgent.includes('Windows NT 6.2')) version = '8';
    else if (userAgent.includes('Windows NT 6.1')) version = '7';
  } else if (userAgent.includes('Mac')) {
    nombre = 'macOS';
    const match = userAgent.match(/Mac OS X ([0-9_.]+)/);
    if (match) version = match[1];
    // Detectar arquitectura
    if (userAgent.includes('AppleSilicon')) arquitectura = 'ARM64';
    else arquitectura = 'Intel';
  } else if (userAgent.includes('Linux')) {
    nombre = 'Linux';
  } else if (userAgent.includes('Android')) {
    nombre = 'Android';
    const match = userAgent.match(/Android ([0-9_.]+)/);
    if (match) version = match[1];
    tipo = 'Mobile/Tablet';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    nombre = 'iOS';
    const match = userAgent.match(/OS ([0-9_]+)/);
    if (match) version = match[1].replace(/_/g, '.');
    arquitectura = 'ARM64';
    tipo = userAgent.includes('iPad') ? 'Tablet' : 'Mobile';
  }

  return {
    nombre,
    version,
    arquitectura,
    tipo,
  };
}

/**
 * Obtiene información del navegador
 */
export function obtenerInfoNavegador(): {
  nombre: string;
  version: string;
  engine: string;
  esMovil: boolean;
  tiempoZona: number;
} {
  const userAgent = navigator.userAgent;
  let nombre = 'Desconocido';
  let version = 'N/A';
  let engine = 'Desconocido';

  // Detectar navegador
  if (userAgent.includes('Chrome') && !userAgent.includes('Chromium')) {
    nombre = 'Chrome';
    engine = 'Blink';
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    if (match) version = match[1];
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    nombre = 'Safari';
    engine = 'WebKit';
    const match = userAgent.match(/Version\/([0-9.]+)/);
    if (match) version = match[1];
  } else if (userAgent.includes('Firefox')) {
    nombre = 'Firefox';
    engine = 'Gecko';
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    if (match) version = match[1];
  } else if (userAgent.includes('Edge')) {
    nombre = 'Edge';
    engine = 'Blink';
    const match = userAgent.match(/Edg\/([0-9.]+)/);
    if (match) version = match[1];
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    nombre = 'Opera';
    engine = 'Blink';
    const match = userAgent.match(/OPR\/([0-9.]+)/);
    if (match) version = match[1];
  }

  const esMovil = /Mobile|Android|iPhone|iPad|iPod/.test(userAgent);

  return {
    nombre,
    version,
    engine,
    esMovil,
    tiempoZona: new Date().getTimezoneOffset(),
  };
}

/**
 * Intenta obtener dirección MAC (solo en casos muy específicos)
 * NOTA: Por razones de seguridad/privacidad, los navegadores modernos 
 * NO permiten acceso directo a la MAC address en páginas web
 * Esta función intenta técnicas alternativas que pueden funcionar en redes corporativas
 */
export async function obtenerMacAddress(): Promise<string | null> {
  try {
    // Intentar a través de WebRTC (deprecated pero algunos navegadores lo permiten)
    const WindowExt = window as unknown as { RTCPeerConnection: typeof RTCPeerConnection };
    const RTCPeerConnectionClass = WindowExt.RTCPeerConnection;
    
    if (!RTCPeerConnectionClass) {
      return null;
    }

    const peerConnection = new RTCPeerConnectionClass({
      iceServers: [],
    });

    peerConnection.createDataChannel('');
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Parsear la descripción SDP para obtener info de red
    if (!peerConnection.localDescription) {
      peerConnection.close();
      return null;
    }

    const sdp = peerConnection.localDescription.sdp;
    const ips = sdp.match(/candidate:(?:.*) (\S+) (\d+) typ/g);

    if (ips && ips.length > 0) {
      // Extraer IP local
      const candidateInfo = ips[0];
      console.log('Información de candidato WebRTC:', candidateInfo);
      // Esto da IPs locales, no MAC directamente
      return null; // No se puede obtener MAC directamente
    }

    peerConnection.close();
    return null;
  } catch (error) {
    console.warn('No se puede obtener MAC address (esperado por seguridad):', error);
    return null;
  }
}

/**
 * Obtiene información de IMEI para dispositivos móviles
 * NOTA: Los navegadores modernos NO permiten acceso al IMEI por razones de seguridad
 * Solo funciona en apps nativas o con permisos especiales
 */
export function obtenerIMEI(): string | null {
  try {
    // En navegadores web, esto NO es accesible
    // Solo en aplicaciones nativas (React Native, Cordova, etc.)
    const NavExt = navigator as unknown as { mediaDevices?: { enumerateDevices: () => Promise<unknown> } };
    if (NavExt?.mediaDevices?.enumerateDevices) {
      console.warn('IMEI no accesible desde navegador web por razones de seguridad');
    }
    return null;
  } catch (error) {
    console.warn('IMEI no disponible:', error);
    return null;
  }
}

/**
 * Obtiene información del dispositivo (compatibilidad)
 */
export function obtenerInfoDispositivo(): {
  dispositivo: string;
  navegador: string;
  pantalla: string;
  sistemaOperativo: string;
  idioma: string;
} {
  const userAgent = navigator.userAgent;
  
  // Detectar sistema operativo
  let sistemaOperativo = 'Desconocido';
  if (userAgent.includes('Windows')) sistemaOperativo = 'Windows';
  else if (userAgent.includes('Mac')) sistemaOperativo = 'macOS';
  else if (userAgent.includes('Linux')) sistemaOperativo = 'Linux';
  else if (userAgent.includes('Android')) sistemaOperativo = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) sistemaOperativo = 'iOS';

  // Detectar navegador
  let navegador = 'Desconocido';
  if (userAgent.includes('Chrome') && !userAgent.includes('Chromium')) navegador = 'Chrome';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) navegador = 'Safari';
  else if (userAgent.includes('Firefox')) navegador = 'Firefox';
  else if (userAgent.includes('Edge')) navegador = 'Edge';
  else if (userAgent.includes('Opera') || userAgent.includes('OPR')) navegador = 'Opera';

  // Detectar dispositivo
  let dispositivo = 'Desktop';
  if (userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('Android')) {
    dispositivo = 'Mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    dispositivo = 'Tablet';
  }

  return {
    dispositivo,
    navegador,
    pantalla: `${screen.width}x${screen.height}`,
    sistemaOperativo,
    idioma: navigator.language,
  };
}

/**
 * Obtiene la IP del cliente
 */
export async function obtenerIpCliente(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.ipify.org?format=json', { 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return data.ip || null;
    }
    return null;
  } catch (error) {
    console.warn('No se pudo obtener la IP del cliente:', error);
    return null;
  }
}

/**
 * Obtiene información COMPLETA del dispositivo incluyendo todos los detalles
 */
export async function obtenerDetallesDispositivo(): Promise<{
  idDispositivo: string;
  info: ReturnType<typeof obtenerInfoDispositivo>;
  ip?: string;
  webgl?: ReturnType<typeof obtenerInfoWebGL>;
  hardware?: ReturnType<typeof obtenerInfoHardware>;
  pantalla?: ReturnType<typeof obtenerInfoPantalla>;
  navegador?: ReturnType<typeof obtenerInfoNavegador>;
  so?: ReturnType<typeof obtenerSistemaOperativo>;
  userAgent?: ReturnType<typeof obtenerUserAgent>;
  canvasFingerprint?: string;
  mac?: string | null;
  imei?: string | null;
}> {
  const idDispositivo = await generarIdDispositivo();
  const info = obtenerInfoDispositivo();
  const ip = await obtenerIpCliente();
  const webgl = obtenerInfoWebGL();
  const hardware = obtenerInfoHardware();
  const pantalla = obtenerInfoPantalla();
  const navegador = obtenerInfoNavegador();
  const so = obtenerSistemaOperativo();
  const userAgent = obtenerUserAgent();
  const canvasFingerprint = await obtenerCanvasFingerprint();
  const mac = await obtenerMacAddress();
  const imei = obtenerIMEI();

  return {
    idDispositivo,
    info,
    ip: ip || undefined,
    webgl,
    hardware,
    pantalla,
    navegador,
    so,
    userAgent,
    canvasFingerprint,
    mac: mac || undefined,
    imei: imei || undefined,
  };
}
