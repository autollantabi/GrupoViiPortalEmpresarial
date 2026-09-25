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
 * Crea varios ítems nuevos en un solo request (específico para Rol 5).
 * El backend guarda todos los ítems y envía UNA sola notificación por correo listando
 * todos, en vez de una por ítem. Para HERRAMIENTAS sincroniza a SAP de inmediato (todos
 * los ítems en un solo llamado); LLANTAS/LUBRICANTES no se sincronizan hasta la
 * aprobación de Jefatura.
 * @param {Array<Object>} items - Ítems mapeados, mismo shape que `saveItemRole5`
 * @returns {Promise<{status:string, message:string, data:Array, errors?:Array, sapSync?:Object}>}
 */
export const saveItemsRole5Bulk = async (items) => {
    try {
        const response = await axiosInstanceNew.post("/mdm/items/bulk", { items });
        return response.data;
    } catch (error) {
        console.error("Error en saveItemsRole5Bulk:", error);
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
 * Actualiza varios ítems en un solo request (avance de fase / reenvío tras rechazo).
 * El backend agrupa los ítems que avanzan a la misma fase (y los reenviados tras
 * rechazo) y envía UNA sola notificación por grupo listando todos sus ítems, en vez de
 * una por ítem.
 * @param {Array<Object>} items - Ítems mapeados, mismo shape que `patchItemRole3`
 * @returns {Promise<{status:string, message:string, data:null, errors?:Array}>}
 */
export const patchItemsRole3Bulk = async (items) => {
    try {
        const response = await axiosInstanceNew.patch("/mdm/items/bulk", { items });
        return response.data;
    } catch (error) {
        console.error("Error en patchItemsRole3Bulk:", error);
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
 * Verifica si el ítem ya tiene imagen (por su diseño/identificador, no por ítem individual) en
 * Cloudflare R2 (webp) y/o SharePoint (png), sin subir ningún archivo. El backend resuelve MARCA
 * y el identificador de imagen desde el propio ítem (DISEÑO para LLANTAS/LLANTAS_MOTO, o vía DWH
 * para LUBRICANTES/HERRAMIENTAS), así que solo hace falta el ID. Aplica a las 3 líneas de negocio.
 * @param {string} lineaNegocio - Línea de negocio (LLANTAS, LLANTAS_MOTO, LUBRICANTES, HERRAMIENTAS)
 * @param {number|string} id - ID del ítem
 * @returns {Promise<{webp: {exists: boolean, url: string|null}, png: {exists: boolean, url: string|null, previewUrl: string|null}}|null>}
 */
export const checkDesignImage = async (lineaNegocio, id) => {
    try {
        const response = await axiosInstanceNew.get(`/mdm/items/check-design-image/${lineaNegocio}`, {
            params: { ID: id }
        });
        if (response.data && response.data.status === "Ok!") {
            return response.data.data;
        }
        return null;
    } catch (error) {
        console.error("Error en checkDesignImage:", error);
        throw error;
    }
};

/**
 * Vincula a un ítem la imagen ya existente en storage para su mismo diseño/identificador (sin
 * volver a subir el archivo), cuando otro ítem con esa misma identidad ya la tiene cargada.
 * Aplica a las 3 líneas de negocio.
 * @param {string} lineaNegocio - Línea de negocio (LLANTAS, LLANTAS_MOTO, LUBRICANTES, HERRAMIENTAS)
 * @param {number|string} id - ID del ítem
 * @returns {Promise<any>}
 */
export const linkExistingItemImage = async (lineaNegocio, id) => {
    try {
        const response = await axiosInstanceNew.post(`/mdm/items/link-existing-image/${lineaNegocio}`, {
            ID: id,
        });
        return response.data;
    } catch (error) {
        console.error("Error en linkExistingItemImage:", error);
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
 * Obtiene las combinaciones de marca, proveedor y procedencia por empresa y línea de negocio,
 * desde core.dim_marca_proveedor_procedencia (DWH Postgres).
 * @returns {Promise<Array>}
 */
export const getMarcaProveedorProcedencia = async () => {
    try {
        const response = await axiosInstanceNew.get("/dwh-postgres/marca-proveedor-procedencia");
        if (response.data && response.data.status === "Ok!") {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error("Error en getMarcaProveedorProcedencia:", error);
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
 * Sincroniza items aprobados hacia SAP: el front solo envía los IDs seleccionados,
 * el backend consulta los items, homologa los campos y llama al integrador SAP.
 * @param {string} lineaNegocio - LLANTAS | LUBRICANTES | HERRAMIENTAS
 * @param {Array<number>} ids - IDs de items del portal a sincronizar
 * @returns {Promise<Object>} - { LineaNegocio, Total, Exitosos, Fallidos, PorEmpresa, ItemsOmitidos }
 */
export const syncItemsToSap = async (lineaNegocio, ids) => {
    const response = await axiosInstanceNew.post(`/mdm/items/${lineaNegocio}/sync-sap`, { ids });
    return response.data;
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
