import { GOOGLE_MAPS_API_KEY } from "config/env";

let promesa = null;

/** Carga el script de Google Maps una sola vez y devuelve el espacio `google.maps`. */
export const cargarGoogleMaps = () => {
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error("Falta VITE_GOOGLE_MAPS_API_KEY en el .env del front"));
  if (!promesa) {
    promesa = new Promise((resolve, reject) => {
      // `onload` del script llega antes de que Google termine de cargar sus módulos (main.js...): con una
      // conexión lenta `google.maps.Map` aún no existe. El `callback` avisa cuando la API está lista.
      window.__googleMapsListo = () => (window.google?.maps?.Map ? resolve(window.google.maps) : reject(new Error("Google Maps no inicializó")));
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly&language=es&region=EC&callback=__googleMapsListo`;
      script.async = true;
      script.onerror = () => reject(new Error("No se pudo cargar Google Maps"));
      document.head.appendChild(script);
    }).catch((e) => {
      promesa = null; // permite reintentar al volver a entrar a la pantalla
      throw e;
    });
  }
  return promesa;
};
