import axios from "axios";
import {
  API_URL,
  API_URL_NEW,
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

// Clave de localStorage del token (debe coincidir con authContext ID_SESSION_STORAGE_KEY)
const ID_SESSION_STORAGE_KEY = "app_cache_token";

// Funciones para gestionar la cabecera id-session
export const setAxiosIdSession = (idSession) => {
  if (idSession) {
    axiosInstanceNew.defaults.headers.common["id-session"] = idSession;
  }
};

export const removeAxiosIdSession = () => {
  delete axiosInstanceNew.defaults.headers.common["id-session"];
};

/** Limpia sesión en cliente (token y cabecera). Usado en logout y en interceptor 401. */
export const clearSessionClient = () => {
  removeAxiosIdSession();
  try {
    localStorage.removeItem(ID_SESSION_STORAGE_KEY);
  } catch (e) {
    // localStorage no disponible (entorno privado, etc.)
  }
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

      return Promise.reject(error);
    }
  );
};

// Interceptor 401 solo para API nueva (sesión expirada o inválida): limpiar sesión y redirigir a login
axiosInstanceNew.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      // No redirigir si es la petición de login (credenciales incorrectas)
      if (!url.includes("/auth/login")) {
        clearSessionClient();
        const path = typeof window !== "undefined" ? window.location.pathname : "";
        if (path !== "/login" && path !== "/recovery") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Aplicar configuración a todas las instancias
configureInterceptors(axiosInstance);
configureInterceptors(axiosInstanceNew);

// Exportar las instancias para uso directo
export default {
  axiosInstance,
  axiosInstanceNew,
};
