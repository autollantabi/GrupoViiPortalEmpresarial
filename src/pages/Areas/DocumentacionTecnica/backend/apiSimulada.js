/**
 * API de «Documentación y Calidad».
 *
 * Por defecto sirve datos de ejemplo (archivos JSON de cada sección) con el mismo contrato (rutas y formato JSON) que
 * tendrá la API real, sin Django, sin SAP HANA y sin credenciales. Si existe backend/.env (o variables de entorno
 * del sistema) y se activa una fuente en vivo, las secciones que la soportan consultan la base (hoy: Completitud
 * con COMPLETITUD_FUENTE=postgres; ver .env.example).
 *
 * Cada sección vive en su carpeta (backend/<seccion>/ruta.js) y exporta un objeto `rutas`
 * { "/ruta/": (req, res) => ... } (puede ser async). Para añadir una sección: crear su carpeta y registrarla abajo.
 *
 * Funciona como middleware de Vite (npm run dev en frontend/) o como servidor aparte (npm start en backend/).
 */
import "./entorno.js";
import { enviarJson } from "./comun.js";
import { configurada, ConexionError, probarConexion } from "./postgres.js";
import { rutas as diccionario, rutasPost as diccionarioPost } from "./diccionario/ruta.js";
import { rutas as dwhMapping } from "./dwh_mapping/ruta.js";
import { rutas as caracterizacion } from "./caracterizacion/ruta.js";
import { rutas as completitud } from "./completitud/ruta.js";
import { rutas as calidad, rutasPost as calidadPost } from "./calidad/ruta.js";
import { configurada as hanaConfigurada, probarConexion as probarHana } from "./hana.js";
import { autorizar, SesionError } from "./sesion.js";

const PREFIJO = "/api/documentacion";

// Rutas que cambian datos (POST): solo leen la base y escriben un archivo local
const rutasPost = { ...calidadPost, ...diccionarioPost };

const rutas = {
  "/salud/": (req, res) => enviarJson(res, 200, { ok: true }),

  // Prueba de la conexión a PostgreSQL con el .env. Nunca devuelve datos de conexión.
  "/salud/db/": async (req, res) => {
    if (!configurada()) {
      return enviarJson(res, 200, { configurada: false, mensaje: "Sin credenciales: copia backend/.env.example como backend/.env y complétalo." });
    }
    try {
      enviarJson(res, 200, { configurada: true, postgres: await probarConexion() });
    } catch (error) {
      enviarJson(res, 200, { configurada: true, postgres: { ok: false, error: error instanceof ConexionError ? error.message : "Error inesperado." } });
    }
  },

  // Prueba de la conexión a SAP HANA con el .env. Nunca devuelve datos de conexión.
  "/salud/hana/": async (req, res) => {
    if (!hanaConfigurada()) {
      return enviarJson(res, 200, { configurada: false, mensaje: "Sin credenciales: agrega HANA_HOST, HANA_PORT, HANA_USER, HANA_PASSWORD y HANA_SCHEMA a backend/.env." });
    }
    try {
      enviarJson(res, 200, { configurada: true, hana: await probarHana() });
    } catch (error) {
      enviarJson(res, 200, { configurada: true, hana: { ok: false, error: error instanceof ConexionError ? error.message : "Error inesperado." } });
    }
  },

  ...diccionario,
  ...dwhMapping,
  ...caracterizacion,
  ...completitud,
  ...calidad,
};

/** Comprueba si el encabezado Origin corresponde al mismo servidor/red o a uno listado en CORS_ORIGEN. */
function origenPermitido(req) {
  const origen = req.headers.origin;
  if (!origen) return true;
  let urlOrigen;
  try {
    urlOrigen = new URL(origen);
  } catch {
    return false;
  }
  const hostServidor = (req.headers.host || "").split(":")[0];
  if (urlOrigen.host === req.headers.host || (hostServidor && urlOrigen.hostname === hostServidor)) return true;
  const permitidos = (process.env.CORS_ORIGEN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return permitidos.includes(origen) || permitidos.includes(urlOrigen.origin);
}

export function apiSimulada(req, res, next) {
  const url = (req.url || "").split("?")[0];
  if (!url.startsWith(PREFIJO)) return next ? next() : enviarJson(res, 404, { error: "No encontrado" });
  const ruta = url.slice(PREFIJO.length) || "/";

  // CORS para que el Portal Empresarial (en otro puerto o dominio autorizado) pueda llamar a este servicio independiente
  const origen = req.headers.origin;
  const permitido = origenPermitido(req);
  if (origen && permitido) {
    res.setHeader("Access-Control-Allow-Origin", origen);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, id-session");
  }
  if (req.method === "OPTIONS") {
    if (!permitido) return enviarJson(res, 403, { error: "Origen no permitido" });
    res.statusCode = 204;
    return res.end();
  }

  if (req.method === "POST" && rutasPost[ruta]) {
    // Defensa contra peticiones desde un sitio web externo no autorizado
    if (!permitido) return enviarJson(res, 403, { error: "Origen no permitido" });
  } else if (req.method !== "GET") {
    return enviarJson(res, 405, { error: "Solo lectura" });
  }

  const manejador = req.method === "POST" ? rutasPost[ruta] : rutas[ruta];
  if (!manejador) return enviarJson(res, 404, { error: "No encontrado" });

  // Los manejadores pueden ser async: un error nunca debe tumbar el servidor ni mostrar detalles internos.
  return Promise.resolve()
    .then(() => autorizar(req, ruta)) // sesión del portal y recurso `documentaciontecnica` (ver sesion.js)
    .then(() => manejador(req, res))
    .catch((error) => {
      if (res.headersSent) return res.end();
      if (error instanceof SesionError) return enviarJson(res, error.estado, { error: error.message });
      if (error instanceof ConexionError) return enviarJson(res, 503, { error: error.message });
      console.error(`Error en ${url}:`, error?.message ?? error);
      return enviarJson(res, 500, { error: "Error interno de la API." });
    });
}
