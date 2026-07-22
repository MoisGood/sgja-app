/**
 * FormularioAccidenteGenerado.tsx
 * Renderiza el formulario HTML exportado del editor con estado React.
 * El HTML se usa como plantilla visual; la navegación e inputs son React.
 */

import { useEffect, useRef, useState } from 'react';

interface Props {
  valoresIniciales?: Record<string, string>;
}

const FormularioAccidenteGenerado = ({ valoresIniciales = {} }: Props) => {
  const [paso, setPaso] = useState(1);
  const [valores, setValores] = useState<Record<string, string>>(valoresIniciales);
  const [htmlCargado, setHtmlCargado] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Cargar HTML
  useEffect(() => {
    fetch('/formulario.html')
      .then(r => r.text())
      .then(data => {
        // Extraer solo el contenido dentro de .wrap
        const wrapMatch = data.match(/<div class="wrap">([\s\S]*?)<\/div>\s*<\/body>/);
        if (wrapMatch) {
          // Remover script del HTML para evitar conflictos
          const sinScript = wrapMatch[1].replace(/<script>[\s\S]*?<\/script>/g, '');
          setHtmlCargado(sinScript);
        }
      })
      .catch(() => setHtmlCargado('<p style="padding:40px;color:#DC2626;">Error al cargar el formulario</p>'));
  }, []);

  // Inyectar valores en los inputs después de cada render del HTML
  useEffect(() => {
    if (!ref.current) return;
    const inputs = ref.current.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
    inputs.forEach(el => {
      const name = el.name || el.placeholder || el.type || 'campo_' + Math.random().toString(36).slice(2, 6);
      if (!el.name) el.name = name;
      // Sincronizar valor
      el.value = valores[name] || '';
      // Manejar cambios
      el.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        setValores(prev => ({ ...prev, [target.name]: target.value }));
      };
      // Checkbox
      if (el.type === 'checkbox') {
        const cb = el as HTMLInputElement;
        cb.checked = !!valores[name];
        cb.onchange = (e: Event) => {
          const target = e.target as HTMLInputElement;
          setValores(prev => ({ ...prev, [target.name]: target.checked ? 'true' : '' }));
        };
      }
    });
    // Reemplazar onclick de navegación del HTML con React
    const btns = ref.current.querySelectorAll<HTMLButtonElement>('button');
    btns.forEach(btn => {
      const origOnclick = btn.getAttribute('onclick');
      if (origOnclick?.includes('irA(')) {
        const n = parseInt(origOnclick.match(/\d+/)?.[0] || '1');
        btn.onclick = (e) => {
          e.preventDefault();
          setPaso(n);
        };
      }
    });
  }, [htmlCargado, valores]);

  return (
    <div style={{ padding: '16px', maxWidth: '860px', margin: '0 auto' }}>
      <style>{`
        .sec { display: none !important; }
        .sec[data-paso="${paso}"] { display: block !important; }
        [onclick*="irA"] { cursor: pointer; }
      `}</style>
      {htmlCargado ? (
        <div ref={ref} dangerouslySetInnerHTML={{ __html: htmlCargado }} />
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: '14px' }}>
          Cargando formulario...
        </div>
      )}
    </div>
  );
};

export default FormularioAccidenteGenerado;
