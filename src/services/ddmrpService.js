import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Servicios del reporte DDMRP.
 *
 * La generación es asíncrona a propósito: el script de Python consulta cinco
 * empresas en HANA más una API externa, y tarda bastante más que los 60s que
 * nginx tolera por defecto en /apip2. Por eso el flujo es
 * iniciar -> consultar estado -> descargar, con requests siempre cortos.
 *
 * La cabecera "id-session" la agrega automáticamente axiosInstanceNew.
 */

/**
 * Lanza la generación del reporte.
 * Si ya hay una en curso, el backend devuelve ese mismo trabajo en vez de
 * iniciar otro (el script golpea HANA de producción).
 * @returns {Promise<{id: string, estado: string, archivos: Array}>}
 */
export const IniciarReporteDdmrp = async () => {
  const response = await axiosInstanceNew.post("/ddmrp/reportes");

  if (response.data && response.data.status === "Ok!") {
    return response.data.data;
  }

  throw new Error(response.data?.message || "No se pudo iniciar el reporte");
};

/**
 * Consulta el estado de un trabajo.
 * @param {string} id - Identificador devuelto por IniciarReporteDdmrp
 * @returns {Promise<{estado: "EN_PROCESO"|"COMPLETADO"|"ERROR", archivos: Array, error: string|null, log: string[]}>}
 */
export const ConsultarReporteDdmrp = async (id) => {
  const response = await axiosInstanceNew.get(`/ddmrp/reportes/${id}`);

  if (response.data && response.data.status === "Ok!") {
    return response.data.data;
  }

  throw new Error(response.data?.message || "No se pudo consultar el reporte");
};

/**
 * Descarga uno de los Excel generados y dispara el guardado en el navegador.
 *
 * Se baja como blob (y no con un enlace directo) porque la ruta exige la
 * cabecera de sesión, que un <a href> no puede enviar.
 *
 * @param {string} id - Identificador del trabajo
 * @param {string} nombreArchivo - Tal como viene en archivos[].nombre
 */
export const DescargarArchivoDdmrp = async (id, nombreArchivo) => {
  const response = await axiosInstanceNew.get(
    `/ddmrp/reportes/${id}/archivos/${encodeURIComponent(nombreArchivo)}`,
    { responseType: "blob" }
  );

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.setAttribute("download", nombreArchivo);
  document.body.appendChild(enlace);
  enlace.click();

  // Liberar el objeto y quitar el enlace: si no, cada descarga deja basura en
  // memoria y un <a> huérfano en el DOM.
  enlace.remove();
  window.URL.revokeObjectURL(url);
};
