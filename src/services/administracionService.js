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
    console.log(err);
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
    // console.log(resp);

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
