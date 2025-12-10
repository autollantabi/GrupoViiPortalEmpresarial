import { axiosInstancePortalMayorista } from "config/axiosConfig";

/**
 * Obtener todos los usuarios del portal mayorista
 * @returns {Promise<Object>} Respuesta de la API
 */
export async function portalMayoristaService_obtenerUsuarios() {
  try {
    
    const response = await axiosInstancePortalMayorista.get(`/usuarios/`);
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
 * Crear un nuevo vendedor en el portal mayorista
 * @param {Object} vendedorData - Datos del vendedor a crear
 * @param {string} vendedorData.name - Nombre del vendedor
 * @param {string} vendedorData.lastname - Apellido del vendedor
 * @param {string} vendedorData.card_id - Cédula del vendedor
 * @param {string} vendedorData.email - Email del vendedor
 * @param {string} vendedorData.phone - Teléfono del vendedor (debe incluir +)
 * @param {number} vendedorData.roleId - ID del rol (siempre 2)
 * @param {Date} vendedorData.birth_date - Fecha de nacimiento
 * @returns {Promise<Object>} Respuesta de la API
 */
export async function portalMayoristaService_crearVendedor(vendedorData) {
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

    const response = await axiosInstancePortalMayorista.post(
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
        "Error al crear el vendedor en el portal mayorista",
    };
  }
}
