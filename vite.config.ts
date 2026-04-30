import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { devApiPlugin } from './vite-api-plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.VITE_ANTHROPIC_API_KEY;

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(apiKey ? [devApiPlugin(apiKey)] : []),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico'],
        manifest: {
          name: 'Cito Rekentool',
          short_name: 'Rekentool',
          description: 'Prijsvergelijking en waarde-analyse voor Cito VO',
          theme_color: '#003082',
          background_color: '#FFFFFF',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-auth-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60,
                },
              },
            },
          ],
        },
      }),
      ...(process.env.SENTRY_AUTH_TOKEN ? [sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      })] : []),
    ],
    resolve: { alias: { '@': '/src' } },
    build: { sourcemap: true },
    server: { port: 3000 },
  };
});
