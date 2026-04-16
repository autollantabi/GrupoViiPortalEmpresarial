import { axiosInstanceNew } from "config/axiosConfig";

export const getProductosCalculadora = async () => {
  try {
    const res = await axiosInstanceNew.get(`/calculadora/productos`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener productos de la calculadora:", error);
    throw error;
  }
};
