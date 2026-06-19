import { readBarcodes } from 'zxing-wasm/reader';

export interface DecodeResult {
  text: string;
  format: string;
}

export async function decodificarBarcode(source: Blob | File | HTMLCanvasElement | HTMLImageElement): Promise<DecodeResult | null> {
  const result = await tryBarcodeDetector(source);
  if (result) return result;
  return tryZXing(source);
}

async function tryBarcodeDetector(source: Blob | File | HTMLCanvasElement | HTMLImageElement): Promise<DecodeResult | null> {
  if (!('BarcodeDetector' in window)) return null;
  try {
    const detector = new BarcodeDetector({
      formats: ['qr_code', 'data_matrix', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e'],
    });
    const barcodes = await detector.detect(source as any);
    if (barcodes.length > 0) {
      return { text: barcodes[0].rawValue, format: barcodes[0].format };
    }
  } catch { /* fallback */ }
  return null;
}

async function tryZXing(source: Blob | File | HTMLCanvasElement | HTMLImageElement): Promise<DecodeResult | null> {
  try {
    let blob: Blob;
    if (source instanceof HTMLCanvasElement) {
      blob = await new Promise<Blob>(resolve => source.toBlob(resolve as BlobCallback, 'image/png'));
    } else if (source instanceof HTMLImageElement) {
      const c = document.createElement('canvas');
      c.width = source.naturalWidth;
      c.height = source.naturalHeight;
      c.getContext('2d')!.drawImage(source, 0, 0);
      blob = await new Promise<Blob>(resolve => c.toBlob(resolve as BlobCallback, 'image/png'));
    } else {
      blob = source;
    }
    if (!blob) return null;
    const barcodes = await readBarcodes(blob, {
      tryHarder: true,
      formats: ['DataMatrix', 'QRCode', 'Code128', 'Code39', 'EAN13', 'EAN8', 'UPCA', 'UPCE'],
      maxNumberOfSymbols: 1,
    });
    if (barcodes.length > 0) {
      return { text: barcodes[0].text, format: barcodes[0].format };
    }
  } catch { /* no se pudo decodificar */ }
  return null;
}
