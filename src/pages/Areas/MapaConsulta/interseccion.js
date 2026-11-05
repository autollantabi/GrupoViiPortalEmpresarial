// Búsqueda por intersección ("Ayacucho y Bernardo Darquea, Riobamba"): aquí solo se interpreta el
// texto; el cruce lo calcula el backend sobre la geometría completa de OSM.

const SEPARADOR = /\s+(?:y|e|&|con|esquina(?:\s+con)?)\s+|\s*\/\s*/i;

/** Devuelve { calleA, calleB, ciudad } si el texto tiene forma de intersección, o null. */
export const parsearInterseccion = (texto) => {
  const [cuerpo, ...resto] = texto.split(",");
  const partes = cuerpo.split(SEPARADOR).map((p) => p.trim()).filter(Boolean);
  if (partes.length !== 2) return null;
  return { calleA: partes[0], calleB: partes[1], ciudad: resto.join(",").trim() };
};
