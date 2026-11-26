import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Catálogo de tipos de permiso y solicitudes de permiso (ausencias por horas
 * o por rango de días) de cada colaborador. Habla con /api/v1/rrhh/permisos.
 * Archivo aparte de colaboradoresService.js, mismo criterio que
 * vacacionesService.js: es otra cosa, con su propio prefijo de rutas.
 *
 * Sin autoservicio: RRHH registra directamente el estado (Pendiente/
 * Aprobada/Rechazada) a partir de lo que pasó por fuera del sistema. No hay
 * un endpoint "decidir" aparte: el estado se fija al crear o editar.
 *
 * @typedef {Object} TipoPermiso
 * @property {number} id
 * @property {string} codigo
 * @property {string} nombre
 * @property {string|null} descripcion
 * @property {number} orden
 * @property {boolean} activo
 *
 * @typedef {Object} SolicitudPermiso
 * @property {number} id
 * @property {number} empleadoId
 * @property {number} tipoPermisoId
 * @property {string} tipoPermiso
 * @property {string} fechaInicio
 * @property {string|null} horaInicio
 * @property {string} fechaFin
 * @property {string|null} horaFin
 * @property {string} motivo
 * @property {"Pendiente"|"Aprobada"|"Rechazada"} estado
 * @property {string|null} decididoPor
 * @property {string|null} fechaDecision
 * @property {string|null} motivoRechazo
 */

const BASE = "/rrhh/permisos";

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

// ── Catálogo de tipos ────────────────────────────────────────────────────────

const mapearTipo = (fila) => ({ ...fila, id: numero(fila.id) });

/** @returns {Promise<TipoPermiso[]>} */
export const ListarTiposPermiso = async ({ soloActivos, signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/tipos`, {
      params: soloActivos ? { soloActivos: "true" } : undefined,
      signal,
    });
    return (desenvolver(respuesta) ?? []).map(mapearTipo);
  } catch (error) {
    return propagar(error, "No se pudo obtener los tipos de permiso");
  }
};

/** @returns {Promise<TipoPermiso>} */
export const CrearTipoPermiso = async (datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/tipos`, datos);
    return mapearTipo(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo crear el tipo de permiso");
  }
};

/** @returns {Promise<TipoPermiso>} */
export const ActualizarTipoPermiso = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${BASE}/tipos/${id}`, datos);
    return mapearTipo(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo actualizar el tipo de permiso");
  }
};

export const EliminarTipoPermiso = async (id) => {
  try {
    await axiosInstanceNew.delete(`${BASE}/tipos/${id}`);
  } catch (error) {
    propagar(error, "No se pudo eliminar el tipo de permiso");
  }
};

// ── Solicitudes ──────────────────────────────────────────────────────────────

const mapearSolicitud = (fila) => ({
  ...fila,
  id: numero(fila.id),
  empleadoId: numero(fila.empleadoId),
  tipoPermisoId: numero(fila.tipoPermisoId),
  fechaInicio: soloFecha(fila.fechaInicio),
  fechaFin: soloFecha(fila.fechaFin),
  fechaDecision: fila.fechaDecision,
});

/** @returns {Promise<SolicitudPermiso[]>} */
export const ListarSolicitudesPermiso = async (empleadoId, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/empleados/${empleadoId}`, { signal });
    return (desenvolver(respuesta) ?? []).map(mapearSolicitud);
  } catch (error) {
    return propagar(error, "No se pudo obtener las solicitudes de permiso");
  }
};

/** @returns {Promise<SolicitudPermiso>} */
export const CrearSolicitudPermiso = async (empleadoId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/empleados/${empleadoId}`, datos);
    return mapearSolicitud(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo registrar la solicitud de permiso");
  }
};

/** @returns {Promise<SolicitudPermiso>} */
export const ObtenerSolicitudPermiso = async (id, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/${id}`, { signal });
    return mapearSolicitud(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo obtener la solicitud de permiso");
  }
};

/** @returns {Promise<SolicitudPermiso>} */
export const ActualizarSolicitudPermiso = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${BASE}/${id}`, datos);
    return mapearSolicitud(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo actualizar la solicitud de permiso");
  }
};

export const EliminarSolicitudPermiso = async (id) => {
  try {
    await axiosInstanceNew.delete(`${BASE}/${id}`);
  } catch (error) {
    propagar(error, "No se pudo eliminar la solicitud de permiso");
  }
};

/**
 * Banner del tablero: solicitudes Pendientes, la más antigua primero.
 * @returns {Promise<{id: number, empleadoId: number, nombresCompletos: string, tipoPermiso: string, fechaInicio: string}[]>}
 */
export const ObtenerPermisosPendienteGlobal = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/pendientes`, { signal });
    return (desenvolver(respuesta) ?? []).map((fila) => ({
      ...fila,
      id: numero(fila.id),
      empleadoId: numero(fila.empleadoId),
      fechaInicio: soloFecha(fila.fechaInicio),
    }));
  } catch (error) {
    return propagar(error, "No se pudo obtener los permisos pendientes");
  }
};
