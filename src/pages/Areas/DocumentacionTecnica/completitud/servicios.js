import { apiDocTec } from "../api";

/** Arma los parámetros de la URL: los filtros múltiples se repiten (?empresa=A&empresa=B). */
function parametros(filtros, extra = {}) {
  const p = new URLSearchParams();
  Object.entries(filtros).forEach(([nombre, valores]) => valores.forEach((v) => p.append(nombre, v)));
  Object.entries(extra).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) p.append(k, v);
  });
  return p;
}

/** Resumen con indicadores, ranking, campos, matriz y opciones de los filtros (errores propagados). */
export async function DocTec_ObtenerCompletitudResumen(filtros) {
  const res = await apiDocTec.get("/completitud/resumen/", { params: parametros(filtros) });
  return res.data;
}

/** Productos a corregir o a revisar, de 100 en 100: { total, siguiente, filas[] }. */
export async function DocTec_ObtenerCompletitudProductos(filtros, { vista, q, n, campo, pagina }) {
  const res = await apiDocTec.get("/completitud/productos/", { params: parametros(filtros, { vista, q, n, campo, pagina }) });
  return res.data;
}

export async function DocTec_ObtenerCompletitudDuplicados(filtros) {
  const res = await apiDocTec.get("/completitud/duplicados/", { params: parametros(filtros) });
  return res.data.duplicados;
}

/**
 * Descarga el CSV de productos a corregir. Se pide con Axios (no con un enlace directo) para que
 * viaje la cabecera de sesión del portal.
 */
export async function DocTec_DescargarCompletitudCsv(filtros) {
  const res = await apiDocTec.get("/completitud/exportar/", {
    params: parametros(filtros, { formato: "csv" }),
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data);
  const sello = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "").replace(/^(\d{8})(\d{4})$/, "$1_$2");
  const a = document.createElement("a");
  a.href = url;
  a.download = `productos_a_corregir_${sello}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
