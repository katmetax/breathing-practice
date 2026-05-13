import { fileURLToPath, URL } from "node:url"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import vueJsx from "@vitejs/plugin-vue-jsx"
import basicSsl from "@vitejs/plugin-basic-ssl"
import vueDevTools from "vite-plugin-vue-devtools"
import Icons from "unplugin-icons/vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    Icons({ compiler: "vue3" }),
    basicSsl(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Breathing Practice",
        short_name: "Breathe",
        theme_color: "#eaf3f8",
        background_color: "#eaf3f8",
        icons: [
          { src: "icons/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pwa-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
