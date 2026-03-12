import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Obtiene todos los canjes de XCoin.
 * @returns {Promise<{success: boolean, data: Array, message: string}>}
 */
export async function ListarXCoinCanjes() {
  try {
    const res = await axiosInstanceNew.get(`/x-coin/canjes`);
    return {
      success: true,
      data: res.data?.data || res.data || [],
      message: res.data?.message || "Canjes obtenidos exitosamente",
    };
  } catch (e) {
    console.error("Error al listar canjes de XCoin:", e);
    return {
      success: false,
      data: [],
      message: e.response?.data?.message || "Error al cargar los canjes",
    };
  }
}

/**
 * Obtiene los estados de los canjes de XCoin.
 * @returns {Promise<{success: boolean, data: Array, message: string}>}
 */
export async function ListarXCoinEstadosCanjes() {
  try {
    const res = await axiosInstanceNew.get(`/x-coin/canjes/estados`);
    return {
      success: true,
      data: res.data?.data || res.data || [],
      message: res.data?.message || "Estados obtenidos exitosamente",
    };
  } catch (e) {
    console.error("Error al listar estados de canjes:", e);
    return {
      success: false,
      data: [],
      message: e.response?.data?.message || "Error al cargar los estados",
    };
  }
}

/**
 * Actualiza el estado de un canje de XCoin.
 * @param {string|number} idCanje - ID del canje a actualizar.
 * @param {Object} estadoData - Datos del nuevo estado.
 * @returns {Promise<{success: boolean, data: Object, message: string}>}
 */
export async function ActualizarXCoinEstadoCanje(idCanje, estadoData) {
  try {
    const res = await axiosInstanceNew.patch(`/x-coin/canjes/estado/${idCanje}`, estadoData);
    return {
      success: true,
      data: res.data?.data || res.data || null,
      message: res.data?.message || "Estado del canje actualizado exitosamente",
    };
  } catch (e) {
    console.error(`Error al actualizar estado del canje ${idCanje}:`, e);
    return {
      success: false,
      data: null,
      message: e.response?.data?.message || "Error al actualizar el estado del canje",
    };
  }
}
