import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],

      // Manifest PWA — installable sur mobile
      manifest: {
        name: 'Unwine-D',
        short_name: 'Unwine-D',
        description: 'Votre sommelier personnel',
        theme_color: '#1a0f0a',
        background_color: '#1a0f0a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },

      workbox: {
        // Cache tous les assets statiques générés par Vite
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Taille max d'un fichier mis en cache (boirCatalog.js peut être gros)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB

        // Stratégie réseau pour les requêtes runtime
        runtimeCaching: [
          // Google Fonts — cache first
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // Images Shopify (photos des vins) — cache avec expiration
          {
            urlPattern: /^https:\/\/cdn\.shopify\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wine-images-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // API Claude — Network Only (pas de cache pour les requêtes IA)
          {
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          // Supabase — Network Only avec fallback silencieux
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],

  server: {
    port: 3000,
  },

  build: {
    outDir: "dist",
  },
});
