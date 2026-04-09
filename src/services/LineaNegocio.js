import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Obtiene los parámetros de vendedores (Línea de Negocio y Categoría)
 * Endpoint: GET /dhw-postgres/vendedores-parametros
 */
export const obtenerVendedoresParametros = async () => {
  try {
    const response = await axiosInstanceNew.get("/dwh-postgres/vendedores-parametros");

    return {
      success: true,
      data: response.data.data || [],
      message: response.data.message || "Algo Paso",
    };
  } catch (error) {
    console.error("Error al obtener vendedores-parametros:", error);
    const errorData = error.response ? error.response.data : {};
    return {
      success: false,
      data: [],
      message: errorData.message || "Error al conectar con el servidor",
    };
  }
};
/**
 * Crea una nueva línea de negocio para un vendedor
 * Endpoint: POST /dwh-postgres/categoria-parametros
 */
export const crearLineaNegocio = async (data) => {
  try {
    const response = await axiosInstanceNew.post("/dwh-postgres/categoria-parametros", data);
    const resData = response.data || {};
    return {
      success: true,
      data: resData.data || resData,
      message: resData.message || "Asociación creada exitosamente",
    };
  } catch (error) {
    console.error("Error al crear linea-negocio:", error);
    const errorData = error.response ? error.response.data : {};
    return {
      success: false,
      message: errorData.message || "Error al guardar la asociación",
    };
  }
};

/**
 * Elimina una línea de negocio por su ID (serial)
 * Endpoint: DELETE /dwh-postgres/categoria-parametros/{serial}
 */
export const eliminarLineaNegocio = async (serial) => {
  try {
    const response = await axiosInstanceNew.delete(`/dwh-postgres/categoria-parametros/${serial}`);
    const resData = response.data || {};
    return {
      success: true,
      message: resData.message || "Asociación eliminada exitosamente",
    };
  } catch (error) {
    console.error("Error al eliminar linea-negocio:", error);
    const errorData = error.response ? error.response.data : {};
    return {
      success: false,
      message: errorData.message || "Error al eliminar la asociación",
    };
  }
};
/**
 * Obtiene los grupos originales de ítems
 * Endpoint: GET /dwh-postgres/grupos-originales-item
 */
export const obtenerGruposOriginales = async () => {
  try {
    const response = await axiosInstanceNew.get("/dwh-postgres/grupos-originales-item");

    return {
      success: true,
      data: response.data.data || [],
      message: response.data.message || "Successfully fetched distinct grupo original!",
    };
  } catch (error) {
    console.error("Error al obtener grupos-originales-item:", error);
    const errorData = error.response ? error.response.data : {};
    return {
      success: false,
      data: [],
      message: errorData.message || "Error al conectar con el servidor",
    };
  }
};

/**
 * Obtiene los parámetros de línea de negocio (para el reporte)
 * Endpoint: GET /dwh-postgres/linea-negocio-parametros
 */
export const obtenerLineaNegocioParametros = async () => {
  try {
    const response = await axiosInstanceNew.get("/dwh-postgres/linea-negocio-parametros");
    return {
      success: true,
      data: response.data.data || [],
      message: response.data.message || "Successfully fetched linea negocio parametros!",
    };
  } catch (error) {
    console.error("Error al obtener linea-negocio-parametros:", error);
    const errorData = error.response ? error.response.data : {};
    return {
      success: false,
      data: [],
      message: errorData.message || "Error al conectar con el servidor",
    };
  }
};

/**
 * Actualiza el Nombre Comercial (DLN_NOMBRE) de una línea de negocio
 * Endpoint: PATCH /dwh-postgres/linea-negocio-parametros/{dlnCodigo}
 */
export const actualizarNombreComercial = async (dlnCodigo, data) => {
  try {
    const response = await axiosInstanceNew.patch(`/dwh-postgres/linea-negocio-parametros/${dlnCodigo}`, data);
    return {
      success: true,
      message: response.data.message || "Nombre comercial actualizado correctamente",
    };
  } catch (error) {
    console.error("Error al actualizar nombre comercial:", error);
    const errorData = error.response ? error.response.data : {};
    return {
      success: false,
      message: errorData.message || "Error al guardar el cambio",
    };
  }
};
