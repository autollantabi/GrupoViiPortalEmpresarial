import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Certificados laborales y de paz y salvo (RRHH).
 *
 * Habla con /api/v1/rrhh/certificados. Mismas convenciones que
 * cargasFamiliaresService.js: desenvuelve { status, message, data }, castea
 * ids con Number() porque el backend los entrega como texto (BIGINT), y
 * descarga el PDF por blob (ver ObtenerUrlCertificado) por la misma razón que
 * ObtenerUrlActaAsignacion en dotacionService.js: la ruta exige la cabecera
 * id-session que solo pone axiosInstanceNew, y un enlace directo no la manda.
 *
 * @typedef {Object} CertificadoEmitido
 * @property {number} id
 * @property {number} empleadoId
 * @property {'Trabajo'|'Ingresos'|'Antiguedad'|'PazYSalvo'} tipo
 * @property {number|null} movimientoId
 * @property {string|null} destino
 * @property {number|null} montoDeclarado
 * @property {string|null} observacion
 * @property {string} emitidoPor
 * @property {string} emitidoEn
 */

const BASE = "/rrhh/certificados";

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

const mapearCertificado = (certificado) => ({
  ...certificado,
  id: numero(certificado.id),
  empleadoId: numero(certificado.empleadoId),
  movimientoId: numero(certificado.movimientoId),
  montoDeclarado: numero(certificado.montoDeclarado),
});

/** @returns {Promise<CertificadoEmitido[]>} */
export const ObtenerCertificadosEmpleado = async (empleadoId, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/empleados/${empleadoId}`, { signal });
    return (desenvolver(respuesta) ?? []).map(mapearCertificado);
  } catch (error) {
    return propagar(error, "No se pudo obtener el historial de certificados");
  }
};

/** @returns {Promise<CertificadoEmitido>} */
export const EmitirCertificadoTrabajo = async (empleadoId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/empleados/${empleadoId}/trabajo`, datos);
    return mapearCertificado(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo emitir el certificado de trabajo");
  }
};

/** @returns {Promise<CertificadoEmitido>} */
export const EmitirCertificadoIngresos = async (empleadoId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/empleados/${empleadoId}/ingresos`, datos);
    return mapearCertificado(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo emitir el certificado de ingresos");
  }
};

/** @returns {Promise<CertificadoEmitido>} */
export const EmitirCertificadoAntiguedad = async (empleadoId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/empleados/${empleadoId}/antiguedad`, datos);
    return mapearCertificado(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo emitir el certificado de antigüedad");
  }
};

/** @returns {Promise<CertificadoEmitido>} */
export const EmitirCertificadoPazSalvo = async (empleadoId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/empleados/${empleadoId}/paz-salvo`, datos);
    return mapearCertificado(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo emitir el certificado de paz y salvo");
  }
};

/**
 * Descarga el certificado y arma un object URL para mostrarlo en un
 * <iframe>, dentro del mismo ModalVerActa.jsx que ya usa Dotación.
 *
 * Quien llama es responsable de revocar el object URL al cerrar el modal.
 */
export const ObtenerUrlCertificado = async (certificadoId) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/${certificadoId}/archivo`, {
      responseType: "blob",
    });
    const blob = new Blob([respuesta.data], { type: "application/pdf" });
    return window.URL.createObjectURL(blob);
  } catch (error) {
    const mensaje = await leerErrorBlob(error);
    throw new Error(mensaje || "No se pudo abrir el certificado");
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
