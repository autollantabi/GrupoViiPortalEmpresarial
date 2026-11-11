import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Catálogo del DWH: { tablas[], codigos_diccionario[] }. Lo sirve el backend del portal (API 2)
 * con la sesión del portal y el recurso documentaciontecnica.dwhmapping (errores propagados).
 */
export async function DocTec_ObtenerDwhMapping() {
  const res = await axiosInstanceNew.get("/documentacion-tecnica/dwh-mapping");
  return res.data.data;
}
