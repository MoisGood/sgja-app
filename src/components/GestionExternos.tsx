import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  obtenerDominios, guardarDominio, toggleDominio, eliminarDominio,
  obtenerExcepciones, guardarExcepcion, eliminarExcepcion,
  generarToken, obtenerTokens, generarLinkAutenticacion,
  type DominioExterno, type ExcepcionExterna, type TokenAcceso,
} from '../services/externos.service';

interface Props { idEstablecimiento: string }

const ROLES = [
  { valor: 'ADMIN', etiqueta: 'Administrador' },
  { valor: 'INSPECTOR', etiqueta: 'Inspector' },
  { valor: 'PROFESOR', etiqueta: 'Profesor' },
  { valor: 'ESTUDIANTE', etiqueta: 'Estudiante' },
  { valor: 'APODERADO', etiqueta: 'Apoderado' },
  { valor: 'TECNICO', etiqueta: 'Tecnico' },
];

const sInp: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

export default function GestionExternos({ idEstablecimiento }: Props) {
  const [dominios, setDominios] = useState<DominioExterno[]>([]);
  const [excepciones, setExcepciones] = useState<ExcepcionExterna[]>([]);
  const [tokens, setTokens] = useState<TokenAcceso[]>([]);
  const [nuevoDominio, setNuevoDominio] = useState('');
  const [editDominioId, setEditDominioId] = useState<string | null>(null);
  const [editDominioVal, setEditDominioVal] = useState('');
  const [nuevoExEmail, setNuevoExEmail] = useState('');
  const [nuevoExRol, setNuevoExRol] = useState('TECNICO');
  const [emailDestino, setEmailDestino] = useState('');
  const [horasToken, setHorasToken] = useState(24);
  const [linkGenerado, setLinkGenerado] = useState('');
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) {
        supabase.from('usuarios').select('id').eq('uid', data.user.id).maybeSingle()
          .then(({ data: u }) => { if (u) setUid(u.id); });
      }
    });
    cargar();
  }, [idEstablecimiento]);

  async function cargar() {
    setDominios(await obtenerDominios(idEstablecimiento));
    setExcepciones(await obtenerExcepciones(idEstablecimiento));
    setTokens(await obtenerTokens(idEstablecimiento));
  }

  async function handleGuardarDominio() {
    const dom = nuevoDominio.trim() || editDominioVal.trim();
    if (!dom) return;
    const err = await guardarDominio(idEstablecimiento, dom, editDominioId || undefined);
    if (err) { alert('Error: ' + err); return; }
    setNuevoDominio('');
    setEditDominioId(null);
    setEditDominioVal('');
    cargar();
  }

  async function handleGuardarExcepcion() {
    if (!nuevoExEmail.trim()) return;
    const err = await guardarExcepcion(idEstablecimiento, nuevoExEmail.trim(), nuevoExRol);
    if (err) { alert('Error: ' + err); return; }
    setNuevoExEmail('');
    cargar();
  }

  async function handleGenerarToken() {
    if (!uid) return;
    const res = await generarToken(idEstablecimiento, uid, emailDestino.trim() || undefined, horasToken);
    if (res.error) { alert('Error: ' + res.error); return; }
    setLinkGenerado(generarLinkAutenticacion(res.token!));
    cargar();
  }

  function copiarLink() {
    navigator.clipboard.writeText(linkGenerado);
    alert('Link copiado');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Dominios autorizados */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#1F2937' }}>Dominios Autorizados</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B7280' }}>
          Solo emails con estos dominios podran autenticarse.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input value={nuevoDominio} onChange={e => setNuevoDominio(e.target.value)}
            placeholder="@gmail.com" style={{ ...sInp, flex: 1 }} />
          <button onClick={handleGuardarDominio}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#1A3C6B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Agregar
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Dominio</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#374151', width: 80 }}>Activo</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#374151', width: 100 }}>Accion</th>
            </tr>
          </thead>
          <tbody>
            {dominios.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '8px 10px' }}>
                  {editDominioId === d.id ? (
                    <input value={editDominioVal} onChange={e => setEditDominioVal(e.target.value)}
                      style={{ ...sInp, width: '100%' }} autoFocus />
                  ) : <span>@{d.dominio}</span>}
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: d.activo ? '#DCFCE7' : '#FEE2E2',
                    color: d.activo ? '#166534' : '#991B1B',
                  }}>{d.activo ? 'OK' : 'NO'}</span>
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                  {editDominioId === d.id ? (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button onClick={handleGuardarDominio} style={btnS('#059669')}>Guardar</button>
                      <button onClick={() => { setEditDominioId(null); setEditDominioVal(''); }} style={btnS('#6B7280')}>Cancelar</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button onClick={() => { setEditDominioId(d.id); setEditDominioVal(d.dominio); }} style={btnS('#F3F4F6')}>Editar</button>
                      <button onClick={() => toggleDominio(d.id, !d.activo).then(cargar)} style={btnS('#F3F4F6')}>{d.activo ? 'Desactivar' : 'Activar'}</button>
                      <button onClick={() => { if (confirm('Eliminar?')) eliminarDominio(d.id).then(cargar); }} style={btnS('#FEE2E2')}>Eliminar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {dominios.length === 0 && (
              <tr><td colSpan={3} style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Sin dominios registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Excepciones por email */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#1F2937' }}>Excepciones por Email</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B7280' }}>
          Estos emails pueden autenticarse con cualquier dominio y se les asigna un rol automaticamente.
          Ej: soportetipresente@gmail.com ya esta habilitado.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input value={nuevoExEmail} onChange={e => setNuevoExEmail(e.target.value)}
            placeholder="email@cualquierdominio.com" style={{ ...sInp, flex: 1, minWidth: 200 }} />
          <select value={nuevoExRol} onChange={e => setNuevoExRol(e.target.value)} style={sInp}>
            {ROLES.map(r => <option key={r.valor} value={r.valor}>{r.etiqueta}</option>)}
          </select>
          <button onClick={handleGuardarExcepcion}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#1A3C6B', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Agregar
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Email</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#374151', width: 100 }}>Rol</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#374151', width: 80 }}>Activo</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#374151', width: 80 }}>Accion</th>
            </tr>
          </thead>
          <tbody>
            {excepciones.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '8px 10px' }}>{e.email}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{e.rol}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: e.activo ? '#DCFCE7' : '#FEE2E2',
                    color: e.activo ? '#166534' : '#991B1B',
                  }}>{e.activo ? 'OK' : 'NO'}</span>
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                  <button onClick={() => { if (confirm('Eliminar?')) eliminarExcepcion(e.id).then(cargar); }} style={btnS('#FEE2E2')}>Eliminar</button>
                </td>
              </tr>
            ))}
            {excepciones.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Sin excepciones</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Link de acceso */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#1F2937' }}>Link de Acceso Externo</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B7280' }}>
          Genera un link que permite autenticarse con cualquier dominio.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input value={emailDestino} onChange={e => setEmailDestino(e.target.value)}
            placeholder="Email destino (opcional)" style={{ ...sInp, flex: 1, minWidth: 200 }} />
          <select value={horasToken} onChange={e => setHorasToken(Number(e.target.value))} style={sInp}>
            <option value={12}>12 horas</option>
            <option value={24}>24 horas</option>
          </select>
          <button onClick={handleGenerarToken}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Generar Link
          </button>
        </div>
        {linkGenerado && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#166534', marginBottom: 4 }}>Link generado:</div>
            <div style={{ fontSize: 12, color: '#1F2937', wordBreak: 'break-all', marginBottom: 8, background: '#fff', padding: 8, borderRadius: 4, border: '1px solid #D1D5DB' }}>
              {linkGenerado}
            </div>
            <button onClick={copiarLink} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#1A3C6B', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Copiar Link
            </button>
          </div>
        )}
        <details style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 13, color: '#6B7280', cursor: 'pointer' }}>Historial ({tokens.length})</summary>
          <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Token</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Expira</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 11 }}>{t.token.slice(0, 16)}...</td>
                    <td style={{ padding: '6px 8px' }}>{t.email_destino || '—'}</td>
                    <td style={{ padding: '6px 8px' }}>{new Date(t.expires_at).toLocaleDateString()}</td>
                    <td style={{ padding: '6px 8px' }}>
                      {t.usado ? 'Usado' : new Date(t.expires_at) < new Date() ? 'Expirado' : 'Vigente'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}

function btnS(bg: string): React.CSSProperties {
  return { padding: '4px 8px', borderRadius: 4, border: 'none', background: bg, color: bg === '#FEE2E2' ? '#991B1B' : '#374151', fontSize: 11, cursor: 'pointer' };
}
