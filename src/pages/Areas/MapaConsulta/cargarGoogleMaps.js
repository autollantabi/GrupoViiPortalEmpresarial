import { GOOGLE_MAPS_API_KEY } from "config/env";

let promesa = null;

/** Carga el script de Google Maps una sola vez y devuelve el espacio `google.maps`. */
export const cargarGoogleMaps = () => {
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error("Falta VITE_GOOGLE_MAPS_API_KEY en el .env del front"));
  if (!promesa) {
    promesa = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly&language=es&region=EC`;
      script.async = true;
      script.onload = () => (window.google?.maps?.Map ? resolve(window.google.maps) : reject(new Error("Google Maps no inicializó")));
      script.onerror = () => reject(new Error("No se pudo cargar Google Maps"));
      document.head.appendChild(script);
    }).catch((e) => {
      promesa = null; // permite reintentar al volver a entrar a la pantalla
      throw e;
    });
  }
  return promesa;
};
