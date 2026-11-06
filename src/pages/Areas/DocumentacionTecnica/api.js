import axios from "axios";
import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Cliente HTTP del módulo «Documentación Técnica».
 * Toma la URL base de VITE_API_URL_DOC (o por defecto el servicio en el puerto 3010 en desarrollo / "/api/documentacion" en producción)
 * y adjunta automáticamente la cabecera "id-session" de la sesión activa del Portal.
 */
function resolverBaseUrl() {
  if (import.meta.env.VITE_API_URL_DOC) return import.meta.env.VITE_API_URL_DOC;
  if (import.meta.env.DEV && typeof window !== "undefined" && window.location.port && window.location.port !== "5100") {
    return `${window.location.protocol}//${window.location.hostname}:3010/api/documentacion`;
  }
  return "/api/documentacion";
}

export const apiDocTec = axios.create({
  baseURL: resolverBaseUrl(),
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

apiDocTec.interceptors.request.use((config) => {
  const sesion = axiosInstanceNew?.defaults?.headers?.common?.["id-session"];
  if (sesion) config.headers["id-session"] = sesion;
  return config;
});
