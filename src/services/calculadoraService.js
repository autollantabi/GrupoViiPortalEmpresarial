import { axiosInstanceNew } from "config/axiosConfig";

export const getProductosCalculadora = async (idEmpresa = null) => {
  try {
    const res = await axiosInstanceNew.get(`/calculadora/productos`, {
      params: { idEmpresa }
    });
    return res.data;
  } catch (error) {
    console.error("Error al obtener productos de la calculadora:", error);
    throw error;
  }
};

export const getPromedioVentasByCodigoItem = async (codigoItem) => {
  try {
    const res = await axiosInstanceNew.get(`/calculadora/promedio-ventas/${codigoItem}`);
    return res.data;
  } catch (error) {
    console.error(`Error al obtener promedio de ventas del item ${codigoItem}:`, error);
    throw error;
  }
};
