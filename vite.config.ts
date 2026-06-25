import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    {
      name: 'save-plano',
      configureServer(server) {
        server.middlewares.use('/api/save-plano', (req, res) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const filePath = path.resolve('public/plano_edificio.json');
              fs.writeFileSync(filePath, body, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Error desconocido';
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: msg }));
            }
          });
        });
      },
    },
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      includeAssets: ['favicon.ico', 'icon.svg'],
      manifest: {
        name: 'SGJA - Sistema Gestión Justificaciones',
        short_name: 'SGJA',
        description: 'Sistema de Gestión de Justificaciones y Biblioteca',
        theme_color: '#1A3C6B',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          { src: '/icon.svg', sizes: '192x192', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    host: 'localhost',
    port: 5173,
    open: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
