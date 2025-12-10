import { axiosInstanceNew } from "config/axiosConfig";

export const apiEjecutarBancos = async ({ banco }) => {
  try {
    const response = await axiosInstanceNew.post(`/cartera/bash/bancos/`, {
      banco: banco,
    });
    if (response.status === 200) {
      return { success: true, message: "Banco ejecutado correctamente." };
    }
    return { success: false, message: "Error al ejecutar el banco" };
  } catch (error) {
    return { success: false, message: `Error Interno ${error}` };
  }
};
