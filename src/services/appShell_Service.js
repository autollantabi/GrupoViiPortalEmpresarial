import { axiosInstanceAppShell } from "config/axiosConfig";

/**
 * Obtener todos los usuarios del app shell
 * @returns {Promise<Object>} Respuesta de la API
 */
export async function appShellService_obtenerUsuarios() {
  try {
    const response = await axiosInstanceAppShell.get(`/usuarios/`);
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || "Usuarios obtenidos exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Error al obtener los usuarios",
    };
  }
}

/**
 * Crear un nuevo vendedor en el app shell
 * @param {Object} vendedorData - Datos del vendedor a crear
 * @returns {Promise<Object>} Respuesta de la API
 */
export async function appShellService_crearVendedor(vendedorData) {
  try {
    const dataToSend = {
      name: vendedorData.name,
      lastname: vendedorData.lastname,
      card_id: vendedorData.card_id,
      email: vendedorData.email,
      phone: vendedorData.phone,
      roleId: vendedorData.roleId || 2,
      birth_date: vendedorData.birth_date
        ? new Date(vendedorData.birth_date).toISOString().split("T")[0]
        : null,
    };

    const response = await axiosInstanceAppShell.post(
      `/usuarios/`,
      dataToSend
    );

    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || "Vendedor creado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Error al crear el vendedor en el app shell",
    };
  }
}
