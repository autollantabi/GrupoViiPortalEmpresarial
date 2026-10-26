/**
 * Fechas de la sección Colaboradores.
 *
 * Regla central: las fechas de negocio son strings ISO 'AAAA-MM-DD' de punta a
 * punta y NUNCA se convierten a Date. Un `new Date("2026-08-20")` se interpreta
 * como UTC medianoche, y al formatearlo en una zona al oeste de Greenwich
 * retrocede un día. Esa clase de bug es imposible de encontrar mirando la
 * pantalla, así que se evita no entrando nunca al tipo Date.
 *
 * Para las marcas de tiempo (que sí son instantes) se usa formatearMomento, que
 * ahí sí necesita Date porque hay que pasar a hora local.
 */

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Hoy en local, como 'AAAA-MM-DD'. Sirve de max en los campos de fecha. */
export const hoyIso = () => {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
};

/** '2026-08-20' → '20 ago 2026'. Sin new Date, a propósito. */
export const formatearFecha = (iso) => {
  if (!iso) return "—";
  const [anio, mes, dia] = String(iso).slice(0, 10).split("-");
  if (!anio || !mes || !dia) return "—";
  const nombreMes = MESES[Number(mes) - 1];
  return nombreMes ? `${Number(dia)} ${nombreMes} ${anio}` : "—";
};

/**
 * Comparación de fechas ISO. Funciona con < porque el formato 'AAAA-MM-DD'
 * ordena igual alfabéticamente que cronológicamente.
 */
export const esAnterior = (fecha, limite) =>
  Boolean(fecha) && Boolean(limite) && String(fecha) < String(limite);

/** Una marca de tiempo ISO en hora local ecuatoriana, para la bitácora. */
export const formatearMomento = (iso) => {
  if (!iso) return "—";
  const momento = new Date(iso);
  if (Number.isNaN(momento.getTime())) return "—";
  return momento.toLocaleString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Días de HOY a `iso` (puede ser negativo si `iso` ya pasó). Se usa para las
 * alertas de período de prueba: "faltan N días".
 *
 * Sí entra a Date acá, pero con Date.UTC y las tres partes por separado (nunca
 * `new Date(iso)`), así que no cae en la trampa de interpretación UTC que evita
 * el resto de este archivo: ambos lados de la resta están en el mismo huso.
 */
export const diasHasta = (iso) => {
  if (!iso) return null;
  const [anio, mes, dia] = String(iso).slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return null;

  const [anioHoy, mesHoy, diaHoy] = hoyIso().split("-").map(Number);

  const msPorDia = 24 * 60 * 60 * 1000;
  const destino = Date.UTC(anio, mes - 1, dia);
  const hoy = Date.UTC(anioHoy, mesHoy - 1, diaHoy);

  return Math.round((destino - hoy) / msPorDia);
};

/**
 * Recorta cualquier cosa a 'AAAA-MM-DD'.
 *
 * Red de seguridad del contrato: si el backend devolviera un datetime en vez de
 * una fecha, el atributo value de un <input type="date"> lo rechaza en silencio,
 * el campo aparece vacío y guardar el formulario BORRA la fecha. Es la trampa
 * más peligrosa de la integración, así que se recorta al entrar.
 */
export const soloFecha = (valor) => {
  if (!valor) return null;
  const texto = String(valor);
  return texto.length >= 10 ? texto.slice(0, 10) : texto;
};
