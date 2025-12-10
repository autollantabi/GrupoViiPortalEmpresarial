import { axiosInstance } from "config/axiosConfig";

export const EjecutarBatBancosTransaccionesCartera = async () => {
  try {
    const res = await axiosInstance.post(`/transaccion/actualizar/banco`);
    console.log(res);

    if (res.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
};
export const obtenerFechaHoraEjecucionBatBancosTransaccionesCartera =
  async () => {
    try {
      const res = await axiosInstance.get(
        `/transaccion/actualizar/banco/fecha`
      );
      if (res.status === 200) {
        return res.data.data;
      } else {
        return "error";
      }
    } catch (e) {
      return "error";
    }
  };
