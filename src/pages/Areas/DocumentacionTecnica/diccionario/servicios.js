import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Servicios del módulo «Documentación Técnica». Los datos los sirve el backend del portal (API 2,
 * v1-portal-empresarial-back-new) en /documentacion-tecnica/*, con la sesión del portal.
 * A diferencia de otros servicios del portal, los errores SÍ se propagan (throw):
 * la pantalla distingue "sin datos" de "la API falló" y muestra un mensaje.
 */

/**
 * Diccionario SAP B1: { base, modulos[], tablas[], nombres{}, externas{}, catalogos{}, puede_actualizar, actualizacion|null }
 * `actualizacion` es el resumen de la última lectura de SAP (fecha, cambios, fallos y revisión de estructura).
 */
export async function DocTec_ObtenerDiccionario() {
  const res = await axiosInstanceNew.get("/documentacion-tecnica/diccionario");
  return res.data.data;
}

/**
 * Vuelve a leer SAP HANA (solo SELECT) y guarda los valores reales: { ok, actualizacion }. Puede tardar un minuto.
 * Falla con 503 si no hay credenciales o SAP no responde; el mensaje viene en res.data.message.
 */
export async function DocTec_ActualizarDiccionario() {
  const res = await axiosInstanceNew.post("/documentacion-tecnica/diccionario/actualizar", null, { timeout: 600000 });
  return res.data.data;
}
