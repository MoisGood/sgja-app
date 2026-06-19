interface BarcodeDetectorOptions {
  formats: string[];
}

interface BarcodeValue {
  rawValue: string;
  format: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: readonly { x: number; y: number }[];
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  static getSupportedFormats(): Promise<string[]>;
  detect(image: Blob | HTMLCanvasElement | HTMLImageElement | ImageData): Promise<BarcodeValue[]>;
}
