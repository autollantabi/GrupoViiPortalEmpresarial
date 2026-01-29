import { axiosInstance, axiosInstanceNew } from "config/axiosConfig";

// -------------------------- Registro usuario ----------------------------

export const adminstracionService_crearUsuario = async ({
  correo,
  contrasena,
  nombre,
}) => {
  try {
    const resp = await axiosInstanceNew.post(`/usuarios/`, {
      correo,
      contrasena,
      nombre,
    });
    return {
      success: true,
      data: resp.data.data || resp.data,
      message: resp.data.message || "Usuario creado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response.data.message || "Error al crear el usuario",
    };
  }
};

// -------------------- Modificar Usuarios --------------------

export async function BloquearDesbloquearUsuario({
  usuario,
  estado,
  actualizar,
}) {
  try {
    const res = await axiosInstance.post(
      `/usuario/datos/estado/${usuario}/${estado}`
    );
    if (res.status === 200) {
      if (res.data[0].RESULTADO === "ACTUALIZADO") {
        actualizar();
      }
    }

    // return false;
  } catch (err) {
    // return err;
  }
}

export const ListarModulos = async () => {
  try {
    const resp = await axiosInstance.get(`/modulo/`);
    if (resp.status === 200) {
      return resp.data;
    }

    return [];
  } catch (err) {
    return [];
  }
};
export const ListarPermisosUsuario = async ({ idUsuario }) => {
  try {
    const resp = await axiosInstance.get(
      `/rol/obtenerPermisos/${parseInt(idUsuario)}/`
    );
    if (resp.status === 200) {
      return resp.data;
    }

    return [];
  } catch (err) {
    return [];
  }
};
export const AgregarModulo = async ({ data }) => {
  try {
    const resp = await axiosInstance.post(`/modulo/insertar/Modulo/`, data);
    if (resp.status === 200) {
      return true;
    }

    return [];
  } catch (err) {
    return [];
  }
};
export const EliminarModulo = async ({ data }) => {
  try {
    const resp = await axiosInstance.post(`/modulo/eliminar/Modulo/`, data);

    if (resp.status === 200) {
      return resp.data.exito;
    }

    return false;
  } catch (err) {
    return false;
  }
};

export const UpdatePermisoUsuario = async ({ data }) => {
  try {
    const resp = await axiosInstance.post(`/rol/permisosRolUsuario/`, data);

    if (resp.status === 201) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
};

export const DeletePermisoUsuario = async ({ data }) => {
  try {
    const resp = await axiosInstance.post(`/rol/eliminarRolUsuario/`, data);

    if (resp.status === 201) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
};

// ----------------------  GENERAL ---------------------

export const ListarUsuariosSistema = async () => {
  try {
    const resp = await axiosInstance.get(`/usuario/`);
    if (resp.status === 200) {
      return resp.data;
    }

    return [];
  } catch (err) {
    return [];
  }
};

export async function ListarEmpresasAdmin() {
  try {
    const res = await axiosInstance.get(`/empresas`);
    if (res.status === 200) {
      const resp = res.data.map((item) => {
        return { ID: item.empr_id, NOMBRE: item.empr_nombre };
      });
      return resp;
    }
    return [];
  } catch (e) {
    return [];
  }
}

// ----------------------  PERMISOS ---------------------

export const ListarPermisos = async () => {
  try {
    const resp = await axiosInstanceNew.get(`/permisos`);
    if (resp.status === 200) {
      return {
        success: true,
        data: resp.data.data || resp.data,
      };
    }
    return { success: false, data: [] };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || "Error al listar permisos",
    };
  }
};

export const CrearPermiso = async ({ NOMBRE_ACCION }) => {
  try {
    const resp = await axiosInstanceNew.post(`/permisos`, {
      NOMBRE_ACCION,
    });
    return {
      success: true,
      data: resp.data.data || resp.data,
      message: resp.data.message || "Permiso creado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Error al crear el permiso",
    };
  }
};

export const ActualizarPermiso = async ({ id, NOMBRE_ACCION }) => {
  try {
    const resp = await axiosInstanceNew.put(`/permisos/${id}`, {
      NOMBRE_ACCION,
    });
    return {
      success: true,
      data: resp.data.data || resp.data,
      message: resp.data.message || "Permiso actualizado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Error al actualizar el permiso",
    };
  }
};

// ----------------------  ROLES ---------------------

export const ListarRoles = async () => {
  try {
    const resp = await axiosInstanceNew.get(`/roles`);
    if (resp.status === 200) {
      return {
        success: true,
        data: resp.data.data || resp.data,
      };
    }
    return { success: false, data: [] };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || "Error al listar roles",
    };
  }
};

