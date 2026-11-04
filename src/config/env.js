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

/** Base URL del backend Python "maestro_articulos" (DDMRP), en la VM del portal (192.168.0.68:8502) */
export const API_URL_DDMRP_MV = ENV.VITE_API_URL_DDMRP_MV ?? "";

/**
 * Geocodificador compatible con Nominatim (mapa de consulta).
 * Por defecto el público de OSM (solo para pruebas: uso ligero, sin autocompletado).
 * En producción apuntar a una instancia local (ver docs/mapa-consulta.md).
 */
export const GEOCODER_URL = (ENV.VITE_GEOCODER_URL ?? "").replace(/\/+$/, "");

/** Plantilla de teselas del mapa base ({z}/{x}/{y}); apuntar a un tile server propio en producción */
export const MAP_TILES_URL = ENV.VITE_MAP_TILES_URL ?? "";

/** Código ISO del país al que se limitan las búsquedas */
export const GEOCODER_COUNTRY = ENV.VITE_GEOCODER_COUNTRY ?? "";

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
  API_URL_DDMRP_MV,
  GEOCODER_URL,
  MAP_TILES_URL,
  GEOCODER_COUNTRY,
  ENCRYPTION_KEY,
  MODE,
  FRONT_DEV,
  ENV_NAME,
};
