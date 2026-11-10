import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enviarJson } from "../comun.js";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const DATOS = path.join(aqui, "datos", "tablas_dwh.json");
const DICCIONARIO = path.join(aqui, "..", "diccionario", "datos", "tablas.json");

/** Códigos de las tablas que ya documenta el Diccionario, para enlazar cada fila a su tabla. */
function codigosDiccionario() {
  try {
    return JSON.parse(fs.readFileSync(DICCIONARIO, "utf-8")).tablas.map((t) => t.codigo);
  } catch {
    return [];
  }
}

/**
 * Sección DWH mapping.
 *   GET /api/documentacion/dwh-mapping/
 *     -> { tablas: [{ id, esquema, nombre, titulo, descripcion, origen_principal, categorias[], columnas[] }],
 *          codigos_diccionario: string[] }
 *
 * Cada columna: { col, desc, cat, tabla, tabla_desc, campo, dest_tabla, dest_desc, dest_tag,
 *                 regla_corta, regla_texto, apoyo?[], muestras[], guia? }.
 * `guia` (tipo "lookup") describe una regla de correspondencia: { filas[], excepcion, sin_coincidencia, talend, … }.
 */
export const rutas = {
  "/dwh-mapping/": (req, res) => {
    try {
      const catalogo = JSON.parse(fs.readFileSync(DATOS, "utf-8"));
      enviarJson(res, 200, { ...catalogo, codigos_diccionario: codigosDiccionario() });
    } catch {
      enviarJson(res, 404, { error: "Falta backend/dwh_mapping/datos/tablas_dwh.json" });
    }
  },
};
