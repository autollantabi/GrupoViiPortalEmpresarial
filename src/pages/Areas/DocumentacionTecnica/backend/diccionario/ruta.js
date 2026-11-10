import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consulta, enviarJson } from "../comun.js";
import "../entorno.js";
import { configurada } from "../hana.js";
import { combinar, fusionar, leerDeHana, podar } from "./cargaHana.js";

const CARPETA = path.join(path.dirname(fileURLToPath(import.meta.url)), "datos");
const BASE = path.join(CARPETA, "tablas.json"); // definiciones escritas a mano + foto de valores de Django
const VALORES = path.join(CARPETA, "valores_sap.json"); // lo que deja «Actualizar desde SAP» (si existe, pisa los valores de la foto)

/* ------------------------------ datos (con caché por fecha de archivo) ------------------------------ */

const leer = (archivo) => (fs.existsSync(archivo) ? JSON.parse(fs.readFileSync(archivo, "utf-8")) : null);
const fecha = (archivo) => (fs.existsSync(archivo) ? fs.statSync(archivo).mtimeMs : 0);

let cache = null;
/** { base, valores, datos }: `datos` son las definiciones de tablas.json con los valores de SAP encima. */
function cargar() {
  const firma = `${fecha(BASE)}|${fecha(VALORES)}`;
  if (!cache || cache.firma !== firma) {
    const base = leer(BASE);
    const valores = leer(VALORES);
    cache = { firma, base, valores, datos: combinar(base, valores) };
  }
  return cache;
}

/* ------------------------------ actualización desde SAP ------------------------------ */

let actualizando = null;
/**
 * Consulta SAP HANA (solo SELECT) y guarda los valores en valores_sap.json con una escritura atómica (se escribe un
 * temporal y se renombra, así una lectura nunca ve el archivo a medias). Varias peticiones simultáneas comparten la
 * misma ejecución. `tablas` (opcional) limita la actualización a esas tablas; las demás conservan sus valores.
 */
function actualizar(tablas) {
  if (!actualizando) {
    actualizando = (async () => {
      const { datos, valores: previos } = cargar();
      const { valores, resumen } = await leerDeHana(datos, { tablas });
      const fusionados = podar(fusionar(previos, valores), datos);
      const actualizacion = { fecha_hora: new Date().toISOString(), origen: "SAP HANA", ...resumen };
      // una actualización parcial no tiene revisión de estructura propia: conserva la última completa
      if (!actualizacion.estructura && previos?.actualizacion?.estructura) actualizacion.estructura = previos.actualizacion.estructura;
      const temporal = `${VALORES}.tmp`;
      fs.writeFileSync(temporal, JSON.stringify({ actualizacion, ...fusionados }), "utf-8");
      fs.renameSync(temporal, VALORES);
      return { ok: true, actualizacion };
    })().finally(() => {
      actualizando = null;
    });
  }
  return actualizando;
}

/**
 * Sección Diccionario (SAP B1).
 *   GET /api/documentacion/diccionario/
 *     -> { base, modulos[], tablas[], nombres{}, externas{}, catalogos{},
 *          puede_actualizar, actualizacion|null }
 *   `actualizacion` (null si nunca se actualizó desde SAP):
 *     { fecha_hora, origen, tablas|null, muestras_cambiadas, muestras_iguales, catalogos_cambiados, joins_cambiados,
 *       fallos[{ donde, motivo }], duracion_ms,
 *       estructura: { revisadas, tablas_inexistentes[], faltan[{ tabla, campo }],
 *                     sin_documentar[{ tabla, total, de_usuario, columnas[] }] } | { error } | null }
 *
 *   POST /api/documentacion/diccionario/actualizar/   (rutasPost; ?tabla=OITM repetible para actualizar solo algunas)
 *     -> { ok, actualizacion }
 *        Consulta SAP HANA con solo SELECT y guarda los valores. 503 si no hay credenciales o SAP no responde.
 *
 * Las descripciones, relaciones y nombres salen de datos/tablas.json (escritos a mano). Los valores reales (muestras de
 * cada campo, catálogos y filas de ejemplo de los JOIN) salen de datos/valores_sap.json si existe y, si no, de la foto
 * que trae tablas.json. En producción este diccionario lo sirve la API detrás de la validación de sesión del portal.
 */
export const rutas = {
  "/diccionario/": (req, res) => {
    try {
      const { datos, valores } = cargar();
      enviarJson(res, 200, { ...datos, puede_actualizar: configurada(), actualizacion: valores?.actualizacion ?? null });
    } catch {
      enviarJson(res, 404, { error: "Falta el archivo de datos de esta sección" });
    }
  },
};

/** Rutas que cambian datos (POST). apiSimulada solo las atiende con ese método. */
export const rutasPost = {
  "/diccionario/actualizar/": async (req, res) => enviarJson(res, 200, await actualizar(consulta(req).getAll("tabla"))),
};
