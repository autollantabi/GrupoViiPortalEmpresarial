/**
 * Servicio de Guías de Remisión: llamadas al backend (/guias-remision) usadas por
 * pages/Areas/Contabilidad/GuiasRemision/GuiasRemision.jsx. La lógica de negocio vive en el backend.
 */
import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Lista las guías de remisión de una empresa, paginadas y filtradas en el servidor.
 * La cabecera "id-session" la agrega automáticamente axiosInstanceNew.
 *
 * @param {Object} params
 * @param {string} params.empresa - Nombre de la empresa (STOX, AUTOLLANTA, ...)
 * @param {number} [params.page=1]
 * @param {number} [params.size=25]
 * @param {string} [params.fechaDesde] - YYYY-MM-DD
 * @param {string} [params.fechaHasta] - YYYY-MM-DD
 * @param {string} [params.estado] - detalle de estado electrónico; vacío = todos
 * @param {string} [params.cliente] - código de socio o nombre
 * @param {string} [params.busqueda] - número de guía, factura, código de socio o nombre
 * @param {string} [params.enviado] - "true" solo enviadas, "false" solo pendientes de envío; vacío = todas
 * @param {AbortSignal} [signal] - permite cancelar la consulta si el usuario cambia los filtros
 * @returns {Promise<{Paginacion: Object, Guias: Array}>}
 * @throws Propaga el error de red/servidor para que la vista distinga "sin datos" de "fallo".
 */
export const ListarGuiasRemision = async (
  { empresa, page = 1, size = 25, fechaDesde, fechaHasta, estado, cliente, busqueda, enviado },
  signal
) => {
  // Los filtros vacíos no se envían
  const params = { empresa, page, size };
  if (fechaDesde) params.fechaDesde = fechaDesde;
  if (fechaHasta) params.fechaHasta = fechaHasta;
  if (estado) params.estado = estado;
  if (cliente) params.cliente = cliente;
  if (busqueda) params.busqueda = busqueda;
  if (enviado) params.enviado = enviado;

  const response = await axiosInstanceNew.get("/guias-remision", {
    params,
    signal,
  });

  if (response.data?.status === "Ok!" && response.data.data) {
    return response.data.data;
  }

  throw new Error(response.data?.message || "Respuesta inesperada del servidor");
};

/**
 * Marca una guía de remisión como enviada (hgr_enviado = true).
 * @param {{id: number, empresa: string}} params - id = hgr_id de la guía
 * @throws Propaga el error; el mensaje del servidor viene en error.response.data.message
 */
export const MarcarGuiaRemisionEnviada = async ({ id, empresa }) => {
  const response = await axiosInstanceNew.patch(`/guias-remision/${id}/enviado`, {
    empresa,
  });

  if (response.data?.status !== "Ok!") {
    throw new Error(response.data?.message || "Respuesta inesperada del servidor");
  }
};

/**
 * Marca una guía de remisión como NO enviada (hgr_enviado = false): vuelve a quedar pendiente de envío.
 * @param {{id: number, empresa: string}} params - id = hgr_id de la guía
 * @throws Propaga el error; el mensaje del servidor viene en error.response.data.message
 */
export const MarcarGuiaRemisionNoEnviada = async ({ id, empresa }) => {
  const response = await axiosInstanceNew.patch(`/guias-remision/${id}/no-enviado`, {
    empresa,
  });

  if (response.data?.status !== "Ok!") {
    throw new Error(response.data?.message || "Respuesta inesperada del servidor");
  }
};

/** Empresas que participan en el Excel de guías de remisión (IKONIX no existe en este proceso). */
export const EMPRESAS_EXCEL = ["AUTOLLANTA", "MAXXIMUNDO", "STOX"];

const ddmmyy = (iso) => `${iso.slice(8, 10)}_${iso.slice(5, 7)}_${iso.slice(2, 4)}`;

/**
 * Nombre del archivo: guias_remision_dd_mm_yy_dd_mm_yy.<ext> (siempre las dos fechas, aunque sean el mismo día).
 * Solo se usa si el servidor no envía Content-Disposition.
 */
