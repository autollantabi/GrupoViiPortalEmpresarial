import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Solicitudes de vacaciones/permisos y entrega de actividades al backup
 * (RRHH). Habla con /api/v1/rrhh/vacaciones. Archivo aparte de
 * colaboradoresService.js, mismo criterio que dotacionService.js: es otra
 * cosa, con su propio prefijo de rutas en el backend.
 *
 * Sin autoservicio: "decidir" (la firma del jefe inmediato) y "registrar"
 * (la caja de Talento Humano) los hace quien está usando esta pantalla de
 * RRHH, a partir de una decisión que llegó por fuera del sistema — nunca el
 * colaborador ni su jefe desde una cuenta propia.
 *
 * @typedef {Object} BackupSolicitud
 * @property {string} nombre
 * @property {string|null} cargo
 *
 * @typedef {Object} ActividadSolicitud
 * @property {string} actividad
 * @property {string|null} backupResponsable
 * @property {string|null} documentacionSoporte
 * @property {string|null} observaciones
 *
 * @typedef {Object} SolicitudVacaciones
 * @property {number} id
 * @property {number} empleadoId
 * @property {"Vacaciones"|"Permiso"} tipo
 * @property {string} fechaInicio
 * @property {string} fechaFin
 * @property {number} totalDias
 * @property {string|null} fechaReincorporacion
 * @property {string|null} fechaNotificacion
 * @property {string|null} observacion
 * @property {"Pendiente"|"Aprobada"|"Rechazada"} estado
 * @property {string|null} decididoPor
 * @property {string|null} fechaDecision
 * @property {string|null} motivoRechazo
 * @property {boolean} registradaEnSistema
 * @property {string|null} registradaPor
 * @property {string|null} registradaEn
 * @property {BackupSolicitud[]} backups
 * @property {ActividadSolicitud[]} actividades
 */

const BASE = "/rrhh/vacaciones";

const desenvolver = (respuesta) => respuesta?.data?.data ?? null;

const mensajeDeError = (error, porOmision) => {
  if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return null;
  return error?.response?.data?.message || error?.message || porOmision;
};

const propagar = (error, porOmision) => {
  const mensaje = mensajeDeError(error, porOmision);
  if (mensaje === null) throw error;
  throw new Error(mensaje);
};

const numero = (valor) => (valor === null || valor === undefined ? null : Number(valor));

const soloFecha = (valor) => (typeof valor === "string" ? valor.slice(0, 10) : valor ?? null);

const mapearSolicitud = (fila) => ({
  ...fila,
  id: numero(fila.id),
  empleadoId: numero(fila.empleadoId),
  totalDias: numero(fila.totalDias),
  fechaInicio: soloFecha(fila.fechaInicio),
  fechaFin: soloFecha(fila.fechaFin),
  fechaReincorporacion: soloFecha(fila.fechaReincorporacion),
  fechaNotificacion: soloFecha(fila.fechaNotificacion),
  fechaDecision: fila.fechaDecision,
  registradaEn: fila.registradaEn,
});

/** @returns {Promise<SolicitudVacaciones[]>} */
export const ListarSolicitudesVacaciones = async (empleadoId, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/empleados/${empleadoId}`, { signal });
    return (desenvolver(respuesta) ?? []).map(mapearSolicitud);
  } catch (error) {
    return propagar(error, "No se pudo obtener las solicitudes de vacaciones");
  }
};

/** @returns {Promise<SolicitudVacaciones>} */
export const CrearSolicitudVacaciones = async (empleadoId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/empleados/${empleadoId}`, datos);
    return mapearSolicitud(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo registrar la solicitud");
  }
};

/** @returns {Promise<SolicitudVacaciones>} */
export const ObtenerSolicitudVacaciones = async (id, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/${id}`, { signal });
    return mapearSolicitud(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo obtener la solicitud");
  }
};

/**
 * La decisión del jefe inmediato, registrada por RRHH.
 * @returns {Promise<SolicitudVacaciones>}
 */
export const DecidirSolicitudVacaciones = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${BASE}/${id}/decidir`, datos);
    return mapearSolicitud(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo registrar la decisión");
  }
};

/**
 * La caja "PARA USO EXCLUSIVO DE TALENTO HUMANO": solo sobre una Aprobada.
 * @returns {Promise<SolicitudVacaciones>}
 */
export const RegistrarSolicitudVacaciones = async (id) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${BASE}/${id}/registrar`, {});
    return mapearSolicitud(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo registrar la solicitud en el sistema");
  }
};

/** Solo mientras siga Pendiente. */
export const EliminarSolicitudVacaciones = async (id, datos) => {
  try {
    await axiosInstanceNew.delete(`${BASE}/${id}`, { data: datos });
  } catch (error) {
    propagar(error, "No se pudo eliminar la solicitud");
  }
};

/**
 * Banner del tablero: solicitudes Pendientes, la más antigua primero.
 * @returns {Promise<{id: number, empleadoId: number, nombresCompletos: string, tipo: string, fechaInicio: string}[]>}
 */
export const ObtenerVacacionesPendienteGlobal = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/pendientes`, { signal });
    return (desenvolver(respuesta) ?? []).map((fila) => ({
      ...fila,
      id: numero(fila.id),
      empleadoId: numero(fila.empleadoId),
      fechaInicio: soloFecha(fila.fechaInicio),
    }));
  } catch (error) {
    return propagar(error, "No se pudo obtener las solicitudes pendientes");
  }
};

/** Con responseType "blob" el error también llega como blob y hay que leerlo aparte. */
const leerErrorBlob = async (error) => {
  const datos = error?.response?.data;
  if (!(datos instanceof Blob)) return mensajeDeError(error, null);
  try {
    const texto = await datos.text();
    return JSON.parse(texto)?.message ?? null;
  } catch {
    return null;
  }
};

/**
 * El PDF de la solicitud, para mostrar en ModalVerActa.jsx — mismo patrón
 * que ObtenerUrlActaAsignacion/ObtenerUrlResumenPazSalvo: object URL de
 * blob, nunca un enlace directo. Quien llama es responsable de revocar la
 * URL al cerrar el modal.
 * @returns {Promise<string>}
 */
export const ObtenerUrlPdfSolicitudVacaciones = async (id) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/${id}/pdf`, { responseType: "blob" });
    const blob = new Blob([respuesta.data], { type: "application/pdf" });
    return window.URL.createObjectURL(blob);
  } catch (error) {
    const mensaje = await leerErrorBlob(error);
    throw new Error(mensaje || "No se pudo abrir el PDF de la solicitud");
  }
};
