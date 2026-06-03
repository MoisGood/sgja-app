const { readFileSync, writeFileSync } = require('fs');
const { marked } = require('marked');

const md = readFileSync('informe_analisis_sgja.md', 'utf-8');
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe de Análisis SGJA</title>
<style>
  @page { margin: 2cm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 20px; }
  h1 { font-size: 20pt; color: #1a3c6b; border-bottom: 2px solid #1a3c6b; padding-bottom: 8px; }
  h2 { font-size: 15pt; color: #1a3c6b; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  h3 { font-size: 12pt; color: #374151; margin-top: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
  th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
  th { background: #f3f4f6; font-weight: 600; }
  tr:nth-child(even) { background: #f9fafb; }
  code { background: #f3f4f6; padding: 1px 4px; border-radius: 3px; font-size: 10pt; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
  blockquote { border-left: 4px solid #1a3c6b; margin: 12px 0; padding: 8px 16px; background: #f9fafb; }
  ul, ol { margin: 8px 0; padding-left: 20px; }
  li { margin: 4px 0; }
  strong { color: #111827; }
  em { color: #6b7280; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
${marked(md)}
</body>
</html>`;

writeFileSync('informe_analisis_sgja.html', html, 'utf-8');
console.log('HTML generado: informe_analisis_sgja.html');
console.log('Abrir en navegador y usar Ctrl+P → Guardar como PDF');
