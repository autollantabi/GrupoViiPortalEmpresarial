import { axiosInstance } from "config/axiosConfig";

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
