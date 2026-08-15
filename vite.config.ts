import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from GitHub Pages at https://<user>.github.io/new-heart/, so assets need that base path.
export default defineConfig({
  base: '/new-heart/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'New Heart',
        short_name: 'New Heart',
        description: 'A Lamp Unto My Feet — retrieval-based Scripture memorization.',
        theme_color: '#3730a3',
        background_color: '#fffbeb',
        display: 'standalone',
        start_url: '/new-heart/',
        scope: '/new-heart/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json}']
      }
    })
  ]
})
