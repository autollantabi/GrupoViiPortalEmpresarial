import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Obtener los estados de canjes existentes para la sección de canjes
 * @returns {Promise<Object>} { success, data: [{ ID, NAME, createdAt, updatedAt }], message }
 */
export async function appShellService_obtenerEstadosCanjes() {
  try {
    const response = await axiosInstanceNew.get(`/club-shell-maxx/canjes/estados-canjes`);
    console.log(response);
    return {
      success: true,
      data: response.data?.data?.data ?? response.data.data ?? response.data,
      message: response.data.message || "Estados de canjes obtenidos",
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message:
        error.response?.data?.message || "Error al obtener los estados de canjes",
    };
  }
}

/**
 * Obtener todos los canjes con sus estados (historial)
 * @returns {Promise<Object>} { success, data: canjes[], message }
 */
export async function appShellService_obtenerCanjesConEstados() {
  try {
    const response = await axiosInstanceNew.get(`/club-shell-maxx/canjes/todos-con-estados`);
    console.log(response);
    const raw = response.data?.data?.data ?? response.data?.data ?? response.data;
    const canjes = raw?.canjes ?? raw ?? [];
    return {
      success: true,
      data: Array.isArray(canjes) ? canjes : [],
      message: response.data?.message || "Canjes obtenidos",
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message:
        error.response?.data?.message || "Error al obtener los canjes",
    };
  }
}

/**
 * Actualizar el estado de un canje (agregar entrada al historial)
 * @param {number} canjeId - ID del canje
 * @param {number} estadoId - ID del nuevo estado
 * @returns {Promise<Object>} { success, data, message }
 */
export async function appShellService_actualizarEstadoCanje(canjeId, estadoId) {
  try {
    const response = await axiosInstanceNew.post(`/club-shell-maxx/canjes/estado-historial-canje`, {
      canjeId,
      estadoId,
    });
    return {
      success: true,
      data: response.data.data ?? response.data,
      message: response.data.message || "Estado del canje actualizado",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message:
        error.response?.data?.message || "Error al actualizar el estado del canje",
    };
  }
}

/**
 * Obtener todos los usuarios del app shell
 * @returns {Promise<Object>} Respuesta de la API
 */
export async function appShellService_obtenerUsuarios() {
  try {
    const response = await axiosInstanceNew.get(`/club-shell-maxx/usuarios`);
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
 * Obtener lista de usuarios con info (endpoint /club-shell-maxx/usuarios/info)
 * @returns {Promise<Object>} { success, data: usuarios[], message }
 */
export async function appShellService_obtenerUsuariosInfo() {
  try {
    const response = await axiosInstanceNew.get(`/club-shell-maxx/usuarios/info`);
    const raw = response.data?.data ?? response.data;
    const list = Array.isArray(raw) ? raw : raw?.users ?? raw?.data ?? [];
    return {
      success: true,
      data: Array.isArray(list) ? list : [],
      message: response.data?.message || "Usuarios obtenidos",
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message:
        error.response?.data?.message || "Error al obtener los usuarios",
    };
  }
}

/**
 * Obtener usuarios del portal mayorista (lista para habilitar sección)
 * GET /portal-mayorista/usuarios
 * @returns {Promise<Object>} { success, data: [{ ID_USER, NAME_USER, EMAIL, ACCESS_APP_SHELL, ... }], message }
 */
export async function appShellService_obtenerUsuariosPortalMayorista() {
  try {
    const response = await axiosInstanceNew.get(`/portal-mayorista/usuarios`);
    const raw = response.data?.data ?? response.data;
    const list = Array.isArray(raw) ? raw : [];
    return {
      success: true,
      data: list,
      message: response.data?.message || "Usuarios obtenidos",
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message:
        error.response?.data?.message || "Error al obtener los usuarios",
    };
  }
}

/**
 * Habilitar la sección (App Shell) para un usuario por email (portal mayorista)
 * POST /portal-mayorista/usuarios-permitidos/app-shell
 * @param {string} email - Email del usuario
 * @returns {Promise<Object>} { success, data, message }
 */
export async function appShellService_habilitarSeccionUsuario(email) {
  try {
    const response = await axiosInstanceNew.post(
      `/portal-mayorista/usuarios-permitidos/app-shell`,
      { email }
    );
    return {
      success: true,
      data: response.data?.data ?? response.data,
      message: response.data?.message || "Sección habilitada correctamente",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message:
        error.response?.data?.message || "Error al habilitar la sección para el usuario",
    };
  }
}

/**
 * Quitar el permiso de App Shell a un usuario por email (portal mayorista)
 * DELETE /portal-mayorista/usuarios-permitidos/app-shell/{email}
 * @param {string} email - Email del usuario
 * @returns {Promise<Object>} { success, data, message }
 */
export async function appShellService_quitarPermisoSeccionUsuario(email) {
  try {
    const emailEncoded = encodeURIComponent(email);
    const response = await axiosInstanceNew.delete(
      `/portal-mayorista/usuarios-permitidos/app-shell/${emailEncoded}`
    );
    return {
      success: true,
      data: response.data?.data ?? response.data,
      message: response.data?.message || "Permiso quitado correctamente",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message:
        error.response?.data?.message || "Error al quitar el permiso al usuario",
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

      const response = await axiosInstanceNew.post(
      `/club-shell-maxx/usuarios`,
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
