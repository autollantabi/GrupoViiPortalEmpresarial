// Convierte el `address` de Nominatim en la jerarquía territorial usada en Ecuador.
// OSM no tiene un campo fijo por nivel: según el mapeo local, parroquia/cantón caen en
// claves distintas, por eso se toma la primera disponible de cada lista.
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

// Tipos de resultado que implican un punto exacto (no el centro de una zona)
const TIPOS_EXACTOS = new Set(["house", "building", "residential", "yes", "apartments", "commercial", "industrial", "retail", "office"]);

/** Estima qué tan preciso es el resultado para avisar al usuario. */
export const evaluarPrecision = (r) => {
  if (!r) return null;
  const a = r.address || {};
  if (a.house_number || (r.category === "building") || TIPOS_EXACTOS.has(r.type)) {
    return { nivel: "alta", texto: "Punto exacto (edificio / número de casa)" };
  }
  if (a.road || r.addresstype === "road") {
    return { nivel: "media", texto: "Calle: la posición es sobre la vía, no el predio" };
  }
  return { nivel: "baja", texto: "Aproximada: centro de la zona. Ajuste el punto en el mapa" };
};
