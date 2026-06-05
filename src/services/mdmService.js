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
        console.log("Items por rol");
        console.log(response.data);

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
        console.log("Este es el post: ")
        console.log(item);
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
        console.log(item);
        const response = await axiosInstanceNew.patch("/mdm/items", item);
        console.log(response.data);

        return response.data;
    } catch (error) {
        console.error("Error en patchItemRole3:", error);
        throw error;
    }
};

/**
 * Sube una imagen a Cloudflare. Crea la carpeta de la marca automáticamente en el bucket.
 * @param {File} file - Archivo .webp a subir
 * @param {string} marca - Carpeta destino
 * @param {string} diseño - Nombre del archivo
 * @returns {Promise<any>}
 */
export const uploadToCloudflare = async (file, marca, diseño) => {
    try {
        const formData = new FormData();
        formData.append("imagenWebp", file);
        formData.append("MARCA", marca);
        formData.append("DISENIO", diseño);

        console.log(marca, diseño);

        const response = await axiosInstanceNew.post("/mdm/upload-cloudflare", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error al subir a Cloudflare:", error);
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

        console.log(marca, lineaNegocio)


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
 * Obtiene los ítems del DWH por línea de negocio.
 * @param {string} lineaNegocio - Línea de negocio (LLANTAS, LUBRICANTES, etc)
 * @returns {Promise<Array>}
 */
export const getItemsDWHByLinea = async (lineaNegocio) => {
    try {
        const response = await axiosInstanceNew.get(`/mdm/itemsDWH/linea-negocio/${lineaNegocio}`);
        console.log("Items de DWH");
        console.log(response.data);
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
        console.log("Creando item desde DWH");
        console.log(response.data);
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
