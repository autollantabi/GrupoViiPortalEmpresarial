// Convierte el `address` que entrega el backend (claves estilo Nominatim, armadas desde Google) en la
// jerarquía territorial de Ecuador. Se toma la primera clave disponible de cada nivel.
const NIVELES = [
  { label: "Provincia", keys: ["state", "region"] },
  { label: "Cantón", keys: ["county", "municipality"] },
  { label: "Ciudad / Localidad", keys: ["city", "town", "village"] },
  { label: "Parroquia", keys: ["city_district", "suburb"] },
  { label: "Comunidad / Barrio", keys: ["hamlet", "neighbourhood", "quarter", "suburb", "locality"] },
  { label: "Calle", keys: ["road", "pedestrian", "footway"] },
  { label: "País", keys: ["country"] },
];

export const SIN_DATO = "-";

// Devuelve siempre todos los niveles: los que la fuente no trae salen con un guion.
// `fuentes` indica de dónde viene un dato que no es de Google (ej. { parroquia: "INEC" })
export const desglosarDireccion = (address = {}, fuentes = {}) => {
  // Solo parroquia y barrio comparten claves (suburb): ahí se evita repetir el mismo valor
  const usados = new Set();
  return NIVELES.map(({ label, keys }) => {
    const comparte = label === "Parroquia" || label === "Comunidad / Barrio";
    const key = keys.find((k) => address[k] && !(comparte && usados.has(address[k])));
    if (key && comparte) usados.add(address[key]);
    const origen = label === "Parroquia" && key === "city_district" && fuentes.parroquia ? fuentes.parroquia : key || "sin dato";
    return { label, valor: key ? address[key] : SIN_DATO, origen };
  });
};

/** Estima qué tan preciso es el resultado para avisar al usuario. */
export const evaluarPrecision = (r) => {
  if (!r) return null;
  const a = r.address || {};
  if (r.category === "interseccion") {
    return { nivel: "alta", texto: "Cruce de dos calles" };
  }
  // Clic o arrastre: la dirección es la más cercana que conoce Google, no necesariamente la del punto marcado
  if (r.esPuntoManual) {
    return { nivel: "media", texto: "Dirección más cercana al punto marcado" };
  }
  // Solo un predio que Google ubica exacto (ROOFTOP) es un punto exacto; un número estimado o una calle no
  if (r.location_type === "ROOFTOP" && (a.house_number || r.category === "building")) {
    return { nivel: "alta", texto: "Punto exacto (edificio / número de casa)" };
  }
  if (r.location_type === "RANGE_INTERPOLATED") {
    return { nivel: "media", texto: "Número estimado entre dos puntos de la calle" };
  }
  if (a.road || r.category === "highway" || r.addresstype === "road") {
    return { nivel: "media", texto: "Calle: la posición es sobre la vía, no el predio" };
  }
  return { nivel: "baja", texto: "Aproximada: centro de la zona. Ajuste el punto en el mapa" };
};
