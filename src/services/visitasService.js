import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Obtiene los vendedores y reemplazos para una empresa.
 * @param {number} idEmpresa - ID de la empresa (AUTOLLANTA:1, MAXXIMUNDO:2, STOX:3, IKONIX:4, AUTOMAX:5)
 * @returns {Promise<{vendedores: Array, reemplazos: Array}>}
 */
export const ListarVendedoresReemplazosVisitas = async (idEmpresa) => {
  try {
    const response = await axiosInstanceNew.get(`/reemplazo-vendedores-visita/vendedores/${idEmpresa}`);
    console.log(response.data);

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
    const response = await axiosInstanceNew.post("/reemplazo-vendedores-visita", data);
    return response.data && response.status === 201 || response.status === 200;
  } catch (error) {
    console.error("Error en CrearReemplazoVisita:", error);
    return false;
  }
};

/**
 * Obtiene las visitas de reemplazo para el día de hoy.
 * @returns {Promise<Array>}
 */
export const ListarVisitasHoy = async () => {
  try {
    const response = await axiosInstanceNew.get("/reemplazo-vendedores-visita/visitas-hoy");
    if (response.data && response.data.status === "Ok!") {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error("Error en ListarVisitasHoy:", error);
    return [];
  }
};

/**
 * Guarda las visitas modificadas.
 * @param {Array} data - Lista de visitas modificadas
 * @returns {Promise<boolean>}
 */
export const GuardarVisitasModificadas = async (data) => {
  try {
    const response = await axiosInstanceNew.post("/reemplazo-vendedores-visita/visitas-modificadas-reemplazo", data);
    return response.status === 200 || response.status === 201;
  } catch (error) {
    console.error("Error en GuardarVisitasModificadas:", error);
    return false;
  }
};
/**
 * Obtiene las visitas modificadas de reemplazo para el día de hoy.
 * @returns {Promise<Array>}
 */
export const ListarVisitasModificadasHoy = async () => {
  try {
    const response = await axiosInstanceNew.get("/reemplazo-vendedores-visita/visitas-modificadas-hoy");
    if (response.data && response.data.status === "Ok!") {
      return response.data.data.visitas || [];
    }
    return [];
  } catch (error) {
    console.error("Error en ListarVisitasModificadasHoy:", error);
    return [];
  }
};
