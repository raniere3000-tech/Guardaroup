import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// base "./" + HashRouter = funciona em qualquer subpasta (GitHub Pages, Vercel, etc.)
const BUILD = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

export default defineConfig({
  base: "./",
  define: { __BUILD__: JSON.stringify(BUILD) },
  // duas páginas: o app (index.html) e o laboratório (lab.html)
  build: { rollupOptions: { input: { main: "index.html", lab: "lab.html" } } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Vestí — seu closet digital",
        short_name: "Vestí",
        description: "Organize suas roupas e monte looks em segundos.",
        lang: "pt-BR",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#FFFCF5",
        theme_color: "#FFFCF5",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallbackDenylist: [/lab\.html/],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            // modelo de remoção de fundo: baixa uma vez, depois fica salvo no aparelho
            urlPattern: /^https:\/\/staticimgly\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "bg-removal-model",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
