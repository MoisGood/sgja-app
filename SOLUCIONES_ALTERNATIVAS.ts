// ============================================================
// Función auxiliar para cerrar sesiones inactivas automáticamente
// Agregar a src/services/online.ts
// ============================================================

/**
 * Versión mejorada de cerrarSesionesInactivas
 * Ahora verifica HEARTBEAT además de actividad
 * 
 * Lógica:
 * - Si no hay heartbeat en X minutos = sesión muerta (navegador cerrado)
 * - Si no hay actividad en Y minutos = usuario inactivo pero online
 * 
 * Uso: Llamar al abrir Seguridad tab o periódicamente desde useEffect
 */
export async function cerrarSesionesInactivasAvanzado(
  idUsuario: string,
  minutosParaHeartbeat: number = 5,     // Sin heartbeat = muerta
  minutosParaActividad: number = 30     // Sin actividad = inactiva
): Promise<number> {
  try {
    const onlineCollection = collection(db, 'online');
    const ahora = new Date();
    
    // Fecha límite para heartbeat (si no hay, sesión está muerta)
    const haceHeartbeat = new Date(ahora.getTime() - minutosParaHeartbeat * 60 * 1000);
    
    // Fecha límite para actividad (pero si hay heartbeat = sigue vivo)
    const haceActividad = new Date(ahora.getTime() - minutosParaActividad * 60 * 1000);
    
    // Encontrar sesiones CONECTADAS del usuario
    const q = query(
      onlineCollection,
      where('id_usuario', '==', idUsuario),
      where('estado', '==', 'conectado')
    );
    
    const snapshot = await getDocs(q);
    let cerradas = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const heartbeatTime = data.timestamp_heartbeat?.toDate?.() || data.timestamp_inicio?.toDate?.();
      const actividadTime = data.timestamp_ultima_actividad?.toDate?.();
      
      // CASO 1: Sin heartbeat = navegador cerrado
      if (heartbeatTime && heartbeatTime < haceHeartbeat) {
        console.warn(`🔴 Sesión sin heartbeat (navegador cerrado): ${data.email_usuario}`);
        await updateDoc(doc.ref, {
          estado: 'desconectado',
          timestamp_fin: serverTimestamp(),
          razon_cierre: `Sin heartbeat > ${minutosParaHeartbeat} min (navegador cerrado)`,
        });
        cerradas++;
        continue;
      }
      
      // CASO 2: Sin actividad = usuario inactivo
      if (actividadTime && actividadTime < haceActividad) {
        console.warn(`⚠️ Sesión sin actividad: ${data.email_usuario}`);
        await updateDoc(doc.ref, {
          estado: 'desconectado',
          timestamp_fin: serverTimestamp(),
          razon_cierre: `Sin actividad > ${minutosParaActividad} min`,
        });
        cerradas++;
        continue;
      }
    }
    
    if (cerradas > 0) {
      console.log(`✅ ${cerradas} sesión(es) cerrada(s) por inactividad`);
    }
    
    return cerradas;
    
  } catch (error) {
    console.error('Error al cerrar sesiones inactivas:', error);
    throw error;
  }
}

/**
 * Hook para ejecutar verificación periódica (Opción sin Cloud Function)
 * Coloca esto en AppContent.tsx para que se ejecute en background
 */
export function useAutoCloseInactiveSessions(
  idUsuario: string | undefined,
  intervaloMinutos: number = 10
) {
  useEffect(() => {
    if (!idUsuario) return;
    
    // Ejecutar inmediatamente
    cerrarSesionesInactivasAvanzado(idUsuario, 5, 30);
    
    // Luego cada X minutos
    const intervalo = setInterval(() => {
      cerrarSesionesInactivasAvanzado(idUsuario, 5, 30);
    }, intervaloMinutos * 60 * 1000);
    
    return () => clearInterval(intervalo);
  }, [idUsuario, intervaloMinutos]);
}
