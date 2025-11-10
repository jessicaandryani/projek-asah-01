import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Konfigurasi path
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'src', 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // Konfigurasi PWA
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // Kita akan register manual
      strategies: 'injectManifest',
      srcDir: 'scripts',
      filename: 'sw.js',
      
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg}'],
        runtimeCaching: [
          // ... (semua runtimeCaching kamu biarkan saja, sudah benar) ...
          {
            urlPattern: ({ url }) => url.origin === 'https://story-api.dicoding.dev' && url.pathname.startsWith('/images/stories/'),
            handler: 'CacheFirst',
            options: { cacheName: 'story-images-cache', expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 } },
          },
          {
            urlPattern: ({ url }) => url.origin.endsWith('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: { cacheName: 'map-tiles-cache', expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 } },
          },
        ],
      },
      
      // --- INI BAGIAN YANG KITA PERBAIKI ---
      manifest: {
        name: 'Story App - Jessica Andryani',
        short_name: 'Story App',
        description: 'Aplikasi PWA untuk submission kelas Dicoding.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#007bff',
        
        icons: [
          // 1. KITA HAPUS entri 192x192 yang salah
          
          // 2. KITA SISAKAN entri 512x512 yang sudah benar
          {
            src: '/images/logo.png', 
            sizes: '512x512', 
            type: 'image/png',
            purpose: 'any maskable' // Gabungkan 'purpose'
          }
        ],
        
        // 3. KITA TAMBAHKAN screenshots (Kriteria 3 Skilled)
        screenshots: [
          {
            // Nanti kamu bisa ganti ini dengan screenshot sungguhan
            // Untuk sekarang, kita pakai logo.png sebagai placeholder
            "src": "/images/logo.png",
            "sizes": "512x512",
            "type": "image/png",
            "form_factor": "wide" // Untuk desktop
          },
          {
            "src": "/images/logo.png",
            "sizes": "512x512",
            "type": "image/png",
            "form_factor": "narrow" // Untuk mobile
          }
        ]
      },
      // --- AKHIR BAGIAN PERBAIKAN ---
    }),
  ],
});
