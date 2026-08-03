import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Obtiene los clientes enrutados de una empresa.
 * La cabecera "id-session" la agrega automáticamente axiosInstanceNew (setAxiosIdSession).
 * @param {string} empresa - Nombre de la empresa (AUTOLLANTA, MAXXIMUNDO, STOX, IKONIX, AUTOMAX)
 * @returns {Promise<Array>} Lista de clientes enrutados (array vacío si no hay datos)
 * @throws {Error} Propaga el error de red/servidor para que la vista pueda diferenciar
 *                 "sin datos" de "fallo en la consulta".
 */
export const ListarClientesEnrutados = async (empresa) => {
  const response = await axiosInstanceNew.get(`/clientes-enrutados/${empresa}`);

  if (response.data && response.data.status === "Ok!") {
    return response.data.data || [];
  }

  return [];
};
