/**
 * html-to-tsx.cjs
 * Convierte formulario.html a componente React (.tsx)
 *
 * Uso: node scripts/html-to-tsx.cjs <input.html> <output.tsx>
 */

const fs = require('fs');
const path = require('path');

function escapeAttr(val) {
  return val.replace(/['\\]/g, '\\$&').replace(/\n/g, '\\n');
}

function htmlToJSX(html) {
  // Extraer secciones completas con su contenido
  const secs = [];
  const secRegex = /<div class="sec"[^>]*id="([^"]+)"[^>]*data-paso="([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let match;

  while ((match = secRegex.exec(html)) !== null) {
    const id = match[1];
    const paso = match[2];
    const content = match[3];

    // Extraer header
    const hdrMatch = content.match(/<div class="sec-hdr">([\s\S]*?)<\/div>/);
    const header = hdrMatch ? hdrMatch[1] : '';

    // Extraer badge y tipo
    const badgeMatch = header.match(/<span class="badge">([^<]+)<\/span>/);
    const tipoMatch = header.match(/<span class="tipo">([^<]+)<\/span>/);
    const cntMatch = header.match(/<span class="cnt">([^<]+)<\/span>/);

    // Extraer body
    const bodyMatch = content.match(/<div class="sec-body"([^>]*)>([\s\S]*?)<\/div>/);
    const bodyAttrs = bodyMatch ? bodyMatch[1] : '';
    const bodyContent = bodyMatch ? bodyMatch[2] : '';

    // Extraer estilo del body
    const maxW = bodyAttrs.match(/max-width:([^;]+)/);
    const minH = bodyAttrs.match(/min-height:([^;]+)/);
    const bgC = bodyAttrs.match(/background:([^;]+)/);

    // Extraer navegación
    const navMatch = content.match(/<div class="nav">([\s\S]*?)<\/div><\/div>$/);
    const navContent = navMatch ? navMatch[1] : '';

    // Extraer botones de navegación
    const leftBtn = navContent.includes('← Anterior') ? 'anterior' : 'vacio';
    const rightBtn = navContent.includes('✓ Finalizar') ? 'finalizar' : navContent.includes('Siguiente') ? 'siguiente' : 'vacio';

    // Extraer campos individuales del body
    const fields = [];
    const fieldRegex = /<div style="([^"]*)"(?:[^>]*)>([\s\S]*?)<\/div>/g;
    let fMatch;
    while ((fMatch = fieldRegex.exec(bodyContent)) !== null) {
      const style = fMatch[1];
      const inner = fMatch[2].trim();
      if (inner && !inner.includes('(sección sin campos)') && inner.length > 5) {
        fields.push({ style, inner });
      }
    }

    secs.push({
      id, paso, header, badge: badgeMatch?.[1] || '',
      tipo: tipoMatch?.[1] || '',
      cnt: cntMatch?.[1] || '',
      maxWidth: maxW?.[1] || '820px',
      minHeight: minH?.[1] || '500px',
      bgColor: bgC?.[1] || '',
      leftBtn, rightBtn,
      fields
    });
  }

  return secs;
}

// ─── Generar componente ────────────────────────────────────

