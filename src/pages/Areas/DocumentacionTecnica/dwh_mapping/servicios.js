import { apiDocTec } from "../api";

/** Catálogo del DWH: { tablas[], codigos_diccionario[] } (errores propagados, ver diccionario/servicios.js) */
export async function DocTec_ObtenerDwhMapping() {
  const res = await apiDocTec.get("/dwh-mapping/");
  return res.data;
}
