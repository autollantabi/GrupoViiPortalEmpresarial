import { axiosInstanceNew } from "config/axiosConfig";

// Las consultas de mapa pasan por el backend del portal (/geocodificacion), que habla con el
// Google Maps: la clave queda en el backend, misma sesión, sin CORS y caché compartida entre usuarios.

// Caché en memoria de la sesión: repetir una consulta (o volver a una anterior) es instantáneo.
const cache = new Map();
const conCache = async (clave, pedir) => {
  if (cache.has(clave)) return cache.get(clave);
  const datos = await pedir();
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  cache.set(clave, datos);
  return datos;
};

/** Busca direcciones por texto libre. Devuelve hasta `limit` candidatos ordenados por relevancia. */
export const buscarDireccion = async (texto, { limit = 6, signal } = {}) =>
  conCache(`s|${limit}|${texto.toLowerCase()}`, async () => {
    const res = await axiosInstanceNew.get("/geocodificacion/search", { params: { q: texto, limit }, signal });
    return res.data.data;
  });

/** Geocodificación inversa de un punto. zoom 18 = nivel edificio/casa. */
export const ubicarPunto = async (lat, lon, { zoom = 18, signal } = {}) =>
  conCache(`r|${zoom}|${Number(lat).toFixed(6)}|${Number(lon).toFixed(6)}`, async () => {
    const res = await axiosInstanceNew.get("/geocodificacion/reverse", { params: { lat, lon, zoom }, signal });
    return res.data.data;
  });

/**
 * Cruces de dos calles. El backend los resuelve con Google Maps. `centro` = [lat, lon] del mapa:
 * los cruces más cercanos salen primero.
 */
export const buscarCruces = async (calleA, calleB, { ciudad, centro, signal } = {}) =>
  conCache(`x|${calleA.toLowerCase()}|${calleB.toLowerCase()}|${(ciudad || "").toLowerCase()}`, async () => {
    const res = await axiosInstanceNew.get("/geocodificacion/cruces", {
      params: {
        calleA, calleB,
        ...(ciudad ? { ciudad } : {}),
        ...(centro ? { lat: centro[0], lon: centro[1] } : {}),
      },
      signal,
    });
    return res.data.data;
  });

/**
 * Sugerencias mientras se escribe: lugares completos (coordenadas y desglose), así que elegir uno no
 * necesita otra consulta. `centro` = [lat, lon] del mapa para priorizar lo cercano.
 */
export const sugerirLugares = async (texto, { centro, signal } = {}) =>
  conCache(`a|${texto.toLowerCase()}|${centro ? `${centro[0].toFixed(1)},${centro[1].toFixed(1)}` : ""}`, async () => {
    const res = await axiosInstanceNew.get("/geocodificacion/autocomplete", {
      params: { q: texto, ...(centro ? { lat: centro[0], lon: centro[1] } : {}) },
      signal,
    });
    return res.data.data;
  });