function generarComponente(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const secciones = htmlToJSX(html);
  const total = secciones.length;
  const nom = path.basename(htmlPath, '.html');
  const compName = nom.charAt(0).toUpperCase() + nom.slice(1).replace(/[^a-zA-Z0-9]/g, '');

  // Generar los campos JSX para cada sección
  const seccionesJSX = secciones.map((sec, i) => {
    // Generar fields JSX
    const fieldsJSX = sec.fields.map((f, fi) => {
      const styObj = f.style
        .split(';')
        .filter(s => s.trim())
        .map(s => {
          const [k, ...v] = s.split(':');
          const key = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          const val = v.join(':').trim();
          if (key === 'background' && val === '#fff') return '';
          if (key === 'boxShadow' && val === '0 1px 3px rgba(0,0,0,0.05)') return '';
          if (key === 'border' && val === '1px solid #e5e7eb') return '';
          if (key === 'borderRadius' && val === '4px') return '';
          return `${key}:'${escapeAttr(val)}'`;
        })
        .filter(Boolean)
        .join(',');

      // Determinar si es input, textarea, label o checkbox
      let innerJSX = '';
      const innerTrim = f.inner.trim();

      if (f.inner.includes('<input type="checkbox">')) {
        const spanMatch = f.inner.match(/<span>([^<]+)<\/span>/);
        innerJSX = `
              <label style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',cursor:'default'}}>
                <input type="checkbox" checked={!!valores['f-${i}-${fi}']} onChange={e => act('f-${i}-${fi}', e.target.checked)} />
                <span>${spanMatch?.[1] || ''}</span>
              </label>`;
      } else if (f.inner.includes('<input type="date"')) {
        innerJSX = `
              <div style={{fontSize:'10px',fontWeight:600,color:'#374151',marginBottom:'4px'}}>FECHA</div>
              <input type="date" value={valores['f-${i}-${fi}'] || ''} onChange={e => act('f-${i}-${fi}', e.target.value)}
                style={{width:'100%',padding:'6px 8px',border:'1px solid #ddd',borderRadius:'4px',fontSize:'12px'}} />`;
      } else if (f.inner.includes('<input type="time"')) {
        const labelMatch = f.inner.match(/<div[^>]*>([^<]+)<\/div>/);
        innerJSX = `
              ${labelMatch ? `<div style={{fontSize:'10px',fontWeight:600,color:'#374151',marginBottom:'4px'}}>${labelMatch[1]}</div>` : ''}
              <input type="time" value={valores['f-${i}-${fi}'] || ''} onChange={e => act('f-${i}-${fi}', e.target.value)}
                style={{width:'100%',padding:'6px 8px',border:'1px solid #ddd',borderRadius:'4px',fontSize:'12px'}} />`;
      } else if (f.inner.includes('<textarea')) {
        innerJSX = `
              <textarea rows="3" value={valores['f-${i}-${fi}'] || ''} onChange={e => act('f-${i}-${fi}', e.target.value)}
                style={{width:'100%',padding:'6px 8px',border:'1px solid #ddd',borderRadius:'4px',fontSize:'12px',fontFamily:'inherit'}} />`;
      } else if (f.inner.includes('<hr')) {
        innerJSX = `
              <hr style={{border:'none',borderTop:'2px solid #ccc',margin:'4px 0',width:'100px',transform:'rotate(90deg)',WebkitMaskImage:'linear-gradient(to right,transparent,#000 15%,#000 85%,transparent)',maskImage:'linear-gradient(to right,transparent,#000 15%,#000 85%,transparent)'}} />`;
      } else {
        // Texto estático o firma
        innerJSX = f.inner.replace(/style="[^"]*"/g, '').trim();
        innerJSX = innerJSX.replace(/<div([^>]*)>/g, '<div$1>');
      }

      if (!styObj) return '';
      return `
              <div style={{${styObj}}}>
                ${innerJSX.replace(/\n\s*/g, '\n                ')}
              </div>`;
    }).filter(Boolean).join('\n');

    return `
          {/* Sección ${i+1} */}
          <div style={{display:pasoActual === ${i+1} ? 'block' : 'none', marginBottom:'32px', background:'#fff', borderRadius:'10px', boxShadow:'0 2px 16px rgba(0,0,0,0.08)', overflow:'hidden'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px', padding:'10px 16px', background:'#F3F4F6', borderBottom:'1px solid #E5E7EB', fontSize:'13px', fontWeight:600}}>
              <span style={{padding:'2px 10px', background:'#1A3C6B', color:'#fff', fontSize:'10px', fontWeight:600, borderRadius:'3px 3px 0 0'}}>${sec.badge}</span>
              <span style={{fontSize:'10px', color:'#6B7280', background:'#E5E7EB', padding:'1px 6px', borderRadius:'3px'}}>${sec.tipo}</span>
              <span style={{flex:1, height:'1px', background:'#E5E7EB'}}></span>
              <span style={{fontSize:'11px', color:'#6B7280'}}>${sec.cnt}</span>
            </div>
            <div style={{position:'relative', minHeight:'${sec.minHeight}', padding:'12px', maxWidth:'${sec.maxWidth}', margin:'0 auto'${sec.bgColor ? `, background:'${sec.bgColor}'` : ''}}}>
              ${fieldsJSX || `<div style={{textAlign:'center', padding:'40px', color:'#9CA3AF', fontSize:'12px'}}>(sección sin campos)</div>`}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', padding:'12px', borderTop:'1px solid #E5E7EB'}}>
              ${sec.leftBtn === 'anterior' ? `<button onClick={() => setPasoActual(${i})} style={{padding:'8px 20px', borderRadius:'6px', fontSize:'12px', cursor:'pointer', border:'1px solid #D1D5DB', background:'#FFF', color:'#374151'}}>← Anterior</button>` : '<div></div>'}
              ${sec.rightBtn === 'finalizar' ? `<button style={{padding:'8px 20px', borderRadius:'6px', fontSize:'12px', cursor:'pointer', border:'1px solid #10B981', background:'#10B981', color:'#FFF', fontWeight:600}}>✓ Finalizar</button>`
                : sec.rightBtn === 'siguiente' ? `<button onClick={() => setPasoActual(${i+2})} style={{padding:'8px 20px', borderRadius:'6px', fontSize:'12px', cursor:'pointer', border:'1px solid #1A3C6B', background:'#1A3C6B', color:'#FFF', fontWeight:600}}>Siguiente →</button>`
                : '<div></div>'}
            </div>
          </div>`;
  }).join('\n');

  return `/**
 * ${compName}.tsx — Generado desde HTML del editor de formularios
 * Fecha: ${new Date().toISOString().split('T')[0]}
 * Fuente: ${path.basename(htmlPath)}
 */

import { useState } from 'react';

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

  return (
    <div style={{ padding:'16px', maxWidth:'860px', margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h1 style={{ fontSize:'18px', color:'#1A3C6B', fontWeight:700 }}>📋 ${compName}</h1>
        <button onClick={() => window.print()} style={{ padding:'8px 18px', border:'1px solid #D1D5DB', borderRadius:'6px', background:'#FFF', color:'#374151', fontSize:'12px', cursor:'pointer' }}>
          🖨 Imprimir
        </button>
      </div>
      ${seccionesJSX}
    </div>
  );
};

export default ${compName};
`;
}

// ─── MAIN ──────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Uso: node scripts/html-to-tsx.cjs <input.html> [output.tsx]');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputPath = args[1] ? path.resolve(args[1]) : null;

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: No se encuentra "${inputPath}"`);
    process.exit(1);
  }

  const tsx = generarComponente(inputPath);

  if (outputPath) {
    fs.writeFileSync(outputPath, tsx, 'utf-8');
    console.log(`✅ Componente generado: ${outputPath} (${tsx.split('\\n').length} líneas)`);
  } else {
    console.log(tsx);
  }
}

main();
