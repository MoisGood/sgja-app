/**
 * convertir-formulario.js
 * Convierte JSON del editor visual → Componente React (.tsx)
 *
 * Uso: node scripts/convertir-formulario.js <input.json> <output.tsx>
 *
 * Ejemplo:
 *   node scripts/convertir-formulario.js export.json src/pages/MiFormulario.tsx
 */

const fs = require('fs');
const path = require('path');

// ─── HELPERS ───────────────────────────────────────────────

function escape(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function toPascalCase(str) {
  return str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function mapTipo(tipo) {
  const map = {
    text: 'text',
    textarea: 'textarea',
    date: 'date',
    time: 'time',
    checkbox: 'checkbox',
    firma: 'firma',
    label: 'label',
    linea: 'linea',
    rectangulo: 'rectangulo',
    search: 'search',
  };
  return map[tipo] || 'text';
}

// ─── GENERAR CAMPOS ────────────────────────────────────────

function generarCampo(c, idx) {
  const lines = [];
  const s = c;

  // Estilo base
  const style = {
    position: 'absolute',
    left: (s.x || 0) + 'px',
    top: (s.y || 0) + 'px',
    zIndex: s.zIndex || 1,
    background: s.bgColor && s.bgColor !== '#ffffff' ? s.bgColor : '#fff',
  };
  if (s.width) style.width = s.width;
  if (s.height) style.height = s.height;
  if (s.borderGeneral) style.border = s.borderGeneral;
  else if (s.tipo !== 'rectangulo') style.border = '1px solid #e5e7eb';
  if (s.borderRadius) style.borderRadius = s.borderRadius;
  else style.borderRadius = '4px';
  if (s.boxShadow) style.boxShadow = s.boxShadow;
  if (s.campoOpacity !== undefined && s.campoOpacity < 1) style.opacity = s.campoOpacity;
  if (s.borderTop) style.borderTop = s.borderTop;
  if (s.borderBottom) style.borderBottom = s.borderBottom;
  if (s.borderLeft) style.borderLeft = s.borderLeft;
  if (s.borderRight) style.borderRight = s.borderRight;
  if (s.fontSize) style.fontSize = s.fontSize;
  if (s.fontWeight) style.fontWeight = s.fontWeight;
  if (s.fontColor) style.color = s.fontColor;
  if (s.textAlign) style.textAlign = s.textAlign;
  // Línea: no necesita border-radius
  if (s.tipo === 'linea') { delete style.borderRadius; delete style.border; style.background = 'transparent'; }

  const styStr = JSON.stringify(style, null, 2).replace(/"([^"]+)":/g, '$1:');

  const key = `campo_${idx}`;

  switch (s.tipo) {
    case 'label':
      return `  // ${s.label || 'Label'}
  const ${key} = useMemo(() => (
    <div key="${s.id}" style={${styStr}}>
      ${JSON.stringify(s.label || '')}
    </div>
  ), []);
  return ${key};`;

    case 'firma':
      return `  // ${s.label || 'Firma'}
  const ${key} = (
    <div key="${s.id}" style={${styStr}}>
      <input type="text" value={valores['${s.id}'] || ''} onChange={e => act('${s.id}', e.target.value)}
        style={{ width:'100%', border:'none', borderBottom:'1px solid #999', borderRadius:0, outline:'none', background:'transparent', fontSize:'${s.fontSize || '12px'}', padding:0, fontFamily:'inherit' }} />
      ${s.firmaLabel ? `<div style={{ fontSize:'9px', fontWeight:600, color:'#666', textAlign:'center' }}>${escape(s.firmaLabel)}</div>` : ''}
    </div>
  );`;

    case 'checkbox':
      return `  // ${s.labelCheckbox || s.label || 'Checkbox'}
  const ${key} = (
    <div key="${s.id}" style={{${Object.entries(style).map(([k,v]) => `${k}:${JSON.stringify(v)}`).join(',')}, display:'flex', alignItems:'center', gap:'6px', cursor:'default' }}>
      <input type="checkbox" checked={!!valores['${s.id}']} onChange={e => act('${s.id}', e.target.checked)}
        style={{ width:'16px', height:'16px', cursor:'pointer' }} />
      <span>${escape(s.labelCheckbox || s.label || 'Opción')}</span>
    </div>
  );`;

    case 'linea':
      // Limpiar estilos que no aplican a la línea
      delete style.background;
      delete style.border;
      delete style.borderRadius;
      return `  // Línea
  const ${key} = (
    <div key="${s.id}" style={${JSON.stringify(style, null, 2).replace(/"([^"]+)":/g, '$1:')}}>
      <hr style={{ border:'none', borderTop:'${s.borderGeneral || '2px solid #ccc'}', width:'${s.width || '100%'}', margin:'4px 0'${s.rotacion ? `, transform:'rotate(${s.rotacion}deg)'` : ''}${s.difuminado ? ", WebkitMaskImage:'linear-gradient(to right,transparent,#000 15%,#000 85%,transparent)', maskImage:'linear-gradient(to right,transparent,#000 15%,#000 85%,transparent)'" : ''} }} />
    </div>
  );`;

    case 'rectangulo':
      return `  // Rectángulo
  const ${key} = (
    <div key="${s.id}" style={${styStr}} />
  );`;

    case 'text':
    case 'textarea':
    case 'date':
    case 'time':
      const inpProps = {
        text: `type="text" placeholder="${escape(s.placeholder || '')}"`,
        textarea: `placeholder="${escape(s.placeholder || '')}" rows="${s.rows || 3}"`,
        date: 'type="date"',
        time: 'type="time"',
      }[s.tipo];
      const isTextarea = s.tipo === 'textarea';
      const Tag = isTextarea ? 'textarea' : 'input';
      const labelHtml = (s.label && s.tipo !== 'label') ? `<div style={{ fontSize:'10px', fontWeight:600, color:'#374151', marginBottom:'4px' }}>${escape(s.label)}</div>` : '';
      return `  // ${s.label || s.tipo}
  const ${key} = (
    <div key="${s.id}" style={${styStr}}>
      ${labelHtml}
      <${Tag} ${inpProps} value={valores['${s.id}'] || ''} onChange={e => act('${s.id}', e.target.value)}
        style={{ width:'100%', padding:'6px 8px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'${s.fontSize || '12px'}', fontFamily:'inherit'${isTextarea ? ', resize:\'vertical\', minHeight:\'60px\'' : ''} }} />
    </div>
  );`;

    case 'search':
      return `  // Buscador
  const ${key} = (
    <div key="${s.id}" style={${styStr}}>
      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
        <input type="text" placeholder="${escape(s.placeholder || 'Buscar...')}" value={valores['${s.id}'] || ''} onChange={e => act('${s.id}', e.target.value)}
          style={{ width:'100%', padding:'8px 36px 8px 10px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'${s.fontSize || '12px'}' }} />
        <span style={{ position:'absolute', right:'10px', fontSize:'14px', color:'#9CA3AF', pointerEvents:'none' }}>🔍</span>
      </div>
    </div>
  );`;

    default:
      return `  // ${s.tipo}
  const ${key} = (
    <div key="${s.id}" style={${styStr}} />
  );`;
  }
}

// ─── GENERAR COMPONENTE ────────────────────────────────────

function generarComponente(json, nombre) {
  const campos = json.campos || [];
  const secciones = json.secciones || [{ id: 's1', label: 'Sección 1' }];

  // Asignar campos a secciones
  const camposPorSec = {};
  secciones.forEach(s => { camposPorSec[s.id] = []; });
  campos.forEach(c => {
    const secId = c.seccion || 's1';
    if (!camposPorSec[secId]) camposPorSec[secId] = [];
    camposPorSec[secId].push(c);
  });

  // Generar render de cada sección
  const seccionesRender = secciones.map((s, i) => {
    const sc = camposPorSec[s.id] || [];
    const body = sc.length === 0
      ? `        <div style={{ textAlign:'center', padding:'40px', color:'#9CA3AF', fontSize:'12px' }}>(sección sin campos)</div>`
      : sc.map((c, ci) => `        {renderCampo(campos[${campos.indexOf(c)}], ${ci}, valores, act)}`).join('\n');

    const nav = secciones.length >= 2 ? `
        <div style={{ display:'flex', justifyContent:'space-between', padding:'12px', borderTop:'1px solid #E5E7EB' }}>
          {pasoActual > ${i + 1} ? <button onClick={() => setPasoActual(${i + 1})} style={{ padding:'8px 20px', border:'1px solid #D1D5DB', borderRadius:'6px', background:'#FFF', color:'#374151', fontSize:'12px', cursor:'pointer' }}>← Anterior</button> : <div></div>}
          {pasoActual < ${i + 1} ? <div></div> : pasoActual === ${i + 1} && pasoActual === ${secciones.length} ? <button style={{ padding:'8px 20px', border:'1px solid #10B981', borderRadius:'6px', background:'#10B981', color:'#FFF', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>✓ Finalizar</button> : pasoActual === ${i + 1} ? <button onClick={() => setPasoActual(${i + 2})} style={{ padding:'8px 20px', border:'1px solid #1A3C6B', borderRadius:'6px', background:'#1A3C6B', color:'#FFF', fontSize:'12px', cursor:'pointer', fontWeight:600 }}>Siguiente →</button> : <div></div>}
        </div>` : '';

    return `      {/* Sección ${i + 1}: ${s.label || ''} */}
      <div style={{ marginBottom:'32px', background:'#fff', borderRadius:'8px', boxShadow:'0 2px 16px rgba(0,0,0,0.08)', overflow:'hidden', display:${secciones.length > 1 ? `pasoActual === ${i + 1} ? 'block' : 'none'` : "'block'"}}}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 16px', background:'#F3F4F6', borderBottom:'1px solid #E5E7EB' }}>
          <span style={{ padding:'2px 10px', background:'#1A3C6B', color:'#fff', fontSize:'10px', fontWeight:600, borderRadius:'3px 3px 0 0' }}>${s.label || `Sección ${i + 1}`} de ${secciones.length}</span>
          <span style={{ fontSize:'10px', color:'#6B7280', background:'#E5E7EB', padding:'1px 6px', borderRadius:'3px' }}>${secciones.length > 1 ? 'Wizard' : 'Simple'}</span>
          <span style={{ flex:1, height:'1px', background:'#E5E7EB' }}></span>
          <span style={{ fontSize:'11px', color:'#6B7280' }}>${sc.length} campos</span>
        </div>
        <div style={{ position:'relative', minHeight:'${s.minHeight || 500}px', padding:'12px', maxWidth:'${s.width || '820px'}', margin:'0 auto', background:'${s.bgColor && s.bgColor !== '#ffffff' ? s.bgColor : 'transparent'}' }}>
          ${body}
        </div>
        ${nav}
      </div>`;
  }).join('\n');

  // Nombre del componente
  const compName = toPascalCase(nombre) || 'FormularioGenerado';

  const tsx = `// ${compName}.tsx — Generado automáticamente desde el editor de formularios
// Fuente: ${json.titulo || nombre || 'formulario'}
// Fecha: ${new Date().toISOString().split('T')[0]}

import { useState } from 'react';

interface Campo {
  id: string;
  tipo: string;
  label?: string;
  x?: number;
  y?: number;
  width?: string;
  height?: string;
  [key: string]: any;
}

interface Seccion {
  id: string;
  label: string;
  num?: number;
  width?: string;
  minHeight?: number;
  bgColor?: string;
}

interface Props {
  onGuardar?: (valores: Record<string, any>) => void;
  valoresIniciales?: Record<string, any>;
  readonly?: boolean;
}

const ${compName} = ({ onGuardar, valoresIniciales = {}, readonly = false }: Props) => {
  const [valores, setValores] = useState<Record<string, any>>(valoresIniciales);
  const [pasoActual, setPasoActual] = useState(1);

  const act = (id: string, val: any) => {
    if (readonly) return;
    setValores(prev => ({ ...prev, [id]: val }));
  };

  // ─── DATOS DEL FORMULARIO ──────────────────────────────────
  const secciones: Seccion[] = ${JSON.stringify(secciones, null, 2)};

  const campos: Campo[] = ${JSON.stringify(campos, null, 2)};

  // ─── RENDER DE CAMPOS ─────────────────────────────────────
  const renderCampo = (c: Campo, idx: number, vals: Record<string, any>, actualizar: (id: string, val: any) => void) => {
    // Estilo base de posicionamiento
    const s: Record<string, any> = {
      position: 'absolute',
      left: (c.x || 0) + 'px',
      top: (c.y || 0) + 'px',
      zIndex: c.zIndex || 1,
      background: c.bgColor && c.bgColor !== '#ffffff' ? c.bgColor : '#fff',
    };
    if (c.width) s.width = c.width;
    if (c.height) s.height = c.height;
    if (c.borderGeneral) s.border = c.borderGeneral;
    else if (c.tipo !== 'linea' && c.tipo !== 'rectangulo') s.border = '1px solid #e5e7eb';
    if (c.borderRadius) s.borderRadius = c.borderRadius;
    else if (c.tipo !== 'linea') s.borderRadius = '4px';
    if (c.boxShadow) s.boxShadow = c.boxShadow;
    if (c.campoOpacity !== undefined && c.campoOpacity < 1) s.opacity = c.campoOpacity;
    if (c.borderTop) s.borderTop = c.borderTop;
    if (c.borderBottom) s.borderBottom = c.borderBottom;
    if (c.borderLeft) s.borderLeft = c.borderLeft;
    if (c.borderRight) s.borderRight = c.borderRight;
    if (c.fontSize) s.fontSize = c.fontSize;
    if (c.fontWeight) s.fontWeight = c.fontWeight;
    if (c.fontColor) s.color = c.fontColor;
    if (c.textAlign) s.textAlign = c.textAlign;
    if (c.tipo === 'linea') { delete s.background; delete s.border; delete s.borderRadius; }
    if (c.tipo === 'firma') { s.display = 'flex'; s.alignItems = 'flex-end'; s.padding = '6px 8px'; }

    switch (c.tipo) {
      case 'label':
        return <div key={c.id} style={s}>{c.label || ''}</div>;

      case 'firma':
        return <div key={c.id} style={s}>
          <input type="text" value={vals[c.id] || ''} onChange={e => actualizar(c.id, e.target.value)}
            style={{ width:'100%', border:'none', borderBottom:'1px solid #999', borderRadius:0, outline:'none', background:'transparent', fontSize: c.fontSize || '12px', padding:0, fontFamily:'inherit', lineHeight:'1.2' }} />
          {c.firmaLabel && <div style={{ fontSize:'9px', fontWeight:600, color:'#666', textAlign:'center', width:'100%' }}>{c.firmaLabel}</div>}
        </div>;

      case 'checkbox':
        return <div key={c.id} style={{ ...s, display:'flex', alignItems:'center', gap:'6px', cursor:'default' }}>
          <input type="checkbox" checked={!!vals[c.id]} onChange={e => actualizar(c.id, e.target.checked)} style={{ width:'16px', height:'16px', cursor:'pointer' }} />
          <span>{c.labelCheckbox || c.label || 'Opción'}</span>
        </div>;

      case 'linea':
        return <div key={c.id} style={s}>
          <hr style={{ border:'none', borderTop: c.borderGeneral || '2px solid #ccc', width: c.width || '100%', margin:'4px 0' + (c.rotacion ? ', transform: rotate(' + c.rotacion + 'deg)' : '') + (c.difuminado ? ', WebkitMaskImage: linear-gradient(to right,transparent,#000 15%,#000 85%,transparent), maskImage: linear-gradient(to right,transparent,#000 15%,#000 85%,transparent)' : '') }} />
        </div>;

      case 'rectangulo':
        return <div key={c.id} style={s} />;

      case 'textarea':
        return <div key={c.id} style={s}>
          {c.label && <div style={{ fontSize:'10px', fontWeight:600, color:'#374151', marginBottom:'4px' }}>{c.label}</div>}
          <textarea placeholder={c.placeholder || ''} rows={c.rows || 3} value={vals[c.id] || ''} onChange={e => actualizar(c.id, e.target.value)}
            style={{ width:'100%', padding:'6px 8px', border:'1px solid #ddd', borderRadius:'4px', fontSize: c.fontSize || '12px', fontFamily:'inherit', resize:'vertical', minHeight:'60px', boxSizing:'border-box' }} />
        </div>;

      case 'search':
        return <div key={c.id} style={s}>
          <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
            <input type="text" placeholder={c.placeholder || 'Buscar...'} value={vals[c.id] || ''} onChange={e => actualizar(c.id, e.target.value)}
              style={{ width:'100%', padding:'8px 36px 8px 10px', border:'1px solid #ddd', borderRadius:'4px', fontSize: c.fontSize || '12px', fontFamily:'inherit', boxSizing:'border-box' }} />
            <span style={{ position:'absolute', right:'10px', fontSize:'14px', color:'#9CA3AF', pointerEvents:'none' }}>🔍</span>
          </div>
        </div>;

      case 'text':
      case 'date':
      case 'time':
        return <div key={c.id} style={s}>
          {c.label && <div style={{ fontSize:'10px', fontWeight:600, color:'#374151', marginBottom:'4px' }}>{c.label}</div>}
          <input type={c.tipo === 'text' ? 'text' : c.tipo} placeholder={c.placeholder || ''} value={vals[c.id] || ''} onChange={e => actualizar(c.id, e.target.value)}
            style={{ width:'100%', padding:'6px 8px', border:'1px solid #ddd', borderRadius:'4px', fontSize: c.fontSize || '12px', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>;

      default:
        return <div key={c.id} style={s} />;
    }
  };

  // ─── RENDER PRINCIPAL ─────────────────────────────────────
  return (
    <div style={{ padding:'16px', maxWidth:'860px', margin:'0 auto' }}>
      {secciones.map((sec, i) => {
        const sc = campos.filter(c => c.seccion === sec.id);
        const visible = secciones.length <= 1 || pasoActual === i + 1;
        if (!visible) return null;

        return (
          <div key={sec.id} style={{ marginBottom:'32px', background:'#fff', borderRadius:'10px', boxShadow:'0 2px 16px rgba(0,0,0,0.08)', overflow:'hidden' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 16px', background:'#F3F4F6', borderBottom:'1px solid #E5E7EB' }}>
              <span style={{ padding:'2px 10px', background:'#1A3C6B', color:'#fff', fontSize:'10px', fontWeight:600, borderRadius:'3px 3px 0 0' }}>
                {sec.label || 'Sección ' + (i + 1)} de {secciones.length}
              </span>
              <span style={{ fontSize:'10px', color:'#6B7280', background:'#E5E7EB', padding:'1px 6px', borderRadius:'3px' }}>
                {secciones.length > 1 ? 'Wizard' : 'Simple'}
              </span>
              <span style={{ flex:1, height:'1px', background:'#E5E7EB' }}></span>
              <span style={{ fontSize:'11px', color:'#6B7280' }}>{sc.length} campos</span>
            </div>

            {/* Cuerpo con posiciones absolutas */}
            <div style={{ position:'relative', minHeight: (sec.minHeight || 500) + 'px', padding:'12px', maxWidth: sec.width || '820px', margin:'0 auto', boxSizing:'border-box', background: sec.bgColor && sec.bgColor !== '#ffffff' ? sec.bgColor : 'transparent' }}>
              {sc.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px', color:'#9CA3AF', fontSize:'12px' }}>(sección sin campos)</div>
              ) : (
                sc.map((c, ci) => renderCampo(c, ci, valores, act))
              )}
            </div>

            {/* Navegación */}
            {secciones.length >= 2 && (
              <div style={{ display:'flex', justifyContent:'space-between', padding:'12px', borderTop:'1px solid #E5E7EB' }}>
                {i > 0 ? (
                  <button onClick={() => setPasoActual(i)} style={{ padding:'8px 20px', border:'1px solid #D1D5DB', borderRadius:'6px', background:'#FFF', color:'#374151', fontSize:'12px', cursor:'pointer' }}>
                    ← Anterior
                  </button>
                ) : <div></div>}
                {i === secciones.length - 1 ? (
                  <button style={{ padding:'8px 20px', border:'1px solid #10B981', borderRadius:'6px', background:'#10B981', color:'#FFF', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                    ✓ Finalizar
                  </button>
                ) : (
                  <button onClick={() => setPasoActual(i + 2)} style={{ padding:'8px 20px', border:'1px solid #1A3C6B', borderRadius:'6px', background:'#1A3C6B', color:'#FFF', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                    Siguiente →
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ${compName};
`;

  return tsx;
}

// ─── MAIN ──────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Uso: node scripts/convertir-formulario.js <input.json> [output.tsx]');
    console.log('');
    console.log('Si no se especifica output, imprime en consola.');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputPath = args[1] ? path.resolve(args[1]) : null;

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: No se encuentra el archivo "${inputPath}"`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, 'utf-8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error('Error: El archivo no es un JSON válido');
    process.exit(1);
  }

  // El JSON del editor tiene { version, campos, secciones, seccionActiva }
  // También acepta { campos, secciones } directo
  const datos = json.campos ? json : { campos: json.campos || json, secciones: json.secciones || [{ id: 's1', label: 'Sección 1' }] };

  const nombre = path.basename(inputPath, '.json');
  const tsx = generarComponente(datos, nombre);

  if (outputPath) {
    fs.writeFileSync(outputPath, tsx, 'utf-8');
    console.log(`✅ Componente generado: ${outputPath}`);
    console.log(`   Líneas: ${tsx.split('\n').length}`);
  } else {
    console.log(tsx);
  }
}

main();
