import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Procesa una lista de descripciones de llantas.
 * @param {Array<string>} descripciones - Arreglo de descripciones a procesar
 * @returns {Promise<Array>} - Arreglo con la data procesada
 */
export const parseLlantas = async (descripciones, lineaNegocio) => {
    try {

        const response = await axiosInstanceNew.post(`/mdm/parse-llantas/${lineaNegocio}`, {
            descripciones
        });

        if (response.data && response.data.status === "Ok!") {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error("Error en parseLlantas:", error);
        throw error;
    }
};

/** 
 * Obtiene los ítems pendientes según el rol y línea de negocio.
 * @param {number} idRolPrincipal - ID del rol del usuario
 * @param {string} linea - Línea de negocio (LLANTAS, LUBRICANTES, etc)
 * @returns {Promise<Array>}
 */
export const getItemsByRole = async (idRolPrincipal, linea) => {
    try {
        const response = await axiosInstanceNew.get(`/mdm/items/${linea}`, {
            params: { idRolPrincipal }
        });
        if (response.data && response.data.status === "Ok!") {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error("Error en getItemsByRole:", error);
        throw error;
    }
};


/**
 * Crea un ítem nuevo (específico para Rol 5).
 * @param {Object} item - Datos del ítem mapeados
 * @returns {Promise<any>}
 */
export const saveItemRole5 = async (item) => {
    try {
        const response = await axiosInstanceNew.post("/mdm/items", item);
        return response.data;
    } catch (error) {
        console.error("Error en saveItemRole5:", error);
        throw error;
    }
};

/**
 * Actualiza un ítem (específico para Rol 3).
 * @param {Object} item - Datos del ítem mapeados
 * @returns {Promise<any>}
 */
export const patchItemRole3 = async (item) => {
    try {
        const response = await axiosInstanceNew.patch("/mdm/items", item);
        return response.data;
    } catch (error) {
        console.error("Error en patchItemRole3:", error);
        throw error;
    }
};

/**
 * Rechaza una fase específica de un ítem (utilizado por Rol 1).
 * @param {number} itemId - ID del ítem
 * @param {Object} payload - { FASE, RECHAZO, MOTIVO_RECHAZO }
 * @returns {Promise<any>}
 */
export const rejectItemPhase = async (itemId, linea, payload) => {
    try {
        const response = await axiosInstanceNew.patch(`/mdm/items/${linea}/${itemId}/fases/rechazo`, payload);
        return response.data;
    } catch (error) {
        console.error("Error en rejectItemPhase:", error);
        throw error;
    }
};

/**
 * Sube imágenes PNG y WebP a un ítem.
 * @param {number|string} id - ID del ítem
 * @param {string} marca - Marca del ítem
 * @param {string} diseño - Diseño del ítem
 * @param {File} imagenPng - Archivo de imagen PNG
 * @param {File} imagenWebp - Archivo de imagen WebP
 * @returns {Promise<any>}
 */
export const uploadItemImages = async (lineaNegocio, id, marca, diseño, imagenPng, imagenWebp) => {
    try {
        const formData = new FormData();
        formData.append("ID", id);
        if (marca) formData.append("MARCA", marca);
        if (diseño) formData.append("DISENIO", diseño);
        if (imagenPng) formData.append("imagenPng", imagenPng);
        if (imagenWebp) formData.append("imagenWebp", imagenWebp);
        // Replicamos la configuración de uploadToCloudflare que ya funciona en este proyecto
        const response = await axiosInstanceNew.post(`/mdm/items/upload-images/${lineaNegocio}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error en uploadItemImages:", error);
        throw error;
    }
};

/**
 * Sube imágenes a SharePoint (principalmente PNG, enviando WebP como null).
 * @param {string} lineaNegocio - Línea de negocio
 * @param {number|string} id - ID del ítem
 * @param {string} marca - Marca del ítem
 * @param {string} empresa - Empresa
 * @param {string} diseño - Diseño del ítem
 * @param {File} imagenPng - Archivo de imagen PNG
 * @param {File} imagenWebp - Archivo de imagen WebP (usualmente null)
 * @returns {Promise<any>}
 */
export const uploadItemImagesSharepoint = async (lineaNegocio, id, marca, empresa, diseño, imagenPng, imagenWebp) => {
    try {
        const formData = new FormData();
        formData.append("ID", id);
        if (marca) formData.append("MARCA", marca);
        if (empresa) formData.append("EMPRESA", empresa);
        if (diseño) formData.append("DISENIO", diseño);
        if (imagenPng) formData.append("imagenPng", imagenPng);
        if (imagenWebp) formData.append("imagenWebp", imagenWebp);
        const response = await axiosInstanceNew.post(`/mdm/items/upload-images-sharepoint/${lineaNegocio}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error en uploadItemImagesSharepoint:", error);
        throw error;
    }
};

/**
 * Obtiene los ítems del DWH por línea de negocio.
 * @param {string} lineaNegocio - Línea de negocio (LLANTAS, LUBRICANTES, etc)
 * @returns {Promise<Array>}
 */
export const getItemsDWHByLinea = async (lineaNegocio) => {
    try {
        const response = await axiosInstanceNew.get(`/mdm/itemsDWH/linea-negocio/${lineaNegocio}`);
        if (response.data && response.data.status === "Ok!") {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error("Error en getItemsDWHByLinea:", error);
        throw error;
    }
};

/**
 * Crea un ítem a partir de la data del DWH.
 * @param {string} lineaNegocio - Línea de negocio (LLANTAS, LUBRICANTES, etc)
 * @param {number|string} codigoItem - El DIT_CODIGO del ítem en DWH
 * @returns {Promise<any>}
 */
export const createItemFromDWH = async (lineaNegocio, codigoItem) => {
    try {
        const response = await axiosInstanceNew.post(`/mdm/items/from-dwh/${lineaNegocio}/${codigoItem}`);
        return response.data;
    } catch (error) {
        console.error("Error en createItemFromDWH:", error);
        throw error;
    }
};

/**
 * Aprueba un ítem en el MDM (específico para Rol 1).
 * @param {number|string} id - ID del ítem
 * @returns {Promise<any>}
 */
export const approveItemMDM = async (id, linea) => {
    try {
        const response = await axiosInstanceNew.patch(`/mdm/items/${linea}/${id}/aprobado-mdm`, {
            APROBADO_MDM: true
        });
        return response.data;
    } catch (error) {
        console.error("Error en approveItemMDM:", error);
        throw error;
    }
};

/**
 * Obtiene el mapeo de marcas y partidas arancelarias desde el DWH.
 * @returns {Promise<Array>}
 */
export const getNeumaticosDWH = async () => {
    try {
        const response = await axiosInstanceNew.get("/dwh-postgres/neumaticos");
        if (response.data && response.data.status === "Ok!") {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error("Error en getNeumaticosDWH:", error);
        throw error;
    }
};

/**
 * Obtiene las características de los ítems (categorías, segmentos, aplicaciones, ejes).
 * @returns {Promise<Object>}
 */
export const getItemsCaracteristicas = async () => {
    try {
        const response = await axiosInstanceNew.get("/mdm/items-caracteristicas");
        if (response.data && response.data.status === "Ok!") {
            return response.data.data;
        }
        return {};
    } catch (error) {
        console.error("Error en getItemsCaracteristicas:", error);
        throw error;
    }
};

/**
 * Obtiene el código de marca del DWH.
 * @returns {Promise<any>}
 */
export const getCodigoMarca = async (companyName) => {
    try {
        const response = await axiosInstanceNew.get(`/dwh-postgres/codigo-marca/${companyName}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener codigo marca:", error);
        throw error;
    }
};

/**
 * Obtiene los tipos de unidades por empresa.
 * @param {string} companyName - Nombre de la empresa
 * @returns {Promise<any>}
 */
export const getTiposUnidades = async (companyName) => {
    try {
        const response = await axiosInstanceNew.get(`/mdm/tipos-unidades/${companyName}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener tipos de unidades:", error);
        throw error;
    }
};

/**
 * Obtiene los grupos de unidades por empresa.
 * @param {string} empresa - Nombre o ID de la empresa
 * @returns {Promise<any>}
 */
export const getGruposUnidades = async (empresa) => {
    try {
        const response = await axiosInstanceNew.get(`/mdm/grupos-unidades/${empresa}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener grupos de unidades:", error);
        throw error;
    }
};

/**
 * Obtiene los grupos de unidades alternativas por empresa e ID.
 * @param {string} empresa - Nombre o ID de la empresa
 * @param {number|string} id - ID
 * @returns {Promise<any>}
 */
export const getGruposUnidadesAlternativas = async (empresa, id) => {
    try {
        const response = await axiosInstanceNew.get(`/mdm/grupos-unidades-alternativas/${empresa}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener grupos de unidades alternativas:", error);
        throw error;
    }
};

/**
 * Obtiene los grupos, subgrupos y tipos para Herramientas.
 * @returns {Promise<Array>}
 */
export const getGruposHerramientas = async () => {
    try {
        const response = await axiosInstanceNew.get('/mdm/grupos-herramientas/');
        return response.data?.data || [];
    } catch (error) {
        console.error("Error en getGruposHerramientas:", error);
        return [];
    }
};
