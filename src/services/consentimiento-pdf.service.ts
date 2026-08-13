// src/services/consentimiento-pdf.service.ts
// Rellena los PDF oficiales de consentimiento Ley 21.719:
//  - "AUTORIZACIÓN PARA USO DE IMAGEN Y DIFUSIÓN INSTITUCIONAL.pdf" (plantilla 'imagen')
//  - "CONSENTIMIENTO PARA EL TRATAMIENTO DE DATOS PERSONALES.pdf" (plantilla 'datos')
// Coordenadas calibradas con public/coordinador_autorizacion.html y
// public/coordinador_consentimiento.html (origen esquina inferior-izquierda, 612 × 1008 pt).

import { PDFDocument, StandardFonts } from 'pdf-lib';
import { pdfToBlobUrl } from './pdf.service';

export interface DatosPDFConsentimiento {
  plantilla: 'imagen' | 'datos';
  nombreApoderado: string;
  rutApoderado: string;
  fecha: string; // formato dd/mm/aaaa
}

interface CampoPlantilla {
  key: keyof DatosPDFConsentimiento;
  x: number;
  y: number;
  size: number;
  maxWidth: number;
}

const PLANTILLAS: Record<
  DatosPDFConsentimiento['plantilla'],
  { archivo: string; campos: CampoPlantilla[] }
> = {
  imagen: {
    archivo: '/AUTORIZACIÓN PARA USO DE IMAGEN Y DIFUSIÓN INSTITUCIONAL.pdf',
    campos: [
      { key: 'nombreApoderado', x: 133, y: 463, size: 11, maxWidth: 230 },
      { key: 'rutApoderado', x: 405, y: 463, size: 11, maxWidth: 95 },
      { key: 'fecha', x: 123, y: 437, size: 11, maxWidth: 75 },
    ],
  },
  datos: {
    archivo: '/CONSENTIMIENTO PARA EL TRATAMIENTO DE DATOS PERSONALES.pdf',
    campos: [
      { key: 'nombreApoderado', x: 132, y: 225, size: 11, maxWidth: 200 },
      { key: 'rutApoderado', x: 378, y: 225, size: 11, maxWidth: 95 },
      { key: 'fecha', x: 126, y: 199, size: 11, maxWidth: 75 },
    ],
  },
};

/**
 * Rellena el PDF oficial de consentimiento con los datos del apoderado/a.
 * @param datos Plantilla a usar + datos a dibujar (nombre, RUT, fecha)
 * @returns PDF modificado como Uint8Array (solo página 1)
 */
export async function generarPDFConsentimiento(
  datos: DatosPDFConsentimiento
): Promise<Uint8Array> {
  const plantilla = PLANTILLAS[datos.plantilla];

  const resp = await fetch(plantilla.archivo);
  const pdfBytes = await resp.arrayBuffer();

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  while (pdfDoc.getPageCount() > 1) {
    pdfDoc.removePage(pdfDoc.getPageCount() - 1);
  }

  const page = pdfDoc.getPage(0);

  for (const campo of plantilla.campos) {
    const valor = (datos[campo.key] ?? '').toString().trim();
    if (!valor) continue;

    let size = campo.size;
    let texto = valor;
    const ancho = font.widthOfTextAtSize(texto, size);

    // Ajustar el texto al ancho máximo del campo
    if (ancho > campo.maxWidth) {
      const sizeAjustado = Math.min(size, (size * campo.maxWidth) / ancho);
      if (sizeAjustado >= 6) {
        size = sizeAjustado;
      } else {
        while (texto.length > 0 && font.widthOfTextAtSize(texto + '…', size) > campo.maxWidth) {
          texto = texto.slice(0, -1);
        }
        texto += '…';
      }
    }

    page.drawText(texto, { x: campo.x, y: campo.y, size, font });
  }

  return await pdfDoc.save();
}

/**
 * Genera el PDF y lo abre en una pestaña nueva para imprimir.
 */
export async function abrirPDFConsentimiento(datos: DatosPDFConsentimiento): Promise<void> {
  const pdf = await generarPDFConsentimiento(datos);
  const url = pdfToBlobUrl(pdf);
  window.open(url, '_blank');
}
