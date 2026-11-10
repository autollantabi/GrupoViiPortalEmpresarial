import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Servicio de "Administración de productos" del MDM.
 *
 * Es independiente de mdmService.js (que concentra el MDM por línea y el de
 * clientes) para que este módulo no arrastre sus dependencias.
 */

/**
 * Listado paginado de los productos de una empresa (core.dim_item).
 * La paginación y la búsqueda las resuelve la base de datos.
 *
 * @param {Object} filtros
 * @param {string} filtros.empresa - dit_empresa
 * @param {string[]} [filtros.lineas] - Líneas de negocio (dit_grupo); vacío = todas
 * @param {number} [filtros.page=1]
 * @param {number} [filtros.size=15]
 * @param {string} [filtros.busqueda] - Busca por identificador, nombre o código de barras
 * @returns {Promise<{Paginacion: Object|null, Productos: Array}>}
 *   Cada producto: { CODIGO, IDENTIFICADOR, NOMBRE, CODIGO_BARRAS, EMPRESA, LINEA_NEGOCIO }
 */
export const getProductosMDM = async ({ empresa, lineas = [], page = 1, size = 15, busqueda = null }) => {
  const params = { empresa, page, size };
  if (lineas.length) params.linea_negocio = lineas.join(",");
  if (busqueda) params.busqueda = busqueda;

  const response = await axiosInstanceNew.get("/mdm/productos", { params });

  if (response.data && response.data.status === "Ok!") {
    return response.data.data;
  }
  return { Paginacion: null, Productos: [] };
};

/**
 * Bodegas de una empresa (core.dim_bodegas).
 * @param {string} empresa
 * @returns {Promise<Array<{CODIGO: string, NOMBRE: string}>>}
 */
export const getBodegasMDM = async (empresa) => {
  const response = await axiosInstanceNew.get(`/mdm/bodegas/${encodeURIComponent(empresa)}`);

  if (response.data && response.data.status === "Ok!") {
    return response.data.data || [];
  }
  return [];
};

/**
 * Observaciones de los productos a copiar (hoy: "Sin propiedad" en la empresa destino).
 * @returns {Promise<Array<{IDENTIFICADOR: string, Observaciones: string[]}>>}
 */
export const validarCopiaProductosMDM = async ({ empresaOrigen, empresaDestino, productos }) => {
  const response = await axiosInstanceNew.post("/mdm/productos/copiar/validar", {
    empresaOrigen,
    empresaDestino,
    productos,
  });

  if (response.data && response.data.status === "Ok!") {
    return response.data.data || [];
  }
  return [];
};

/**
 * Grupos de compra (unidades de medida) de la empresa destino.
 * @returns {Promise<{Opciones: Array<{UOM_GROUP_ENTRY: number, NOMBRE: string, TIPO: string}>, PorDefecto: Object}>}
 *   PorDefecto: { [línea]: UOM_GROUP_ENTRY } (solo LLANTAS y LLANTAS MOTO)
 */
export const getGruposCompraMDM = async (empresa) => {
  const response = await axiosInstanceNew.get(
    `/mdm/productos/grupos-compra/${encodeURIComponent(empresa)}`
  );

  if (response.data && response.data.status === "Ok!") {
    return response.data.data || { Opciones: [], PorDefecto: {} };
  }
  return { Opciones: [], PorDefecto: {} };
};

/**
 * Copia los productos a la empresa destino (integración Item SAP New).
 * Si hay observaciones o errores responde 422: el detalle viene en error.response.data.data
 * ({ Observaciones } o { Errores }).
 *
 * @param {Object} datos
 * @param {string} datos.empresaOrigen
 * @param {string} datos.empresaDestino
 * @param {string} datos.bodegaDestino - bod_codigo_bodega (obligatoria)
 * @param {boolean} datos.activoEasySales
 * @param {Object} datos.gruposCompra - { [línea]: UoMGroupEntry }
 * @param {string[]} datos.productos - códigos SAP (IDENTIFICADOR)
 */
export const copiarProductosMDM = async (datos) => {
  const response = await axiosInstanceNew.post("/mdm/productos/copiar", datos);
  return response.data;
};

/**
 * Productos de la empresa origen a partir de códigos leídos de un archivo
 * (identificador SAP o código de barras).
 * @returns {Promise<{Productos: Array, NoEncontrados: string[]}>}
 */
export const resolverCodigosMDM = async ({ empresa, codigos }) => {
  const response = await axiosInstanceNew.post("/mdm/productos/resolver", { empresa, codigos });

  if (response.data && response.data.status === "Ok!") {
    return response.data.data || { Productos: [], NoEncontrados: [] };
  }
  return { Productos: [], NoEncontrados: [] };
};