export const nombreArchivoExcel = (desde, hasta, extension = "xlsx") =>
  `guias_remision_${ddmmyy(desde)}_${ddmmyy(hasta)}.${extension}`;

/**
 * Pide al servidor el archivo GUIAS DE REMISIÓN (.xlsx) del rango y las empresas: la plantilla con las hojas DATOS MAESTROS,
 * LAAR y CONSOLIDADO_FINAL llenas. Las tablas dinámicas las actualiza Excel en la máquina del usuario.
 *
 * @param {{desde: string, hasta: string, empresas: string[]}} params - fechas YYYY-MM-DD inclusivas
 * @returns {Promise<{blob: Blob, nombreArchivo: string}>}
 * @throws Error de axios; el mensaje del servidor queda en error.response.data.message
 */
export const DescargarExcelGuiasRemision = async ({ desde, hasta, empresas }) => {
  try {
    const res = await axiosInstanceNew.get("/guias-remision/exportar-excel", {
      params: { desde, hasta, empresas: empresas.join(",") },
      responseType: "blob",
      timeout: 15 * 60 * 1000,
      // El interceptor de axios reintenta ante timeout: aquí no, relanzaría la generación
      _retry: true,
    });

    const disposicion = res.headers["content-disposition"] || "";
    const coincide = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposicion);

    return {
      blob: res.data,
      nombreArchivo: coincide
        ? decodeURIComponent(coincide[1])
        : nombreArchivoExcel(desde, hasta, "xlsx"),
    };
  } catch (error) {
    // Con responseType "blob" el cuerpo del error también llega como Blob: se lee para obtener el mensaje
    if (error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text());
      } catch (e) {
        // cuerpo no JSON: se deja como está
      }
    }
    throw error;
  }
};

/**
 * Lanza la sincronización de guías de remisión (el mismo proceso que corre cada hora) en el servidor.
 * Responde enseguida: el avance se consulta con EstadoSincronizacionGuias.
 * @throws Error de axios; 403 sin permiso, 409 ya hay una en curso, 503 el script no está disponible
 */
export const SincronizarGuiasRemision = async () => {
  const response = await axiosInstanceNew.post("/guias-remision/sincronizar");
  return response.data?.data;
};

/**
 * Estado de la última sincronización lanzada desde el portal.
 * @returns {Promise<{ejecutando: boolean, inicio: string|null, fin: string|null, codigo: number|null, exitosa: boolean|null}>}
 */
export const EstadoSincronizacionGuias = async () => {
  const response = await axiosInstanceNew.get("/guias-remision/sincronizar");
  return response.data?.data;
};

/** Tamaño máximo del Excel que se puede subir (el servidor rechaza lo que supere este valor). */
export const TAMANO_MAXIMO_EXCEL_MB = 25;

/**
 * Lee el Excel de guías de remisión que se descargó del portal y trabaja sobre las guías de su hoja DATOS MAESTROS
 * (clave: empresa + N. Guia + N. Factura + Destinatario).
 *
 * @param {File} archivo - .xlsx o .xlsm
 * @param {boolean} confirmar - false: solo valida y devuelve el resumen (no modifica nada);
 *                              true: marca como enviadas las guías encontradas
 * @returns {Promise<Object>} resumen: guiasEnArchivo, porMarcar, yaEnviadas, canceladas, noEncontradas, marcadas,
 *   porEmpresa, ejemplosNoEncontradas, errores
 * @throws Error de axios; el mensaje del servidor queda en error.response.data.message
 */
export const MarcarEnviadasDesdeExcel = async (archivo, confirmar = false) => {
  const formData = new FormData();
  formData.append("archivo", archivo, archivo.name);

  const res = await axiosInstanceNew.post("/guias-remision/enviadas-desde-excel", formData, {
    params: { confirmar },
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 5 * 60 * 1000,
    // El interceptor de axios reintenta ante timeout; aquí no, para no repetir el proceso completo
    _retry: true,
  });

  if (res.data?.status === "Ok!" && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data?.message || "Respuesta inesperada del servidor");
};
