import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Empresas del grupo y su membrete (razón social, RUC, representante legal,
 * dirección, teléfono), para los certificados y el encabezado del acta de
 * dotación. Habla con /api/v1/rrhh/empresas.
 *
 * No hay crear/eliminar: las empresas del grupo son fijas, esto solo
 * completa su membrete (ver EditorEmpresas.jsx en Configuración).
 *
 * @typedef {Object} Empresa
 * @property {number} id
 * @property {string} nombre
 * @property {string|null} dominioCorreo
 * @property {boolean} activa
 * @property {string|null} razonSocial
 * @property {string|null} ruc
 * @property {string|null} representanteLegalNombre
 * @property {string|null} representanteLegalCargo
 * @property {string|null} direccion
 * @property {string|null} telefono
 */

const BASE = "/rrhh/empresas";

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

const mapearEmpresa = (empresa) => ({ ...empresa, id: numero(empresa.id) });

/** @returns {Promise<Empresa[]>} */
export const ObtenerEmpresas = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(BASE, { signal });
    return (desenvolver(respuesta) ?? []).map(mapearEmpresa);
  } catch (error) {
    return propagar(error, "No se pudo obtener las empresas");
  }
};

/** @returns {Promise<Empresa>} */
export const ActualizarMembreteEmpresa = async (empresaId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${BASE}/${empresaId}`, datos);
    return mapearEmpresa(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo actualizar el membrete de la empresa");
  }
};
