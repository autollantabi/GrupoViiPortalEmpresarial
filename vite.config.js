import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Cabeceras de seguridad (dev y preview). En producción deben configurarse en el servidor (nginx, etc.)
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: "192.168.0.68", // Cambia la IP si es necesario
    strictPort: true, // Activa el modo estricto para el puerto  
    port: 5000, // Mantén el mismo puerto si quieres,
    headers: securityHeaders,
    proxy:{
      "/apid1": {
        target: "http://localhost:3002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/apid1/, ""),
      },
      "/apid2": {
        target: "http://localhost:3004",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/apid2/, ""),
      }
    },
  },
  resolve: {
    extensions: [".js", ".jsx"],
    alias: {
      "assets": path.resolve(__dirname, "src/assets"),
      "components": path.resolve(__dirname, "src/components"),
      "config": path.resolve(__dirname, "src/config"),
      "context": path.resolve(__dirname, "src/context"),
      "pages": path.resolve(__dirname, "src/pages"),
      "router": path.resolve(__dirname, "src/router"),
      "services": path.resolve(__dirname, "src/services"),
      "utils": path.resolve(__dirname, "src/utils"),
      "hooks": path.resolve(__dirname, "src/hooks"),
    },
  },
  build: {
    outDir: "build", // Mantiene la estructura similar a CRA
  },
  preview: {
    port: 7150,
    host: "192.168.0.2",
    headers: securityHeaders,
  },
});