export const CrearRol = async ({ NOMBRE_ROL }) => {
  try {
    const resp = await axiosInstanceNew.post(`/roles`, {
      NOMBRE_ROL,
    });
    return {
      success: true,
      data: resp.data.data || resp.data,
      message: resp.data.message || "Rol creado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Error al crear el rol",
    };
  }
};

export const ActualizarRol = async ({ id, NOMBRE_ROL }) => {
  try {
    const resp = await axiosInstanceNew.put(`/roles/${id}`, {
      NOMBRE_ROL,
    });
    return {
      success: true,
      data: resp.data.data || resp.data,
      message: resp.data.message || "Rol actualizado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Error al actualizar el rol",
    };
  }
};

// ----------------------  PERMISOS-ROL ---------------------

export const ListarPermisosRol = async () => {
  try {
    const resp = await axiosInstanceNew.get(`/permisos-rol`);
    if (resp.status === 200) {
      return {
        success: true,
        data: resp.data.data || resp.data,
      };
    }
    return { success: false, data: [] };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || "Error al listar permisos-rol",
    };
  }
};

export const CrearPermisoRol = async ({ ID_ROL, ID_PERMISO }) => {
  try {
    const resp = await axiosInstanceNew.post(`/permisos-rol`, {
      ID_ROL,
      ID_PERMISO,
    });
    return {
      success: true,
      data: resp.data.data || resp.data,
      message: resp.data.message || "Relación creada exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Error al crear la relación",
    };
  }
};

export const EliminarPermisoRol = async ({ id }) => {
  try {
    const resp = await axiosInstanceNew.delete(`/permisos-rol/${id}`);
    return {
      success: true,
      message: resp.data.message || "Relación eliminada exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Error al eliminar la relación",
    };
  }
};

// ----------------------  USUARIOS-ROL-CONTEXTO ---------------------

export const ListarUsuariosRolContexto = async () => {
  try {
    const resp = await axiosInstanceNew.get(`/usuarios-rol-contexto`);
    if (resp.status === 200) {
      return {
        success: true,
        data: resp.data.data || resp.data,
      };
    }
    return { success: false, data: [] };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || "Error al listar usuarios-rol-contexto",
    };
  }
};

export const CrearUsuarioRolContexto = async (data) => {
  try {
    const resp = await axiosInstanceNew.post(`/usuarios-rol-contexto`, data);
    return {
      success: true,
      data: resp.data.data || resp.data,
      message: resp.data.message || "Usuario-rol-contexto creado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Error al crear el usuario-rol-contexto",
    };
  }
};

export const ActualizarUsuarioRolContexto = async ({ id, ...data }) => {
  try {
    const resp = await axiosInstanceNew.patch(`/usuarios-rol-contexto/${id}`, data);
    return {
      success: true,
      data: resp.data.data || resp.data,
      message: resp.data.message || "Usuario-rol-contexto actualizado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Error al actualizar el usuario-rol-contexto",
    };
  }
};

export const EliminarUsuarioRolContexto = async ({ id }) => {
  try {
    const resp = await axiosInstanceNew.delete(`/usuarios-rol-contexto/${id}`);
    return {
      success: true,
      data: resp.data.data || resp.data,
      message: resp.data.message || "Usuario-rol-contexto eliminado exitosamente",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Error al eliminar el usuario-rol-contexto",
    };
  }
};