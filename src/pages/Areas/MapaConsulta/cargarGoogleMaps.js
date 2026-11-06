import { GOOGLE_MAPS_API_KEY } from "config/env";

let promesa = null;

/** Carga el script de Google Maps una sola vez y devuelve el espacio `google.maps`. */
export const cargarGoogleMaps = () => {
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error("Falta VITE_GOOGLE_MAPS_API_KEY en el .env del front"));
  if (!promesa) {
    promesa = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      // loading=async: patrón recomendado; las clases se obtienen con importLibrary.
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly&language=es&region=EC&loading=async`;
      script.async = true;
      script.onload = async () => {
        try {
          if (!window.google?.maps?.importLibrary) throw new Error("Google Maps no inicializó");
          // Map y Point (core) y Marker (clásico) quedan disponibles en google.maps
          await Promise.all([
            window.google.maps.importLibrary("maps"),
            window.google.maps.importLibrary("core"),
            window.google.maps.importLibrary("marker"),
          ]);
          resolve(window.google.maps);
        } catch (e) {
          reject(e);
        }
      };
      script.onerror = () => reject(new Error("No se pudo cargar Google Maps"));
      document.head.appendChild(script);
    }).catch((e) => {
      promesa = null; // permite reintentar al volver a entrar a la pantalla
      throw e;
    });
  }
  return promesa;
};
