import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Calidad de datos del catálogo de llantas. Los datos los sirve el backend del portal (API 2,
 * v1-portal-empresarial-back-new) en /documentacion-tecnica/calidad/*, con la sesión del portal
 * y el recurso documentaciontecnica.calidad.
 */
const BASE = "/documentacion-tecnica/calidad";

/**
 * Arma los parámetros de la URL a partir de los filtros generales. Los filtros múltiples se repiten
 * (?empresa=A&empresa=B); el rango de puntaje y la búsqueda solo se envían si no están por defecto.
 */
function parametros({ filtros, pmin, pmax, q }, extra = {}) {
  const p = new URLSearchParams();
  Object.entries(filtros).forEach(([nombre, valores]) => valores.forEach((v) => p.append(nombre, v)));
  if (pmin !== "0.00") p.append("pmin", pmin);
  if (pmax !== "1.00") p.append("pmax", pmax);
  if (q) p.append("q", q);
  Object.entries(extra).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((x) => p.append(k, x));
    else if (v !== "" && v !== null && v !== undefined) p.append(k, v);
  });
  return p;
}

/** Resumen, opciones de filtros y gráficos del detalle (errores propagados). */
export async function DocTec_ObtenerCalidadResumen(aplicados, atributo) {
  const res = await axiosInstanceNew.get(`${BASE}/resumen`, { params: parametros(aplicados, { atributo }) });
  return res.data.data;
}

/** Filas de la tabla de detalle, de 150 en 150: { total, siguiente, general, columnas_estado[], filas[] }. */
export async function DocTec_ObtenerCalidadFilas(aplicados, atributo, estado, pagina) {
  const res = await axiosInstanceNew.get(`${BASE}/filas`, { params: parametros(aplicados, { atributo, estado, pagina }) });
  return res.data.data;
}

/** Sugerencias del buscador (código | nombre) sobre los productos que pasan los demás filtros. */
export async function DocTec_BuscarCalidad(aplicados, texto) {
  const res = await axiosInstanceNew.get(`${BASE}/buscar`, { params: parametros({ ...aplicados, q: texto }) });
  return res.data.data;
}

/** Evolución semanal y comparación entre dos semanas (no depende de los filtros). */
export async function DocTec_ObtenerCalidadEvolucion(ant, act) {
  const res = await axiosInstanceNew.get(`${BASE}/evolucion`, { params: parametros({ filtros: {}, pmin: "0.00", pmax: "1.00", q: "" }, { ant, act }) });
  return res.data.data;
}

/**
 * Recalcula la calidad leyendo la base (puede tardar unos segundos): { ok, productos, corrida }.
 * Falla con 503 si no hay credenciales o la base no responde; el mensaje viene en res.data.message.
 */
export async function DocTec_ActualizarCalidad() {
  const res = await axiosInstanceNew.post(`${BASE}/actualizar`, null, { timeout: 180000 });
  return res.data.data;
}

/** Descarga el CSV de la vista actual. Se pide con Axios para que viaje la cabecera de sesión del portal. */
export async function DocTec_DescargarCalidadCsv(aplicados, atributo, estado) {
  const res = await axiosInstanceNew.get(`${BASE}/exportar`, {
    params: parametros(aplicados, { atributo, estado }),
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data);
  const sello = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "").replace(/^(\d{8})(\d{4})$/, "$1_$2");
  const a = document.createElement("a");
  a.href = url;
  a.download = `calidad_${atributo.toLowerCase()}_${sello}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
