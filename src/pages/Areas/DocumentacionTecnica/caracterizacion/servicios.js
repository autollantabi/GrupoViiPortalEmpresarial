import { apiDocTec } from "../api";

/**
 * Atributos mínimos del producto: { total, completos, pendientes, verificar, grupos[], lineas[], linea }.
 * `linea` (opcional, p. ej. "LLANTAS"; por defecto, la primera de la lista) deja solo los atributos que aplican a esa línea de negocio (errores propagados).
 */
export async function DocTec_ObtenerCaracterizacion(linea) {
  const res = await apiDocTec.get("/caracterizacion/", { params: linea ? { linea } : {} });
  return res.data;
}
