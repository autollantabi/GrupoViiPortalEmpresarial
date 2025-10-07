import axios from "axios";
import url, { url_new } from "./url";

// Crear instancias de axios personalizadas
export const axiosInstance = axios.create({
  baseURL: url,
  timeout: 60000, // 60 segundos
  headers: {
    "Content-Type": "application/json",
  },
});

export const axiosInstanceNew = axios.create({
  baseURL: url_new,
  timeout: 300000, // 300 segundos
  headers: {
    "Content-Type": "application/json",
  },
});

// Configurar interceptores para ambas instancias
const configureInterceptors = (instance) => {
  // Interceptor de solicitud
  instance.interceptors.request.use(
    (config) => {
      // Log de la solicitud para depuración
      // console.log(`Realizando petición a: ${config.baseURL}${config.url}`);
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor de respuesta
  instance.interceptors.response.use(
    (response) => {
      // Log de respuesta exitosa para depuración
      // console.log(`Respuesta exitosa de: ${response.config.url}`);
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Si el error es por timeout o problemas de red, reintenta hasta 3 veces
      if (
        (error.code === "ECONNABORTED" ||
          error.message?.includes("timeout") ||
          error.message?.includes("Network Error")) &&
        !originalRequest._retry &&
        (originalRequest.retryCount || 0) < 3
      ) {
        originalRequest._retry = true;
        originalRequest.retryCount = (originalRequest.retryCount || 0) + 1;

        // Espera un poco antes de reintentar (usando backoff exponencial)
        const delay = 1000 * Math.pow(2, originalRequest.retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return instance(originalRequest);
      }

      // Log detallado de errores
      // if (error.response) {
      //   console.error(`Error ${error.response.status} en: ${originalRequest.url}`, error.response.data);
      // } else if (error.request) {
      //   console.error(`Sin respuesta para: ${originalRequest.url}`, error.message);
      // } else {
      //   console.error(`Error de configuración: ${originalRequest?.url || 'desconocido'}`, error.message);
      // }

      return Promise.reject(error);
    }
  );
};

// Aplicar configuración a ambas instancias
configureInterceptors(axiosInstance);
configureInterceptors(axiosInstanceNew);

// Exportar las instancias para uso directo
export default {
  axiosInstance,
  axiosInstanceNew,
};
