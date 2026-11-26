import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Horarios de procesos (DWH → DF → MS). Los sirve el backend del portal (API 2) en
 * /documentacion-tecnica/horarios, con la sesión del portal y el recurso documentaciontecnica.horarios.
 * Los errores se propagan: el 400 (estructura inválida) y el 409 (otra persona guardó antes) traen `message`.
 */
const BASE = "/documentacion-tecnica/horarios";

/** Calendario guardado (o la propuesta inicial): { revision, oficina, espera_ms_min, procesos[], actualizado, personalizado, alertas[] }. */
export async function DocTec_ObtenerHorarios() {
  const res = await axiosInstanceNew.get(BASE);
  return res.data.data;
}

/** Revisa un borrador sin guardarlo: { alertas[] }. */
export async function DocTec_ValidarHorarios(borrador) {
  const res = await axiosInstanceNew.post(`${BASE}/validar`, borrador);
  return res.data.data;
}

/** Guarda el calendario editado (debe llevar la `revision` que se leyó). */
export async function DocTec_GuardarHorarios(borrador) {
  const res = await axiosInstanceNew.put(BASE, borrador);
  return res.data.data;
}

/** Vuelve a la propuesta inicial. */
export async function DocTec_RestaurarHorarios() {
  const res = await axiosInstanceNew.post(`${BASE}/restaurar`);
  return res.data.data;
}
