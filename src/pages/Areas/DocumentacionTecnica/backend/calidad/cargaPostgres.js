/**
 * Carga de Calidad en vivo desde PostgreSQL (core.dim_item). Port de `cargar_desde_postgres` y `homogenizar_tipos`
 * de apps/calidad/motor/calidad_llantas.py.
 *
 * La consulta es la del proyecto Django (activos, de compra, grupos LLANTAS y LLANTAS MOTO) con una diferencia
 * deliberada: NO trae `dit_codigoproveedor` ni `dit_proveedorprincipal` (el código del proveedor). Del proveedor solo
 * se lee el nombre del principal, que sale de core.dim_socios con el mismo código de socio Y la misma empresa.
 * El motor no usa esas dos columnas. Otras columnas (grupo original, propiedad, segmento…) se siguen pidiendo para que
 * el DISTINCT cuente las mismas filas que Django, y se descartan al homogenizar.
 */
import { consultar, ConexionError } from "../postgres.js";
import { COLUMNAS } from "./motor.js";

export const CONSULTA = `
SELECT DISTINCT
    i.dit_creacion_sap,
    i.dit_empresa,
    i.dit_codigo,
    i.dit_lonas,
    i.dit_nombre,
    s.ds_nombre AS dit_proveedorprincipal_nombre,
    i.dit_grupo_original,
    i.dit_grupo,
    i.dit_propiedad,
    i.dit_rin,
    i.dit_serie,
    i.dit_ancho,
    i.dit_velocidad,
    i.dit_carga,
    i.dit_nomenclatura,
    i.dit_categoria,
    i.dit_segmento,
    i.dit_aplicacion,
    i.dit_eje,
    i.dit_medida,
    i.dit_medidarin,
    i.dit_familiarin,
    i.dit_itemrelacionado,
    i.dit_nombrefabricante AS marca,
    i.dit_codigobarras,
    i.dit_disenio
FROM core.dim_item i
LEFT JOIN core.dim_socios s
       ON s.ds_codigosocio = i.dit_proveedorprincipal
      AND s.ds_nombreempresa = i.dit_empresa
WHERE i.dit_activo = 'SI'
  AND i.dit_compra = 'Y'
  AND i.dit_grupo IN ('LLANTAS', 'LLANTAS MOTO')`;

// Conversión de tipos como pandas: fechas como texto (el motor lee los 10 primeros caracteres) y números como números
// (read_sql los devuelve como float), para que `16` y `16.0` lleguen igual que en Django.
const ANALIZADORES = {
  1082: (v) => v, // date
  1114: (v) => v, // timestamp
  1184: (v) => v, // timestamptz
  1700: (v) => parseFloat(v), // numeric
  20: (v) => Number(v), // bigint
};

/** `homogenizar_tipos`: todo queda como texto (enteros sin ".0") y el texto vacío pasa a null. */
export function homogenizar(fila) {
  const salida = {};
  for (const columna of COLUMNAS) {
    const v = fila[columna];
    if (v === null || v === undefined || (typeof v === "number" && Number.isNaN(v))) salida[columna] = null;
    else if (typeof v === "number") salida[columna] = Number.isInteger(v) ? String(v) : String(v);
    else {
      const texto = v instanceof Date ? v.toISOString() : String(v);
      salida[columna] = texto === "" ? null : texto;
    }
  }
  return salida;
}

/** Lee core.dim_item y devuelve las filas crudas que espera el motor. */
export async function cargarFilas() {
  const filas = (await consultar(CONSULTA, ANALIZADORES)).map(homogenizar);
  if (!filas.length) throw new ConexionError("No hay productos que evaluar: la consulta no devolvió filas.");
  return filas;
}
