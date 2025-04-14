import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: 'localhost',
    port: 8080,
    strictPort: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache'
    },
    watch: {
      usePolling: true
    },
    hmr: {
      host: 'localhost',
      port: 8080,
    }
  }
});
