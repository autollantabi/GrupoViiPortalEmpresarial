// Convierte el `address` que entrega el backend (claves estilo Nominatim, armadas desde Google) en la
// jerarquía territorial de Ecuador. Se toma la primera clave disponible de cada nivel.
const NIVELES = [
  { label: "Provincia", keys: ["state", "region"] },
  { label: "Cantón", keys: ["county", "municipality", "city"] },
  { label: "Ciudad / Localidad", keys: ["city", "town", "village"] },
  { label: "Parroquia", keys: ["city_district", "suburb", "municipality"] },
  { label: "Comunidad / Barrio", keys: ["hamlet", "neighbourhood", "quarter", "suburb", "locality"] },
  { label: "Calle", keys: ["road", "pedestrian", "footway"] },
  { label: "Número", keys: ["house_number"] },
  { label: "Referencia", keys: ["amenity", "building", "shop", "office", "tourism"] },
  { label: "Código postal", keys: ["postcode"] },
  { label: "País", keys: ["country"] },
];

export const desglosarDireccion = (address = {}) => {
  const usados = new Set();
  const filas = [];
  for (const { label, keys } of NIVELES) {
    // Evita repetir el mismo valor en dos niveles (p. ej. suburb como parroquia y como barrio)
    const key = keys.find((k) => address[k] && !usados.has(address[k]));
    if (key) {
      usados.add(address[key]);
      filas.push({ label, valor: address[key], origen: key });
    }
  }
  return filas;
};

/** Estima qué tan preciso es el resultado para avisar al usuario. */
export const evaluarPrecision = (r) => {
  if (!r) return null;
  const a = r.address || {};
  if (r.category === "interseccion") {
    return { nivel: "alta", texto: "Cruce de dos calles" };
  }
  // Solo un edificio o un número de casa es un punto exacto; una calle (category "highway") no
  if (a.house_number || r.category === "building") {
    return { nivel: "alta", texto: "Punto exacto (edificio / número de casa)" };
  }
  if (a.road || r.category === "highway" || r.addresstype === "road") {
    return { nivel: "media", texto: "Calle: la posición es sobre la vía, no el predio" };
  }
  return { nivel: "baja", texto: "Aproximada: centro de la zona. Ajuste el punto en el mapa" };
};
