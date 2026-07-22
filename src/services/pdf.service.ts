// src/services/pdf.service.ts
// CFB — Servicio para rellenar el PDF "Declaración Individual de Accidente Escolar"
// M-CFB #8: Dibuja texto en las secciones A, B, C del PDF oficial

import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';

export interface DatosPDF {
  // Sección A — Individualización del Establecimiento
  nombreEstablecimiento: string;
  ciudad: string;
  comuna: string;
  tipoEstablecimiento: string; // "1" = fiscal/municipal, "2" = particular
  curso: string;
  horario: string;
  fechaRegistroDia: string;
  fechaRegistroMes: string;
  fechaRegistroAno: string;

  // Sección B — Individualización del Accidentado
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  sexo: string; // "1" = M, "2" = F
  anoNacimiento: string;
  edad: string;
  calle: string;
  numero: string;
  poblacion: string;
  comunaResidencia: string;
  ciudadResidencia: string;
  codifCom: string;

  // Sección C — Informe del Accidente
  hora: string;
  minutos: string;
  fechaAccidenteAno: string;
  fechaAccidenteMes: string;
  fechaAccidenteDia: string;
  diaSemana: string; // 1=Lunes … 7=Domingo
  accidenteTipo: string; // "1" = trayecto, "2" = escuela
  testigo1Nombre: string;
  testigo1Cedula: string;
  testigo2Nombre: string;
  testigo2Cedula: string;
  circunstancia: string;
}

// ═══════════════════════════════════════════════
// Coordenadas estimadas sobre A4 (595 × 842 pt)
// Origen (0,0) = esquina inferior-izquierda
// ═══════════════════════════════════════════════

interface Campo {
  key: keyof DatosPDF;
  x: number;
  y: number;
  size?: number;
  maxWidth?: number;
  multiline?: boolean;
  separarDigitos?: boolean; // si true, separa digitos con espacios (mes 07 → "0 7")
}

const CAMPOS: Campo[] = [
  // ── Sección A ──
  { key: 'tipoEstablecimiento', x: 519, y: 720, size: 10 },
  { key: 'nombreEstablecimiento', x: 70, y: 702, maxWidth: 230 },
  { key: 'ciudad', x: 252, y: 703, maxWidth: 120 },
  { key: 'comuna', x: 346, y: 705, maxWidth: 100 },
  { key: 'curso', x: 88, y: 671, maxWidth: 100 },
  { key: 'horario', x: 202, y: 672, maxWidth: 100 },
  { key: 'fechaRegistroDia', x: 333, y: 656, size: 10, maxWidth: 25, separarDigitos: true },
  { key: 'fechaRegistroMes', x: 367, y: 656, size: 10, maxWidth: 25, separarDigitos: true },
  { key: 'fechaRegistroAno', x: 399, y: 656, size: 10, maxWidth: 35 },

  // ── Sección B ──
  { key: 'apellidoPaterno', x: 82, y: 617, maxWidth: 120 },
  { key: 'apellidoMaterno', x: 186, y: 617, maxWidth: 120 },
  { key: 'nombres', x: 308, y: 619, maxWidth: 130 },
  { key: 'sexo', x: 422, y: 600, size: 10 },
  { key: 'anoNacimiento', x: 453, y: 605, maxWidth: 45 },
  { key: 'edad', x: 514, y: 604, maxWidth: 25 },

  // Residencia habitual
  { key: 'calle', x: 114, y: 563, maxWidth: 120 },
  { key: 'numero', x: 221, y: 563, maxWidth: 60 },
  { key: 'poblacion', x: 288, y: 561, maxWidth: 110 },
  { key: 'comunaResidencia', x: 370, y: 563, maxWidth: 60 },
  { key: 'ciudadResidencia', x: 435, y: 565, maxWidth: 50 },
  { key: 'codifCom', x: 504, y: 565, maxWidth: 40 },

  // ── Sección C ──
  { key: 'hora', x: 73, y: 487, size: 8, maxWidth: 25 },
  { key: 'minutos', x: 101, y: 487, size: 8, maxWidth: 25 },
  { key: 'fechaAccidenteAno', x: 138, y: 483, size: 10, maxWidth: 30 },
  { key: 'fechaAccidenteMes', x: 208, y: 483, size: 10, maxWidth: 25, separarDigitos: true },
  { key: 'fechaAccidenteDia', x: 271, y: 483, size: 10, maxWidth: 25, separarDigitos: true },
  { key: 'diaSemana', x: 136, y: 429, size: 9 },
  { key: 'accidenteTipo', x: 247, y: 431, size: 10 },
  { key: 'testigo1Nombre', x: 293, y: 444, maxWidth: 180 },
  { key: 'testigo1Cedula', x: 466, y: 444, maxWidth: 120 },
  { key: 'testigo2Nombre', x: 292, y: 411, maxWidth: 180 },
  { key: 'testigo2Cedula', x: 468, y: 412, maxWidth: 120 },
  { key: 'circunstancia', x: 60, y: 357, size: 8, maxWidth: 345, multiline: true },
];

