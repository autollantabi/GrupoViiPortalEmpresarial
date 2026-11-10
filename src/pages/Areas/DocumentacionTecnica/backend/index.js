// Servidor independiente de la API: `npm start` en backend/ (puerto 3010 o la variable PORT).
import http from "node:http";
import { apiSimulada } from "./apiSimulada.js";

const puerto = Number(process.env.PORT) || 3010;
const host = process.env.HOST || "0.0.0.0";
http.createServer((req, res) => apiSimulada(req, res)).listen(puerto, host, () => {
  console.log(`API de Documentación Técnica en http://${host === "0.0.0.0" ? "localhost" : host}:${puerto}/api/documentacion/`);
});
