/**
 * Carga del Diccionario (sección 1) desde SAP HANA. Port de `actualizar_diccionario` del proyecto Django, más una
 * revisión de estructura.
 *
 * Qué se trae de SAP (solo SELECT):
 *   - las muestras de cada campo (los 5 primeros valores distintos, en orden ascendente),
 *   - las filas de los catálogos (OWHS, OPLN, OITG, OMRC, OITB y las @MA_*),
 *   - las filas de ejemplo de cada JOIN.
 * Qué NO se toca: las descripciones, relaciones y nombres (se escriben a mano en datos/tablas.json). Por eso lo que
 * viene de SAP se guarda aparte (datos/valores_sap.json) y se combina con tablas.json al servirlo: agregar una tabla o
 * un campo a tablas.json basta para que la próxima actualización lo traiga.
 *
 * Revisión de estructura: compara los campos documentados con las columnas reales de SAP (SYS.TABLE_COLUMNS) y avisa de
 * los que ya no existen y de las columnas sin documentar (los campos de usuario `U_` primero).
 *
 * Los campos sensibles (códigos de proveedor) no se consultan. Funciones `combinar` y `fusionar` puras, para probarlas.
 */
import { conectar, conexionPerdida, esquema, HanaError, valorATexto } from "../hana.js";

export const ORIGEN = "SAP HANA: consulta directa";
const SENSIBLES = new Set(["OITM.CardCode", "OPOR.CardCode", "OPQT.CardCode"]);
const SIN_CATALOGO = new Set(["OITM"]); // demasiado grande: solo se usa para rotular los diagramas
const MAX_SIN_DOCUMENTAR = 300; // nombres de columnas sin documentar que se informan por tabla

const ident = (nombre) => `"${String(nombre).replace(/"/g, '""')}"`;
const literal = (texto) => `'${String(texto).replace(/'/g, "''")}'`;
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const menor = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/* ------------------------------ combinar con tablas.json ------------------------------ */

/**
 * Pone sobre las definiciones de tablas.json los valores de SAP. Devuelve una copia: no modifica `base`.
 * Lo que valores_sap.json trae de una tabla, campo o catálogo que ya no existe en tablas.json se ignora.
 */
export function combinar(base, valores) {
  const datos = structuredClone(base);
  if (!valores) return datos;
  for (const t of datos.tablas) {
    const muestras = valores.muestras?.[t.codigo];
    if (muestras) {
      const campos = new Set(t.campos.map((c) => c[0]));
      t.muestras = { ...(t.muestras ?? {}), ...Object.fromEntries(Object.entries(muestras).filter(([campo]) => campos.has(campo))) };
    }
    for (const [campo, filas] of Object.entries(valores.joins?.[t.codigo] ?? {})) {
      if (t.joins?.[campo]) t.joins[campo].filas = filas;
    }
  }
  for (const [codigo, cat] of Object.entries(valores.catalogos ?? {})) {
    if (datos.catalogos?.[codigo]) {
      datos.catalogos[codigo].filas = cat.filas;
      datos.catalogos[codigo].parcial = cat.parcial ?? false;
    }
  }
  return datos;
}

/** Suma los valores nuevos a los anteriores (una actualización parcial de unas tablas no borra las demás). */
export function fusionar(previos, nuevos) {
  const salida = { muestras: { ...(previos?.muestras ?? {}) }, joins: { ...(previos?.joins ?? {}) }, catalogos: { ...(previos?.catalogos ?? {}) } };
  for (const clave of ["muestras", "joins"]) {
    for (const [tabla, porCampo] of Object.entries(nuevos[clave] ?? {})) salida[clave][tabla] = { ...(salida[clave][tabla] ?? {}), ...porCampo };
  }
  Object.assign(salida.catalogos, nuevos.catalogos ?? {});
  return salida;
}

/**
 * Quita de los valores guardados lo que ya no está definido en tablas.json (un campo, una tabla o un catálogo que se
 * borró): así valores_sap.json siempre refleja las definiciones vigentes y no acumula datos huérfanos.
 */