/**
 * Rellena el PDF oficial con los datos del formulario digital.
 * @param pdfBytes ArrayBuffer del PDF original
 * @param datos Datos a dibujar en las secciones A, B, C
 * @returns PDF modificado como Uint8Array (solo página 1)
 */
export async function rellenarPDF(
  pdfBytes: ArrayBuffer,
  datos: DatosPDF
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Eliminar páginas después de la primera (instrucciones)
  while (pdfDoc.getPageCount() > 1) {
    pdfDoc.removePage(pdfDoc.getPageCount() - 1);
  }

  const page = pdfDoc.getPage(0);

  for (const campo of CAMPOS) {
    const valor = (datos[campo.key] ?? '').toString().trim();
    if (!valor) continue;

    const size = campo.size ?? 9;
    let texto = valor;

    // Separar dígitos con espacios para casillas individuales (mes 07 → "0 7")
    if (campo.separarDigitos && texto.length >= 2) {
      texto = texto.split('').join('  ');
    }

    // Truncar si excede el ancho máximo
    if (campo.maxWidth) {
      const ancho = font.widthOfTextAtSize(texto, size);
      if (ancho > campo.maxWidth) {
        if (campo.multiline) {
          // ── Envolver texto en múltiples líneas ──
          const words = texto.split(/\s+/);
          const lines: string[] = [];
          let line = '';
          for (const w of words) {
            const test = line ? line + ' ' + w : w;
            if (font.widthOfTextAtSize(test, size) > campo.maxWidth && line) {
              lines.push(line);
              line = w;
            } else {
              line = test;
            }
          }
          if (line) lines.push(line);

          const lineHeight = size * 2.25;
          const maxLines = 5;
          for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
            page.drawText(lines[i], {
              x: campo.x,
              y: campo.y - i * lineHeight,
              size,
              font,
            });
          }
          continue;
        } else {
          // Reducir tamaño o truncar
          const sizeAjustado = Math.min(size, (size * campo.maxWidth) / ancho);
          if (sizeAjustado >= 6) {
            page.drawText(texto, {
              x: campo.x,
              y: campo.y,
              size: sizeAjustado,
              font,
            });
            continue;
          }
          // Si es muy pequeño, truncar
          while (texto.length > 0 && font.widthOfTextAtSize(texto + '…', size) > campo.maxWidth) {
            texto = texto.slice(0, -1);
          }
          texto += '…';
        }
      }
    }

    page.drawText(texto, { x: campo.x, y: campo.y, size, font });
  }

  return await pdfDoc.save();
}

/**
 * Carga el PDF desde el servidor y lo rellena.
 */
export async function generarPDF(
  datos: DatosPDF
): Promise<Uint8Array> {
  const resp = await fetch('/DECLARACION INDIVIDUAL DE ACCIDENTE ESCOLAR.pdf');
  const pdfBytes = await resp.arrayBuffer();
  return rellenarPDF(pdfBytes, datos);
}

/**
  * Convierte un Uint8Array de PDF a una URL de objeto (Blob) para
  * abrir en el navegador.
  */
export function pdfToBlobUrl(pdf: Uint8Array): string {
  const blob = new Blob([pdf], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

// ═══════════════════════════════════════════════
// DEBUG — Genera PDF con marcadores visibles
// para ajustar coordenadas
// ═══════════════════════════════════════════════

/**
 * Genera un PDF con marcadores rojos en cada coordenada de campo.
 */
export async function generarPDFDebug(): Promise<Uint8Array> {
  const resp = await fetch('/DECLARACION INDIVIDUAL DE ACCIDENTE ESCOLAR.pdf');
  const pdfBytes = await resp.arrayBuffer();

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  while (pdfDoc.getPageCount() > 1) {
    pdfDoc.removePage(pdfDoc.getPageCount() - 1);
  }

  const page = pdfDoc.getPage(0);

  for (const campo of CAMPOS) {
    const px = campo.x;
    const py = campo.y;

    page.drawRectangle({
      x: px - 3, y: py - 3, width: 6, height: 6,
      color: rgb(0.9, 0.1, 0.1),
    });

    page.drawText(campo.key, {
      x: px + 6, y: py - 2, size: 6, font,
      color: rgb(0.9, 0.1, 0.1),
    });
  }

  return await pdfDoc.save();
}
