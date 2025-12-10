import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "192.168.0.68", // Cambia la IP si es necesario
    strictPort: true, // Activa el modo estricto para el puerto  
    port: 5000, // Mantén el mismo puerto si quieres,
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
});
