import { axiosInstanceNew } from "config/axiosConfig";

export async function ListarDesbloqueoClientes() {
  try {
    const res = await axiosInstanceNew.get(`/cartera/desbloqueo`);
    if (res.status === 200) {
      return res.data.data || [];
    }
    return [];
  } catch (e) {
    return [];
  }
}
export async function EnviarConfirmacionDesbloqueoClientes({ data }) {
  try {
    const res = await axiosInstanceNew.post(`/cartera/desbloqueo`, data);

    if (res.status === 200) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}
