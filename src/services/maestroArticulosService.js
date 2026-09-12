import { axiosInstanceDdmrpMv } from "config/axiosConfig";
import { API_URL_DDMRP_MV } from "config/env";

/**
 * Servicios del backend Python "maestro_articulos" (api.py), desplegado en la
 * VM del portal (192.168.0.68:8502, misma máquina donde corre este front
 * cuando está publicado). Ambos endpoints son síncronos, sin trabajo/polling:
 *
 *  - /maestro_articulos_archivos: corre el reporte completo (Hoja 1 + Hoja 2 +
 *    auditoría LTF/VF + JSON) y devuelve la RUTA de cada archivo generado en
 *    el servidor (quedan en /tmp, no se borran al responder). Puede tardar
 *    varios minutos (HANA + Postgres + API externa de Maxximundo).
 *  - /maestro_articulos_resumen: JSON jerárquico recalculado en vivo, acotado
 *    a una empresa y, opcionalmente, a una línea de negocio. Responde rápido.
 */

/**
 * @param {string} empresa
 * @returns {Promise<{empresa: string, carpeta: string, archivos: Array<{tipo: string, nombre: string, ruta: string, tamano_bytes: number}>}>}
 */
export const ObtenerArchivosMaestroArticulos = async (empresa) => {
  const response = await axiosInstanceDdmrpMv.get("/maestro_articulos_archivos", {
    params: { empresa },
  });
  return response.data;
};

/**
 * @param {string} empresa
 * @param {string|null} [linea] - Una de LINEAS_VF_COEF_VARIACION; si se omite, trae todas las líneas.
 * @returns {Promise<{empresa: string, linea: string|null, total_articulos: number, articulos: Array}>}
 */
export const ObtenerResumenMaestroArticulos = async (empresa, linea) => {
  const response = await axiosInstanceDdmrpMv.get("/maestro_articulos_resumen", {
    params: { empresa, linea: linea || undefined },
  });
  return response.data;
};

/**
 * Arma la URL de descarga de un archivo a partir de la ruta que devuelve el
 * servidor (ej. "/tmp/maestro_articulos_fcsnq4x8/maestro_articulos.xlsx").
 * Esa ruta es la ubicación en disco del archivo, no una URL servible
 * directamente (el backend no expone /tmp como archivos estáticos) -- por
 * eso se pasa como parámetro a un endpoint dedicado de descarga.
 * @param {string} ruta
 */
export const ConstruirUrlDescargaArchivo = (ruta) => {
  if (!ruta) return "";
  return `${API_URL_DDMRP_MV}/maestro_articulos_descargar?ruta=${encodeURIComponent(ruta)}`;
};
