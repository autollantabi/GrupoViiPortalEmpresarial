import { axiosInstance } from "config/axiosConfig";

export async function RegistrarToken(correo, token, expires) {
  await axiosInstance.post(`/recovery/token/${correo}`, {
    token: token,
    expires: expires,
  });
}

export async function ObtenerTokenVal(correo) {
  const res = await axiosInstance.get(`/recovery/obtenertoken/${correo}`);
  return res;
}
