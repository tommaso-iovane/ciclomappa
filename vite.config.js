import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        svelte(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
                cleanupOutdatedCaches: true,
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            }
                        }
                    }
                ],
                skipWaiting: true, // Immediately activate new service worker
                clientsClaim: true // Take control of all clients immediately
            },
            devOptions: {
                enabled: true // Enable PWA in development for testing
            },
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png'],
            manifest: {
                name: 'CicloMappa',
                short_name: 'CicloMappa',
                description: 'Opencyclemap with gps functionality',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                categories: ['navigation', 'travel', 'sports'],
                orientation: 'portrait-primary',
                // Add update_url for automatic update checks
                prefer_related_applications: false,
                icons: [
                    {
                        src: 'pwa-64x64.png',
                        sizes: '64x64',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'maskable-icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            }
        })
    ],
})
