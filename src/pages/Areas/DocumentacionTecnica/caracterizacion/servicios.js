import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Atributos mínimos del producto: { total, completos, pendientes, verificar, grupos[], lineas[], linea }.
 * `linea` (opcional, p. ej. "LLANTAS"; por defecto, la primera de la lista) deja solo los atributos que aplican a esa línea de negocio.
 * Lo sirve el backend del portal (API 2) con el recurso documentaciontecnica.caracterizacion (errores propagados).
 */
export async function DocTec_ObtenerCaracterizacion(linea) {
  const res = await axiosInstanceNew.get("/documentacion-tecnica/caracterizacion", { params: linea ? { linea } : {} });
  return res.data.data;
}
