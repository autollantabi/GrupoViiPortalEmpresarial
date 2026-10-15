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
 * @param {string} [params.estado] - detalle de estado; vacío = todos
 * @param {string} [params.cliente] - código de socio o nombre
 * @param {string} [params.busqueda] - número de documento, código de socio o nombre
 * @param {AbortSignal} [signal] - permite cancelar la consulta si el usuario cambia los filtros
 * @returns {Promise<{Paginacion: Object, Guias: Array}>}
 * @throws Propaga el error de red/servidor para que la vista distinga "sin datos" de "fallo".
 */
export const ListarGuiasRemision = async (
  { empresa, page = 1, size = 25, fechaDesde, fechaHasta, estado, cliente, busqueda },
  signal
) => {
  // Los filtros vacíos no se envían
  const params = { empresa, page, size };
  if (fechaDesde) params.fechaDesde = fechaDesde;
  if (fechaHasta) params.fechaHasta = fechaHasta;
  if (estado) params.estado = estado;
  if (cliente) params.cliente = cliente;
  if (busqueda) params.busqueda = busqueda;

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
 * Marca una guía de remisión como enviada (hgr_estado_enviado = true).
 * @param {{id: number, empresa: string}} params - id = hgr_serial de la guía
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
