import axios from "axios";
import {
  API_URL,
  API_URL_NEW,
  API_URL_APP_SHELL,
  APP_SHELL_API_KEY,
} from "./env";

// Crear instancias de axios personalizadas
export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 300000, // 30 segundos
  headers: {
    "Content-Type": "application/json",
  },
});

export const axiosInstanceNew = axios.create({
  baseURL: API_URL_NEW,
  timeout: 300000, // 300 segundos
  headers: {
    "Content-Type": "application/json",
  },
});

export const axiosInstanceAppShell = axios.create({
  baseURL: API_URL_APP_SHELL,
  timeout: 300000, // 300 segundos
  headers: {
    "Content-Type": "application/json",
  },
});

// Configurar el header X-Portal-API-Key en defaults para asegurar que se aplique a todas las peticiones
if (APP_SHELL_API_KEY) {
  axiosInstanceAppShell.defaults.headers.common["X-Portal-API-Key"] = APP_SHELL_API_KEY;
} else {
  console.warn("⚠️ APP_SHELL_API_KEY no está definido. Verifica la variable de entorno VITE_API_KEY_APP_SHELL");
}

// Funciones para gestionar la cabecera id-session
export const setAxiosIdSession = (idSession) => {
  if (idSession) {
    axiosInstanceNew.defaults.headers.common["id-session"] = idSession;
  }
};

export const removeAxiosIdSession = () => {
  delete axiosInstanceNew.defaults.headers.common["id-session"];
};

// Configurar interceptores para ambas instancias
const configureInterceptors = (instance) => {
  // Interceptor de solicitud
  instance.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor de respuesta
  instance.interceptors.response.use(
    (response) => {
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

// Aplicar configuración a todas las instancias
configureInterceptors(axiosInstance);
configureInterceptors(axiosInstanceNew);
configureInterceptors(axiosInstanceAppShell);

// Interceptor específico para App Shell que siempre agrega el header X-Portal-API-Key
axiosInstanceAppShell.interceptors.request.use(
  (config) => {
    // Asegurar que el header X-Portal-API-Key esté presente en cada petición
    if (APP_SHELL_API_KEY) {
      config.headers["X-Portal-API-Key"] = APP_SHELL_API_KEY;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Exportar las instancias para uso directo
export default {
  axiosInstance,
  axiosInstanceNew,
};
