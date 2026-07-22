    if (!camposSec.length && esActiva) {
      html += '<div style="text-align:center;padding:40px;color:#ccc;font-size:11px;">Arrastra campos aqu&iacute; o agrega desde el panel izquierdo</div>';
    }
    html += '</div>';
    // Navegaci&oacute;n dentro de la secci&oacute;n activa
    if (esActiva && secciones.length >= 2) {
      const idxActual = i;
      const total = secciones.length;
      const esUltimo = idxActual === total - 1;
      html += '<div style="display:flex;justify-content:space-between;padding:12px;border-top:1px solid #E5E7EB;">';
      if (idxActual > 0) {
        html += '<button onclick="seccionActiva=\''+secciones[idxActual-1].id+'\';render();mostrarPropiedadesSeccion(seccionActiva);" style="padding:8px 20px;border:1px solid #D1D5DB;border-radius:6px;background:#FFF;color:#374151;font-size:12px;cursor:pointer;">&larr; Anterior</button>';
      } else {
        html += '<div></div>';
      }
      if (esUltimo) {
        html += '<button onclick="" style="padding:8px 20px;border:1px solid #D1D5DB;border-radius:6px;background:#10B981;color:#FFF;font-size:12px;font-weight:600;cursor:pointer;">&check; Finalizar</button>';
      } else {
        html += '<button onclick="seccionActiva=\''+secciones[idxActual+1].id+'\';render();mostrarPropiedadesSeccion(seccionActiva);" style="padding:8px 20px;border:1px solid #D1D5DB;border-radius:6px;background:#1A3C6B;color:#FFF;font-size:12px;cursor:pointer;">Siguiente &rarr;</button>';
      }
      html += '</div>';
    }
    html += '</div>';
  });
  l.innerHTML = html;