export function podar(valores, base) {
  const campos = new Map(base.tablas.map((t) => [t.codigo, new Set(t.campos.map((c) => c[0]))]));
  const joins = new Map(base.tablas.map((t) => [t.codigo, new Set(Object.keys(t.joins ?? {}))]));
  const filtrar = (porTabla, vigentes) =>
    Object.fromEntries(
      Object.entries(porTabla ?? {})
        .filter(([tabla]) => vigentes.has(tabla))
        .map(([tabla, porCampo]) => [tabla, Object.fromEntries(Object.entries(porCampo).filter(([campo]) => vigentes.get(tabla).has(campo)))])
    );
  return {
    muestras: filtrar(valores.muestras, campos),
    joins: filtrar(valores.joins, joins),
    catalogos: Object.fromEntries(Object.entries(valores.catalogos ?? {}).filter(([codigo]) => base.catalogos?.[codigo])),
  };
}

/* ------------------------------ lectura de SAP ------------------------------ */

/** Ejecuta una consulta; si falla por algo propio de esa consulta lo anota y devuelve null, y si se perdió la conexión aborta. */
async function intentar(cx, sql, donde, fallos) {
  try {
    return await cx.consultar(sql);
  } catch (error) {
    if (conexionPerdida(error) || !(error instanceof HanaError)) throw error;
    fallos.push({ donde, motivo: error.message.replace(/^No se pudo consultar SAP HANA /, "").replace(/\.$/, "") });
    return null;
  }
}

function filasTexto(resultado) {
  const tipos = resultado.columnas.map((c) => c.tipo);
  return resultado.filas.map((fila) => fila.map((v, i) => valorATexto(v, tipos[i])));
}

async function revisarEstructura(cx, datos, esq) {
  const codigos = datos.tablas.map((t) => t.codigo);
  const lista = codigos.map(literal).join(", ");
  let r;
  try {
    r = await cx.consultar(
      `SELECT "TABLE_NAME", "COLUMN_NAME" FROM "SYS"."TABLE_COLUMNS" WHERE "SCHEMA_NAME" = ${literal(esq)} AND "TABLE_NAME" IN (${lista}) ORDER BY "TABLE_NAME", "POSITION"`
    );
  } catch (error) {
    if (conexionPerdida(error) || !(error instanceof HanaError)) throw error;
    return { error: `No se pudo revisar la estructura ${error.message.replace(/^No se pudo consultar SAP HANA /, "")}` };
  }
  const reales = new Map();
  for (const [tabla, columna] of r.filas) {
    if (!reales.has(tabla)) reales.set(tabla, new Set());
    reales.get(tabla).add(columna);
  }
  const salida = { revisadas: 0, tablas_inexistentes: [], faltan: [], sin_documentar: [] };
  for (const t of datos.tablas) {
    const existentes = reales.get(t.codigo);
    if (!existentes) {
      salida.tablas_inexistentes.push(t.codigo);
      continue;
    }
    salida.revisadas += 1;
    const documentados = new Set(t.campos.map((c) => c[0]));
    for (const c of documentados) if (!existentes.has(c)) salida.faltan.push({ tabla: t.codigo, campo: c });
    const sobran = [...existentes].filter((c) => !documentados.has(c)).sort((a, b) => Number(b.startsWith("U_")) - Number(a.startsWith("U_")) || menor(a, b));
    if (sobran.length) {
      salida.sin_documentar.push({
        tabla: t.codigo,
        total: sobran.length,
        de_usuario: sobran.filter((c) => c.startsWith("U_")).length,
        columnas: sobran.slice(0, MAX_SIN_DOCUMENTAR),
      });
    }
  }
  return salida;
}

/**
 * Consulta SAP y devuelve { valores, resumen }.
 *   datos   -> diccionario vigente (definiciones + valores actuales), para saber qué consultar y qué cambió
 *   tablas  -> (opcional) códigos de las tablas a actualizar; por defecto, todas
 *   conexion, esquema -> (opcionales, para pruebas) una conexión ya abierta con la forma de hana.js y el esquema a usar
 * Si una consulta falla (campo que ya no existe, sin permiso) se anota y se conserva el valor anterior; si se pierde la
 * conexión, se aborta toda la actualización con ConexionError.
 */
