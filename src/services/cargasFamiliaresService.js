import { axiosInstanceNew } from "config/axiosConfig";
import { soloFecha } from "pages/Areas/RRHH/Colaboradores/utils/fechas";

/**
 * Cargas familiares de colaboradores (RRHH).
 *
 * Habla con /api/v1/rrhh/cargas-familiares. Archivo aparte de dotacionService.js
 * y colaboradoresService.js por el mismo criterio que separa esos dos: es otro
 * recurso del backend con su propio ciclo de vida (alta, edición, baja con
 * motivo y un archivo propio, la partida de nacimiento).
 *
 * Mismas convenciones que dotacionService.js, y por las mismas razones:
 *  - Es el ÚNICO sitio donde se desenvuelve { status, message, data }.
 *  - Los id se pasan por Number(): el driver del backend entrega los BIGINT como
 *    texto y un === del front fallaría en silencio.
 *  - Las fechas de negocio se recortan a AAAA-MM-DD: un <input type="date">
 *    rechaza un datetime sin avisar, el campo aparece vacío y guardar borraría la
 *    fecha.
 *
 * @typedef {Object} CargaFamiliar
 * @property {number} id
 * @property {string|null} cedula
 * @property {string} apellidos
 * @property {string} nombres
 * @property {string} nombresCompletos
 * @property {string} fechaNacimiento
 * @property {boolean} tieneDiscapacidad
 * @property {number|null} porcentajeDiscapacidad
 * @property {string|null} tipoDiscapacidad
 * @property {boolean} esBeneficiarioImpuestoRenta
 * @property {string|null} observacion
 * @property {ArchivoCargaFamiliar|null} archivo  Nulo si aún no se ha subido la partida
 * @property {number} edadAlCierreAnio  Edad que cumple o cumplió el 31 de diciembre del año consultado
 * @property {boolean} elegibleImpuestoRenta  Puede diferir de esBeneficiarioImpuestoRenta si ya cumplió 18/21 años
 * @property {boolean} elegibleUtilidades
 */

const BASE = "/rrhh/cargas-familiares";

const desenvolver = (respuesta) => respuesta?.data?.data ?? null;

const mensajeDeError = (error, porOmision) => {
  if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return null;
  return error?.response?.data?.message || error?.message || porOmision;
};

const propagar = (error, porOmision) => {
  const mensaje = mensajeDeError(error, porOmision);
  if (mensaje === null) throw error; // Cancelación: la maneja el hook.
  throw new Error(mensaje);
};

const numero = (valor) => (valor === null || valor === undefined ? null : Number(valor));

/** Los filtros vacíos no se mandan, para no ensuciar la query string. */
const soloConValor = (filtros = {}) => {
  const params = {};
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") params[clave] = valor;
  });
  return params;
};

const mapearCarga = (carga) => ({
  ...carga,
  id: numero(carga.id),
  fechaNacimiento: soloFecha(carga.fechaNacimiento),
  porcentajeDiscapacidad: numero(carga.porcentajeDiscapacidad),
  edadAlCierreAnio: numero(carga.edadAlCierreAnio),
  tieneDiscapacidad: carga.tieneDiscapacidad === true,
  esBeneficiarioImpuestoRenta: carga.esBeneficiarioImpuestoRenta === true,
  elegibleImpuestoRenta: carga.elegibleImpuestoRenta === true,
  elegibleUtilidades: carga.elegibleUtilidades === true,
});

/**
 * Lista las cargas familiares de un colaborador para un año dado.
 * @param {number|string} empleadoId
 * @param {{anio?: number|string, signal?: AbortSignal}} [opciones]
 * @returns {Promise<CargaFamiliar[]>}
 */
export const ObtenerCargasFamiliares = async (empleadoId, { anio, signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/empleados/${empleadoId}`, {
      params: soloConValor({ anio }),
      signal,
    });
    return (desenvolver(respuesta) ?? []).map(mapearCarga);
  } catch (error) {
    return propagar(error, "No se pudo obtener las cargas familiares");
  }
};

/** @returns {Promise<CargaFamiliar>} */
export const CrearCargaFamiliar = async (empleadoId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/empleados/${empleadoId}`, datos);
    const carga = desenvolver(respuesta);
    return carga ? mapearCarga(carga) : null;
  } catch (error) {
    return propagar(error, "No se pudo crear la carga familiar");
  }
};

/** @returns {Promise<CargaFamiliar>} */
export const ActualizarCargaFamiliar = async (cargaId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${BASE}/${cargaId}`, datos);
    const carga = desenvolver(respuesta);
    return carga ? mapearCarga(carga) : null;
  } catch (error) {
    return propagar(error, "No se pudo actualizar la carga familiar");
  }
};

/**
 * Elimina una carga familiar.
 *
 * OJO: el cuerpo va en la clave `data`. En un DELETE de axios, un segundo
 * argumento plano se interpreta como config y el cuerpo se pierde, con lo que el
 * back respondería 400 por falta de motivo.
 * @param {number|string} cargaId
 * @param {string} motivo
 */
export const EliminarCargaFamiliar = async (cargaId, motivo) => {
  try {
    await axiosInstanceNew.delete(`${BASE}/${cargaId}`, { data: { motivo } });
  } catch (error) {
    propagar(error, "No se pudo eliminar la carga familiar");
  }
};

/**
 * Sube o reemplaza el archivo de la partida de nacimiento.
 *
 * OJO: NO se fija Content-Type a mano. Axios lo pone con el boundary que genera
 * FormData; escribirlo aparte deja el boundary fuera y el backend recibe un
 * multipart que no puede parsear.
 * @returns {Promise<CargaFamiliar>}
 */
export const SubirArchivoCarga = async (cargaId, archivo) => {
  try {
    const cuerpo = new FormData();
    cuerpo.append("archivo", archivo);

    const respuesta = await axiosInstanceNew.post(`${BASE}/${cargaId}/archivo`, cuerpo);
    const carga = desenvolver(respuesta);
    return carga ? mapearCarga(carga) : null;
  } catch (error) {
    return propagar(error, "No se pudo subir el archivo");
  }
};

/**
 * Descarga la partida de nacimiento y dispara el guardado en el navegador.
 *
 * Va por blob y no por un enlace directo porque el objeto NO es público: la
 * descarga pasa por el API, que verifica el permiso con la cabecera id-session
 * que agrega axiosInstanceNew. Un <a href> no llevaría esa cabecera.
 *
 * El object URL se revoca siempre: sin eso el blob queda en memoria hasta
 * recargar la página.
 * @param {number|string} cargaId
 * @param {string|null} [nombreSugerido]
 */
export const DescargarArchivoCarga = async (cargaId, nombreSugerido) => {
  let url = null;

  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/${cargaId}/archivo`, {
      responseType: "blob",
    });

    url = window.URL.createObjectURL(respuesta.data);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreSugerido || `partida-nacimiento-${cargaId}`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  } catch (error) {
    // Con responseType blob, el JSON de error también llega como blob, así que el
    // message del backend no está en error.response.data: hay que leerlo.
    const mensaje = await leerErrorBlob(error);
    throw new Error(mensaje || "No se pudo descargar el archivo");
  } finally {
    if (url) window.URL.revokeObjectURL(url);
  }
};

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
