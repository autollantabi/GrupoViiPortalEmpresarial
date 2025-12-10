import { axiosInstance } from "config/axiosConfig";
import { axiosInstanceNew } from "config/axiosConfig";

export async function ListarUsuarios() {
  const res = await axiosInstance.get(`/usuario/`);
  return res;
}

export async function EnviarCorreoRec(correo) {
  const res = await axiosInstance.get(
    `/correo/enviarcorreoRecuperacion/${correo}`
  );
  return res;
}

export async function UpdatePass(id, contrasena) {
  try {
    const res = await axiosInstance.post(`/usuario/upd/pss/${id}`, {
      contrasena: contrasena,
    });
    if (res.status === 200) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}
export async function ObtenerIDUsuario(correo) {
  try {
    const res = await axiosInstance.get(`/usuario/${correo}`);
    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (e) {
    return [];
  }
}

export async function GuardarNombreUsuario({ idUsuario, nombreUsuario }) {
  try {
    const res = await axiosInstance.post(
      `/usuario/update/Name/${idUsuario}/${nombreUsuario}/`
    );
    if (res.status === 200) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Obtiene todos los tipos de usuario
 * @returns {Promise<>}
 */
export async function userService_obtenerTodosLosTiposUsuario() {
  try {
    const response = await axiosInstanceNew.get(`/usuarios/tipoUsuario/`);
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || "Tipos de usuario obtenidos",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response.data.message || "Error al obtener los tipos de usuario",
    };
  }
}

/**
 * Crea un nuevo tipo de usuario
 * @param {string} nombre
 * @returns {Promise<boolean>}
 */
export async function userService_crearNuevoTipoUsuario(nombre) {
  try {
    const response = await axiosInstanceNew.post(`/usuarios/tipoUsuario/`, {
      TIPO_USUARIO: nombre,
    });
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || "Tipo de usuario creado",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response.data.message || "Error al crear el tipo de usuario",
    };
  }
}

/**
 * Actualiza un tipo de usuario
 * @param {string} id
 * @param {string} nombre
 * @returns {Promise<boolean>}
 */
export async function userService_actualizarTipoUsuario(id, nombre) {
  try {
    const response = await axiosInstanceNew.put(`/usuarios/tipoUsuario/${id}`, {
      TIPO_USUARIO: nombre,
    });
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || "Tipo de usuario actualizado",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response.data.message || "Error al actualizar el tipo de usuario",
    };
  }
}

/**
 * Elimina un tipo de usuario
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function userService_eliminarTipoUsuario(id) {
  try {
    const response = await axiosInstanceNew.delete(
      `/usuarios/tipoUsuario/${id}`
    );
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || "Tipo de usuario eliminado",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response.data.message || "Error al eliminar el tipo de usuario",
    };
  }
}

/**
 * Obtiene el tipo de usuario de un usuario
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function userService_obtenerTipoUsuarioByIdUsuario(userId) {
  try {
    const response = await axiosInstanceNew.get(
      `/usuarios/usuarioTipoUsuario/usuario/${userId}`
    );
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || "Usuario encontrado",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response.data.message || "Error al obtener el tipo de usuario",
    };
  }
}

/**
 * Asigna un tipo de usuario a un usuario
 * @param {string} userId
 * @param {string} tipoUsuarioId
 * @returns {Promise<boolean>}
 */
export async function userService_asignarTipoUsuario(userId, tipoUsuarioId) {
  try {
    const response = await axiosInstanceNew.post(
      `/usuarios/usuarioTipoUsuario/`,
      {
        usuario_id: userId,
        tipo_usuario_id: tipoUsuarioId,
      }
    );
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || "Tipo de usuario asignado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response.data.message || "Error al asignar el tipo de usuario",
    };
  }
}

/**
 * Obtener todas las relaciones usario-tipo usuario
 * @returns {Promise<boolean>}
 */
export async function userService_obtenerTodasLasRelacionesUsuarioTipoUsuario() {
  try {
    const response = await axiosInstanceNew.get(
      `/usuarios/usuarioTipoUsuario/`
    );
    return {
      success: true,
      data: response.data.data || response.data,
      message:
        response.data.message || "Relaciones usuario-tipo usuario obtenidas",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response.data.message ||
        "Error al obtener las relaciones usuario-tipo usuario",
    };
  }
}

/**
 * Eliminar una relación usuario-tipo usuario
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function userService_eliminarRelacionUsuarioTipoUsuario(id) {
  try {
    const response = await axiosInstanceNew.delete(
      `/usuarios/usuarioTipoUsuario/${id}`
    );
    return {
      success: true,
      data: response.data.data || response.data,
      message:
        response.data.message || "Relacion usuario-tipo usuario eliminada",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response.data.message ||
        "Error al eliminar la relacion usuario-tipo usuario",
    };
  }
}
