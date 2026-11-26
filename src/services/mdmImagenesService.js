import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Servicio del MDM de imágenes. Independiente de mdmService.js y de
 * mdmProductosService.js para no arrastrar sus dependencias.
 */

/**
 * Artículos de core.dim_item con sus imágenes PNG (SharePoint) y WebP (R2),
 * con la existencia real de cada archivo.
 *
 * @param {Object} filtros
 * @param {string} [filtros.empresa] - AUTOLLANTA, IKONIX, MAXXIMUNDO, STOX; "TODAS" o vacío = todas
 * @param {string} [filtros.linea] - LLANTAS, LLANTAS MOTO, LUBRICANTES, HERRAMIENTAS; "TODAS" o vacío = todas
 * @param {"todas"|"con"|"sin"} [filtros.imagen="todas"]
 * @param {string} [filtros.busqueda] - Código SAP, código de barras o nombre
 * @returns {Promise<{Paginacion: Object|null, Items: Array}>}
 *   Cada ítem: { CODIGO, IDENTIFICADOR, NOMBRE, CODIGO_BARRAS, EMPRESA, LINEA_NEGOCIO,
 *   RUTA_IMAGEN_PNG, RUTA_IMAGEN_WEB, URL_WEBP, PNG_EXISTE, WEBP_EXISTE }
 */
export const getImagenesMDM = async ({
  empresa = "TODAS",
  linea = "TODAS",
  imagen = "todas",
  busqueda = null,
  page = 1,
  size = 15,
}) => {
  const params = { empresa, linea_negocio: linea, imagen, page, size };
  if (busqueda) params.busqueda = busqueda;

  const response = await axiosInstanceNew.get("/mdm/imagenes", { params });

  if (response.data && response.data.status === "Ok!") {
    return response.data.data;
  }
  return { Paginacion: null, Items: [] };
};

/**
 * Bytes del PNG de un artículo (SharePoint no tiene URL pública). `version` es
 * el decimal anti-caché: cambia la URL de la petición para no reutilizar una
 * respuesta guardada por el navegador.
 * @returns {Promise<Blob>}
 */
export const getPngImagenMDM = async ({ empresa, identificador, version }) => {
  const response = await axiosInstanceNew.get("/mdm/imagenes/png", {
    params: { empresa, identificador, v: version },
    responseType: "blob",
    headers: { "Cache-Control": "no-cache" },
  });
  return response.data;
};

/**
 * Reemplaza la imagen (misma ruta y nombre) de un artículo.
 * @param {Object} datos
 * @param {string} datos.empresa
 * @param {string} datos.identificador
 * @param {"png"|"webp"} datos.tipo
 * @param {File} datos.archivo
 * @returns {Promise<{Item: Object, ArticulosCompartiendoArchivo: number}>}
 */
export const reemplazarImagenMDM = async ({ empresa, identificador, tipo, archivo }) => {
  const formData = new FormData();
  formData.append("empresa", empresa);
  formData.append("identificador", identificador);
  formData.append("tipo", tipo);
  formData.append("archivo", archivo);

  const response = await axiosInstanceNew.post("/mdm/imagenes/reemplazar", formData);
  return response.data.data;
};

/** Decimal anti-caché, p. ej. 0.1512364: se agrega como ?{numero} a la ruta de la imagen */
export const nuevaVersionImagen = () => Math.random();
