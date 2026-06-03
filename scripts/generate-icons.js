#!/usr/bin/env node

/**
 * Genera iconos SVG simples para PWA
 * Ejecutar: node scripts/generate-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorio public si no existe
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

/**
 * Crear SVG icon
 */
function createSVGIcon(size) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Fondo -->
  <rect width="${size}" height="${size}" fill="#1A3C6B"/>
  
  <!-- Iniciales SG -->
  <text x="${size / 2}" y="${size / 2}" 
        font-size="${Math.round(size * 0.5)}" 
        font-weight="bold" 
        font-family="Arial, sans-serif"
        fill="#FFFFFF" 
        text-anchor="middle" 
        dominant-baseline="middle">
    SG
  </text>
</svg>`;
  return svg;
}

try {
  // Generar iconos SVG
  const sizes = [96, 192, 512];
  
  sizes.forEach((size) => {
    const svg = createSVGIcon(size);
    fs.writeFileSync(path.join(publicDir, `icon-${size}.svg`), svg);
    console.log(`✅ Creado: icon-${size}.svg`);
  });

  console.log('\n✨ Iconos SVG generados exitosamente');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
