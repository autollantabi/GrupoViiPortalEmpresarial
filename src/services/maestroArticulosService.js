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
 * Empresas válidas para /maestro_articulos_archivos.
 */
export const EMPRESAS_MAESTRO_ARTICULOS = ["MAXXIMUNDO", "AUTOLLANTA", "STOX", "IKONIX", "AUTOMAX"];

/**
 * Líneas de negocio válidas para /maestro_articulos_archivos. El backend
 * también acepta "LLANTAS MOTO" (singular) como alias de "LLANTAS MOTOS",
 * pero no hace falta ofrecer esa variante en la UI.
 */
export const LINEAS_NEGOCIO_MAESTRO_ARTICULOS = ["LLANTAS", "LLANTAS MOTOS", "HERRAMIENTAS", "LUBRICANTES"];

/**
 * Corre el reporte completo (maestro de artículos + auditoría DLT/LTF/VF).
 * "empresa" es siempre obligatoria; "linea_negocio" y "marca" son opcionales
 * pero ACUMULATIVOS -- marca sin línea de negocio no es una combinación
 * válida (400 en el backend):
 *  - Solo empresa: todo el alcance de esa empresa.
 *  - Empresa + línea de negocio: toda esa línea (todas sus marcas).
 *  - Empresa + línea de negocio + marca(s): acota además a esas marcas.
 * @param {string} empresa - Uno de EMPRESAS_MAESTRO_ARTICULOS.
 * @param {string|null} [lineaNegocio] - Uno de LINEAS_NEGOCIO_MAESTRO_ARTICULOS; se omite para traer todas.
 * @param {string[]|null} [marcas] - Una o más marcas; solo válido junto con lineaNegocio.
 * @returns {Promise<{empresa: string, linea_negocio: string|null, marca: string[]|null, carpeta: string, archivos: Array<{tipo: string, nombre: string, ruta: string, url_descarga: string, tamano_bytes: number}>}>}
 */
export const ObtenerArchivosMaestroArticulos = async (empresa, lineaNegocio, marcas) => {
  const response = await axiosInstanceDdmrpMv.post("/maestro_articulos_archivos", {
    empresa,
    linea_negocio: lineaNegocio || null,
    marca: marcas && marcas.length > 0 ? marcas : null,
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

/**
 * Arma la URL de descarga de un archivo devuelto por
 * /maestro_articulos_archivos. Desde el nuevo formato, cada archivo ya trae
 * "url_descarga" (ruta relativa lista para usar); si por algún motivo no
 * viniera, se reconstruye a partir de "ruta" como antes.
 * @param {{ruta?: string, url_descarga?: string}} archivo
 */
export const ConstruirUrlDescarga = (archivo) => {
  if (!archivo) return "";
  if (archivo.url_descarga) return `${API_URL_DDMRP_MV}${archivo.url_descarga}`;
  return ConstruirUrlDescargaArchivo(archivo.ruta);
};
