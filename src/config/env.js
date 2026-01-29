/**
 * Variables de entorno centralizadas (Vite).
 * Definir en .env.development y .env.production.
 * Todas las variables expuestas al cliente deben tener prefijo VITE_.
 */

const ENV = import.meta.env;

/** Base URL API principal (cartera, compras, contabilidad, importaciones, etc.) */
export const API_URL = ENV.VITE_API_URL ?? "";

/** Base URL API nueva (auth, /auth/me, 5W2H, transacciones cartera, permisos, etc.) */
export const API_URL_NEW = ENV.VITE_API_URL_NEW ?? "";

/** Base URL Portal Mayorista (usuarios/vendedores) */
export const API_URL_PORTAL_MAYORISTA = ENV.VITE_API_URL_PORTAL_MAYORISTA ?? "";

/** API Key para Portal Mayorista (cabecera X-Portal-API-Key) */
export const PORTAL_MAYORISTA_API_KEY = ENV.VITE_API_KEY_PORTAL_MAYORISTA ?? "";

/** Clave para encriptar/desencriptar id-session en localStorage */
export const ENCRYPTION_KEY = ENV.VITE_ENCRYPTION_KEY ?? "default-encryption-key-change-in-env";

/** development | production */
export const MODE = ENV.MODE ?? "development";

/** URL del frontend (ej. para iframes o links; opcional) */
export const FRONT_DEV = ENV.VITE_FRONT_DEV ?? "";

/** Entorno: development | production (desde VITE_ENV en .env) */
export const ENV_NAME = ENV.VITE_ENV ?? ENV.MODE ?? "development";

export default {
  API_URL,
  API_URL_NEW,
  API_URL_PORTAL_MAYORISTA,
  PORTAL_MAYORISTA_API_KEY,
  ENCRYPTION_KEY,
  MODE,
  FRONT_DEV,
  ENV_NAME,
};
