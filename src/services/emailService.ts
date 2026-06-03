const API_URL = typeof window !== 'undefined' ? '' : '';

export async function enviarCorreo(
  to: string,
  subject: string,
  html: string,
  emailConfig?: { email: string; appPassword: string; displayName?: string; port?: number; ssl?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    const body: any = { to, subject, html };
    if (emailConfig) body.emailConfig = emailConfig;
    const res = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function generarHtmlNotificacion(
  tipo: 'vencido' | 'devuelto' | 'multa' | 'disponible',
  datos: { estudiante?: string; libro?: string; fecha?: string; monto?: number; dias?: number }
): { subject: string; html: string } {
  const templates: Record<string, { subject: string; html: string }> = {
    vencido: {
      subject: `📚 Préstamo vencido - ${datos.libro || ''}`,
      html: `
        <h2 style="color:#DC2626;">Préstamo vencido</h2>
        <p>Estimado(a) <strong>${datos.estudiante || 'usuario'}</strong>,</p>
        <p>El libro <strong>"${datos.libro}"</strong> tenía fecha de devolución el <strong>${datos.fecha}</strong> y se encuentra vencido.</p>
        <p>Te solicitamos devolverlo a la brevedad para evitar multas.</p>
        <hr><p style="font-size:12px;color:#6B7280;">SGJA - Sistema de Gestión de Biblioteca</p>`
    },
    devuelto: {
      subject: `✅ Libro devuelto - ${datos.libro || ''}`,
      html: `
        <h2 style="color:#10B981;">Devolución confirmada</h2>
        <p>El libro <strong>"${datos.libro}"</strong> ha sido devuelto correctamente.</p>
        ${datos.monto ? `<p>Multa aplicada: <strong>$${datos.monto}</strong></p>` : ''}
        <hr><p style="font-size:12px;color:#6B7280;">SGJA - Sistema de Gestión de Biblioteca</p>`
    },
    multa: {
      subject: `💰 Multa aplicada - ${datos.libro || ''}`,
      html: `
        <h2 style="color:#F59E0B;">Multa registrada</h2>
        <p>Se ha registrado una multa por el libro <strong>"${datos.libro}"</strong>.</p>
        <p>Monto: <strong>$${datos.monto}</strong></p>
        ${datos.dias ? `<p>Días de suspensión: <strong>${datos.dias}</strong></p>` : ''}
        <hr><p style="font-size:12px;color:#6B7280;">SGJA - Sistema de Gestión de Biblioteca</p>`
    },
    disponible: {
      subject: `📖 Libro disponible - ${datos.libro || ''}`,
      html: `
        <h2 style="color:#3B82F6;">Libro disponible</h2>
        <p>El libro <strong>"${datos.libro}"</strong> que solicitaste ya está disponible.</p>
        <p>Puedes acercarte a la biblioteca para retirarlo.</p>
        <hr><p style="font-size:12px;color:#6B7280;">SGJA - Sistema de Gestión de Biblioteca</p>`
    },
  };

  return templates[tipo] || templates.devuelto;
}
