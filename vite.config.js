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

// Imprime en la terminal del "npm run dev" cada request que el proxy reenvía
// al backend real, con la URL completa (target + path ya reescrito).
const logProxiedRequests = (nombre) => (proxy, options) => {
  proxy.on("proxyReq", (proxyReq, req) => {
    console.log(
      `[proxy:${nombre}] ${req.method} ${req.url} -> ${options.target}${proxyReq.path}`
    );
  });
  proxy.on("error", (err, req) => {
    console.error(`[proxy:${nombre}] ERROR ${req.method} ${req.url} ->`, err.message);
  });
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Cambia la IP si es necesario
    strictPort: true, // Activa el modo estricto para el puerto  
    port: 5000, // Mantén el mismo puerto si quieres,
    headers: securityHeaders,
    proxy: {
      "/apip1": {
        target: "http://192.168.0.68:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/apip1/, ""),
        configure: logProxiedRequests("apip1"),
      },
      "/apid2": {
        target: "http://192.168.0.68:3003",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/apid2/, ""),
        configure: logProxiedRequests("apid2"),
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
