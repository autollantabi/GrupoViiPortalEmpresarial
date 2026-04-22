import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Obtiene los vendedores y reemplazos para una empresa.
 * @param {number} idEmpresa - ID de la empresa (AUTOLLANTA:1, MAXXIMUNDO:2, STOX:3, IKONIX:4, AUTOMAX:5)
 * @returns {Promise<{vendedores: Array, reemplazos: Array}>}
 */
export const ListarVendedoresReemplazosVisitas = async (idEmpresa) => {
  try {
    const response = await axiosInstanceNew.get(`/reemplazo-vendedores-visita/vendedores/${idEmpresa}`);

    if (response.data && response.data.status === "Ok!") {
      return {
        vendedores: response.data.data.vendedores || [],
        reemplazos: response.data.data.reemplazos || [],
      };
    }
    return { vendedores: [], reemplazos: [] };
  } catch (error) {
    console.error("Error en ListarVendedoresReemplazosVisitas:", error);
    return { vendedores: [], reemplazos: [] };
  }
};

/**
 * Crea un nuevo reemplazo de visita.
 * @param {Object} data - Datos del reemplazo
 * @returns {Promise<boolean>}
 */
export const CrearReemplazoVisita = async (data) => {
  try {
    console.log("SE ENVIA: " + JSON.stringify(data));
    const response = await axiosInstanceNew.post("/reemplazo-vendedores-visita", data);
    console.log(response.data);
    return response.data && response.status === 201 || response.status === 200;
  } catch (error) {
    console.error("Error en CrearReemplazoVisita:", error);
    return false;
  }
};