export async function leerDeHana(datos, { tablas = null, conexion = null, esquema: esquemaDado = null } = {}) {
  const inicio = Date.now();
  const esq = esquemaDado ?? esquema();
  const quedan = tablas?.length ? new Set(tablas.map((t) => t.toUpperCase())) : null;
  if (quedan) {
    const conocidos = new Set(datos.tablas.map((t) => t.codigo.toUpperCase()));
    const raras = [...quedan].filter((t) => !conocidos.has(t));
    if (raras.length) throw new HanaError(`Tablas desconocidas: ${raras.join(", ")}.`);
  }

  const valores = { muestras: {}, joins: {}, catalogos: {} };
  const resumen = { muestras_cambiadas: 0, muestras_iguales: 0, catalogos_cambiados: 0, joins_cambiados: 0, fallos: [] };
  const fallos = resumen.fallos;

  const cx = conexion ?? (await conectar());
  try {
    for (const t of datos.tablas) {
      if (quedan && !quedan.has(t.codigo.toUpperCase())) continue;
      const tabla = `${ident(esq)}.${ident(t.codigo)}`;
      const fallosAntes = fallos.length;
      for (const [campo] of t.campos) {
        if (SENSIBLES.has(`${t.codigo}.${campo}`)) continue;
        const r = await intentar(cx, `SELECT DISTINCT ${ident(campo)} FROM ${tabla} ORDER BY ${ident(campo)} ASC LIMIT 5`, `${t.codigo}.${campo}`, fallos);
        if (!r) {
          // si la tabla no existe o no se puede leer, no se insiste con cada uno de sus campos
          if (/código (259|258)\b/.test(fallos.at(-1)?.motivo ?? "") && fallos.length === fallosAntes + 1) break;
          continue;
        }
        const nuevos = filasTexto(r).map((f) => f[0]);
        const previo = t.muestras?.[campo] ?? {};
        if (igual(previo.v, nuevos) && previo.f === "real") resumen.muestras_iguales += 1;
        else resumen.muestras_cambiadas += 1;
        (valores.muestras[t.codigo] ??= {})[campo] = { v: nuevos, n: previo.n ?? null, f: "real", o: ORIGEN };
      }
      for (const [campo, j] of Object.entries(t.joins ?? {})) {
        const r = await intentar(cx, j.sql, `${t.codigo} JOIN ${campo}`, fallos);
        if (!r) continue;
        const nuevas = filasTexto(r);
        if (!igual(nuevas, j.filas)) resumen.joins_cambiados += 1;
        (valores.joins[t.codigo] ??= {})[campo] = nuevas;
      }
    }

    for (const [codigo, cat] of Object.entries(datos.catalogos ?? {})) {
      if (SIN_CATALOGO.has(codigo) || (quedan && !quedan.has(codigo.toUpperCase()))) continue;
      const r = await intentar(cx, `SELECT ${ident(cat.clave)}, ${ident(cat.nombre)} FROM ${ident(esq)}.${ident(codigo)} ORDER BY ${ident(cat.clave)} ASC`, `catálogo ${codigo}`, fallos);
      if (!r) continue;
      const nuevas = filasTexto(r);
      // códigos de texto que son números: orden numérico (1, 2, 10) y no de texto (1, 10, 2)
      if (nuevas.every((f) => /^\d+$/.test(f[0]))) nuevas.sort((a, b) => (BigInt(a[0]) < BigInt(b[0]) ? -1 : BigInt(a[0]) > BigInt(b[0]) ? 1 : 0));
      if (!igual(nuevas, cat.filas)) resumen.catalogos_cambiados += 1;
      valores.catalogos[codigo] = { filas: nuevas, parcial: false };
    }

    resumen.estructura = quedan ? null : await revisarEstructura(cx, datos, esq);
  } finally {
    await cx.cerrar();
  }

  resumen.tablas = quedan ? [...quedan].sort() : null;
  resumen.duracion_ms = Date.now() - inicio;
  return { valores, resumen };
}
