import { buscarDireccion, buscarCruces } from "services/geocodingService";
import { parsearInterseccion } from "./interseccion";

/**
 * Devuelve los lugares candidatos para un texto. Si tiene forma de "calle A y calle B[, ciudad]"
 * pide los cruces al backend (todas las ciudades donde se cortan, las más cercanas al mapa
 * primero) para que el usuario elija. Si no existe el cruce NO se cae a una búsqueda de texto:
 * Nominatim ignora una de las calles y devuelve otro lugar que parece una respuesta válida.
 * `centro` = [lat, lon] del centro del mapa (solo si está acercado).
 */
export const consultarLugares = async (texto, { signal, centro } = {}) => {
  const cruce = parsearInterseccion(texto);
  const res = cruce
    ? await buscarCruces(cruce.calleA, cruce.calleB, { ciudad: cruce.ciudad, centro, signal })
    : await buscarDireccion(texto, { signal, limit: 8 });
  return { candidatos: res, esCruce: Boolean(cruce) };
};
