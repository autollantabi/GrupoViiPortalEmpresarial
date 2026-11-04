import axios from "axios";
import { GEOCODER_URL, GEOCODER_COUNTRY } from "config/env";

// Cliente propio: el geocodificador es externo al portal, no lleva el token de sesión.
const geocoder = axios.create({ baseURL: GEOCODER_URL, timeout: 15000 });

const COMMON = { format: "jsonv2", addressdetails: 1, namedetails: 0, "accept-language": "es" };

/** Busca direcciones por texto libre. Devuelve hasta `limit` candidatos ordenados por relevancia. */
export const buscarDireccion = async (texto, { limit = 6, signal } = {}) => {
  const res = await geocoder.get("/search", {
    params: { ...COMMON, q: texto, limit, countrycodes: GEOCODER_COUNTRY },
    signal,
  });
  return res.data;
};

/** Geocodificación inversa de un punto. zoom 18 = nivel edificio/casa. */
export const ubicarPunto = async (lat, lon, { zoom = 18, signal } = {}) => {
  const res = await geocoder.get("/reverse", {
    params: { ...COMMON, lat, lon, zoom },
    signal,
  });
  return res.data;
};
