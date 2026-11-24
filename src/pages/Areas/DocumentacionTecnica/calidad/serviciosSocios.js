import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Calidad de Socios. Los datos los sirve el backend del portal (API 2, v1-portal-empresarial-back-new)
 * en /documentacion-tecnica/calidad-socios/*, con la sesión del portal (cabecera id-session) y el
 * recurso documentaciontecnica.calidad.socios (o su padre documentaciontecnica.calidad).
 */
const BASE = "/documentacion-tecnica/calidad-socios";

/** Arma los parámetros de la URL: los filtros múltiples se repiten (?empresa=A&empresa=B). */
function parametros(filtros, extra = {}) {
  const p = new URLSearchParams();
  Object.entries(filtros).forEach(([nombre, valores]) => valores.forEach((v) => p.append(nombre, v)));
  Object.entries(extra).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) p.append(k, v);
  });
  return p;
}

/** Indicadores y opciones de los filtros (errores propagados). */
export async function DocTec_ObtenerSociosResumen(filtros) {
  const res = await axiosInstanceNew.get(`${BASE}/resumen`, { params: parametros(filtros) });
  return res.data.data;
}

/** Vuelve a leer core.dim_socios ahora, sin esperar al caché del servidor: { ok, identificaciones, fecha_hora }. */
export async function DocTec_ActualizarSocios() {
  const res = await axiosInstanceNew.post(`${BASE}/actualizar`, {}, { timeout: 180000 });
  return res.data.data;
}

/** Identificaciones con variantes, de 100 en 100: { total, siguiente, filas[] }. */
export async function DocTec_ObtenerSociosIdentificaciones(filtros, { q, cantidad, tipoIdentificacion, pagina }) {
  const res = await axiosInstanceNew.get(`${BASE}/identificaciones`, {
    params: parametros(filtros, { q, cantidad, tipo_identificacion: tipoIdentificacion, pagina }),
  });
  return res.data.data;
}

/** Descarga el CSV de las identificaciones con variantes (con Axios, para que viaje la cabecera de sesión). */
export async function DocTec_DescargarSociosCsv(filtros) {
  const res = await axiosInstanceNew.get(`${BASE}/exportar`, { params: parametros(filtros), responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const sello = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "").replace(/^(\d{8})(\d{4})$/, "$1_$2");
  const a = document.createElement("a");
  a.href = url;
  a.download = `socios_con_variantes_${sello}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
