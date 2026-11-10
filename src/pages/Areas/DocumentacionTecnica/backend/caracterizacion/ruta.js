import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consulta, enviarJson } from "../comun.js";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const DATOS = path.join(aqui, "datos");
const DWH = path.join(aqui, "..", "dwh_mapping", "datos", "tablas_dwh.json");

const leerJson = (ruta, defecto) => (fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, "utf-8")) : defecto);

/** Columnas del DWH mapeadas en la sección DWH mapping, [nombre, columna] en el orden del archivo. */
function columnasDwh() {
  const tablas = leerJson(DWH, { tablas: [] }).tablas;
  return (tablas[0]?.columnas ?? []).map((c) => [c.col, c]);
}

/** ¿La columna del DWH sale de esa tabla y ese campo de SAP? */
function coincide(columna, tabla, campo) {
  if (!columna.tabla.split("+").map((t) => t.trim()).includes(tabla)) return false;
  const origen = columna.campo;
  return origen === campo || (campo === "QryGroupN" && origen.startsWith("QryGroup"));
}

/** Une el atributo del Excel con las columnas del DWH y deja lo que falta como pendiente. */
function resolver(atributo, columnas, ajustes) {
  const porNombre = new Map(columnas);
  let dwh = [...atributo.campos_dwh];
  if (!dwh.length && atributo.tabla && atributo.campo_sap) {
    dwh = columnas.filter(([, c]) => coincide(c, atributo.tabla, atributo.campo_sap)).map(([n]) => n);
  }
  // `campos_sap` (opcional): el campo del DWH se calcula con varios campos de SAP; `regla` explica cómo
  const sap = atributo.campo_sap
    ? {
        campos: atributo.campos_sap?.length ? atributo.campos_sap : [{ campo: atributo.campo_sap, tabla: atributo.tabla }],
        regla: [atributo.regla ?? []].flat(), // lista de frases: la primera es la idea general, las demás los casos
      }
    : null;
  const descripcion = dwh.length === 1 && porNombre.has(dwh[0]) ? porNombre.get(dwh[0]).desc : "";
  const verificar = ajustes[atributo.original]?.verificar ?? "";
  const estado = verificar ? "verificar" : sap && dwh.length ? "completo" : "pendiente";
  // `tabla_dwh` (opcional): si el campo no está en core.dim_item; `regla_dwh` explica cómo se llega a él
  return {
    nombre: atributo.nombre,
    descripcion,
    dwh,
    tabla_dwh: atributo.tabla_dwh || "core.dim_item",
    regla_dwh: atributo.regla_dwh || "",
    sap,
    estado,
    nota: verificar || atributo.nota,
  };
}

/** Asignación de atributos a líneas de negocio (datos/aplica_a_lineas.json). Si falta el archivo, todo aplica a todas. */
function leerAsignacion() {
  const vacio = { lineas: [], atributos: {} };
  const asignacion = leerJson(path.join(DATOS, "aplica_a_lineas.json"), vacio);
  return { ...vacio, ...asignacion };
}

/** Líneas a las que aplica un atributo: null = todas; si no, la lista de claves. */
function lineasDe(asignacion, nombre) {
  const v = asignacion.atributos[nombre];
  return Array.isArray(v) ? v : null;
}
/**
 * Sección Caracterización.
 *   GET /api/documentacion/caracterizacion/?linea=LLANTAS
 *     -> { total, completos, pendientes, verificar,
 *          grupos: [{ n, nombre, atributos: [{ nombre, descripcion, dwh[], sap|null, estado, nota, solo|null }] }],
 *          lineas: [{ clave, nombre, activa }],  linea: clave,  linea_activa: boolean }
 *
 * `linea` (opcional) filtra los atributos que aplican a esa línea de negocio (las del dit_grupo de core.dim_item: LLANTAS, LLANTAS MOTO,
 * LUBRICANTES, HERRAMIENTAS). Sin `linea`, o con una desconocida, se usa la primera activa. Una línea con `activa: false` (hoy Lubricantes y
 * Herramientas) devuelve `grupos: []` y `linea_activa: false`: su caracterización todavía no está definida. Qué líneas hay, cuáles están
 * activas y qué aplica a cada una sale de datos/aplica_a_lineas.json (editable). `solo` indica las líneas de un atributo restringido.
 *
 * estado: "completo" (tiene campo en SAP y en el DWH) | "pendiente" | "verificar" (hay una observación).
 * Los atributos salen de atributos.json (generado del Excel Datos_base_item.xlsx con el comando
 * `cargar_caracterizacion` del proyecto Django) y se cruzan con las columnas del DWH mapping.
 */
export const rutas = {
  "/caracterizacion/": (req, res) => {
    try {
      const columnas = columnasDwh();
      const ajustes = leerJson(path.join(DATOS, "ajustes.json"), {});
      const datos = leerJson(path.join(DATOS, "atributos.json"), { grupos: [] });
      const asignacion = leerAsignacion();
      const nombreDe = Object.fromEntries(asignacion.lineas.map((l) => [l.clave, l.nombre]));
      const pedida = (consulta(req).get("linea") || "").trim().toUpperCase();
      // sin línea (o con una que no existe) se usa la primera activa: no hay vista "Todas"
      const activas = asignacion.lineas.filter((l) => l.activa !== false);
      const linea = asignacion.lineas.some((l) => l.clave === pedida) ? pedida : activas[0]?.clave ?? asignacion.lineas[0]?.clave ?? null;
      // una línea sin activar todavía no tiene caracterización definida: se devuelve vacía
      const lineaActiva = activas.some((l) => l.clave === linea);

      const grupos = (lineaActiva ? datos.grupos : [])
        .map((g) => ({
          n: g.n,
          nombre: g.nombre,
          atributos: g.atributos
            .map((a) => {
              const lineas = lineasDe(asignacion, a.nombre);
              // atributo que en esta línea todavía no tiene origen definido (datos/aplica_a_lineas.json -> pendiente_en)
              const pend = asignacion.pendiente_en?.[a.nombre];
              const sinDefinir = pend && pend.lineas?.includes(linea) ? { estado: "verificar", nota: pend.nota } : {};
              return {
                ...resolver(a, columnas, ajustes),
                ...sinDefinir,
                solo: lineas ? lineas.map((c) => nombreDe[c] ?? c).join(", ") : null,
                _lineas: lineas,
              };
            })
            .filter((a) => !linea || !a._lineas || a._lineas.includes(linea))
            .map(({ _lineas, ...a }) => a),
        }))
        .filter((g) => g.atributos.length > 0);
      const todos = grupos.flatMap((g) => g.atributos);
      const cuenta = (estado) => todos.filter((a) => a.estado === estado).length;
      enviarJson(res, 200, {
        total: todos.length,
        completos: cuenta("completo"),
        pendientes: cuenta("pendiente"),
        verificar: cuenta("verificar"),
        grupos,
        lineas: asignacion.lineas,
        linea,
        linea_activa: lineaActiva,
      });    } catch {
      enviarJson(res, 404, { error: "Faltan los datos de backend/caracterizacion/datos" });
    }
  },
};
