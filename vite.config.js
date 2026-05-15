import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src/app",
      filename: "sw-custom.js",

      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,webp,woff2}"],
      },

      includeAssets: ["favicon.ico", "apple-touch-icon.png", "icons/*.png"],

      manifest: {
        id: "/",
        name: "طابو أخضر",
        short_name: "طابو أخضر",
        description: "تطبيق طابو أخضر العقاري في سوريا",
        theme_color: "#1A4A2E",
        background_color: "#F4F7F5",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        dir: "rtl",
        lang: "ar",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],
});
