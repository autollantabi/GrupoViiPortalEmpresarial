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
 * @property {string|null} nombreComercial
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

/**
 * Alinea id+nombre con dim_empresa (el catálogo real de empresas del Portal).
 * También corre sola al arrancar el backend; este botón es para no tener que
 * reiniciar el servidor cuando se agrega una empresa nueva y se la quiere ver
 * de inmediato en RRHH.
 * @returns {Promise<{sincronizadas: number}>}
 */
export const SincronizarEmpresas = async () => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/sincronizar`);
    return desenvolver(respuesta) ?? { sincronizadas: 0 };
  } catch (error) {
    return propagar(error, "No se pudo sincronizar las empresas");
  }
};

/**
 * Busca nombre comercial, dirección y teléfono en dim_socios por el RUC ya
 * guardado en la empresa (debe estar completo antes de llamar esto) y los
 * deja guardados, sobreescribiendo lo que hubiera. Representante legal queda
 * afuera: no existe en dim_socios, sigue siendo 100% manual.
 * @returns {Promise<Empresa>}
 */
export const AutocompletarMembreteDesdeDimSocios = async (empresaId) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/${empresaId}/autocompletar-desde-dim-socios`);
    return mapearEmpresa(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo autocompletar desde dim_socios");
  }
};
