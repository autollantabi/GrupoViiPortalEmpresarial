import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Procesa una lista de descripciones de llantas.
 * @param {Array<string>} descripciones - Arreglo de descripciones a procesar
 * @returns {Promise<Array>} - Arreglo con la data procesada
 */
export const parseLlantas = async (descripciones) => {
    try {
        const response = await axiosInstanceNew.post("/mdm/parse-llantas", {
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
 * Sube una imagen a Cloudflare. Crea la carpeta de la marca automáticamente en el bucket.
 * @param {File} file - Archivo .webp a subir
 * @param {string} marca - Carpeta destino
 * @param {string} diseño - Nombre del archivo
 * @returns {Promise<any>}
 */
export const uploadToCloudflare = async (file, marca, diseño) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("marca", marca);
        formData.append("diseño", diseño);

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
