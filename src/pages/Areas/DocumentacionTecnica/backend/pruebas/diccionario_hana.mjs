/**
 * Pruebas de la carga del Diccionario desde SAP HANA (backend/hana.js y backend/diccionario/cargaHana.js) SIN conectarse
 * a SAP: usan una conexión simulada con la misma forma que la real.
 *
 * Uso (desde backend/):   node pruebas/diccionario_hana.mjs
 *
 * Qué comprueban: la conversión de valores de HANA a texto, que solo se aceptan SELECT, que los campos sensibles no se
 * consultan, que una consulta que falla no tumba la actualización (y una conexión perdida sí la aborta), que los valores
 * de SAP se combinan con tablas.json sin tocar las definiciones, que una actualización parcial no borra el resto y la
 * revisión de estructura. Con la foto real de tablas.json, una "SAP" que devuelve lo mismo no debe producir cambios.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { valorATexto, HanaError } from "../hana.js";
import { combinar, fusionar, leerDeHana, podar, ORIGEN } from "../diccionario/cargaHana.js";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const base = JSON.parse(fs.readFileSync(path.join(aqui, "..", "diccionario", "datos", "tablas.json"), "utf-8"));
let pruebas = 0;
const prueba = async (nombre, fn) => {
  try {
    await fn();
    pruebas += 1;
  } catch (error) {
    console.error(`FALLA: ${nombre}\n`, error);
    process.exit(1);
  }
};

/* ------------------------------ valores a texto ------------------------------ */

await prueba("valorATexto: nulos, vacíos y textos", () => {
  assert.equal(valorATexto(null, "NVARCHAR"), "NULL");
  assert.equal(valorATexto("", "NVARCHAR"), "(vacío)");
  assert.equal(valorATexto("ABC", "NVARCHAR"), "ABC");
  assert.equal(valorATexto(" 0012 ", "NVARCHAR"), " 0012 "); // un texto se respeta tal cual
  assert.equal(valorATexto("1.50", "NVARCHAR"), "1.50"); // y no se recorta aunque parezca número
});
await prueba("valorATexto: decimales sin ceros sobrantes", () => {
  assert.equal(valorATexto("12.500000", "DECIMAL"), "12.5");
  assert.equal(valorATexto("100.000000", "DECIMAL"), "100");
  assert.equal(valorATexto("0.000000", "DECIMAL"), "0");
  assert.equal(valorATexto("-3.250000", "DECIMAL"), "-3.25");
  assert.equal(valorATexto("1000", "DECIMAL"), "1000"); // sin punto no se tocan los ceros del entero
  assert.equal(valorATexto(7.5, "DOUBLE"), "7.5");
  assert.equal(valorATexto(2, "DOUBLE"), "2");
  assert.equal(valorATexto(1e-7, "DOUBLE"), "0.0000001");
});
await prueba("valorATexto: enteros y fechas", () => {
  assert.equal(valorATexto(42, "INTEGER"), "42");
  assert.equal(valorATexto(106, "SMALLINT"), "106");
  assert.equal(valorATexto(7, "INT"), "7");
  // formatos reales que devuelve @sap/hana-client con SAP (comprobados): decimales como "8.000000" y LONGDATE con nanosegundos
  assert.equal(valorATexto("8.000000", "DECIMAL"), "8");
  assert.equal(valorATexto("2023-01-02 00:00:00.000000000", "LONGDATE"), "2023-01-02");
  assert.equal(valorATexto("2023-01-02 08:30:15.000000000", "LONGDATE"), "2023-01-02 08:30:15");
  assert.equal(valorATexto("9007199254740993", "BIGINT"), "9007199254740993");
  assert.equal(valorATexto(10n, "BIGINT"), "10");
  assert.equal(valorATexto("2024-05-03", "DATE"), "2024-05-03");
  assert.equal(valorATexto("2024-05-03 00:00:00.0000000", "TIMESTAMP"), "2024-05-03"); // sin hora si es medianoche
  assert.equal(valorATexto("2024-05-03 14:25:09.1230000", "TIMESTAMP"), "2024-05-03 14:25:09");
  assert.equal(valorATexto(new Date(2024, 4, 3, 0, 0, 0), "DATE"), "2024-05-03");
});

/* ------------------------------ conexión simulada ------------------------------ */

/**
 * "SAP" de mentira. `muestras["TABLA.campo"]` = { tipo, valores } ; `catalogos[tabla]` = filas ; `sql[texto]` = resultado exacto;
 * `errores["TABLA.campo"]` = código de error de HANA ; `estructura[tabla]` = columnas reales.
 */
function sapSimulado({ muestras = {}, catalogos = {}, sql = {}, errores = {}, estructura = {}, perderEn = null } = {}) {
  const consultas = [];
  const falla = (codigo) => new HanaError(`No se pudo consultar SAP HANA (código ${codigo}).`, codigo);
  return {
    consultas,
    async consultar(texto) {
      if (!/^\s*select\b/i.test(texto)) throw new HanaError("Solo se permiten consultas SELECT de una sola instrucción.");
      consultas.push(texto);
      let m = /^SELECT DISTINCT "([^"]+)" FROM "[^"]*"\."([^"]+)" ORDER BY/.exec(texto);
      if (m) {
        const clave = `${m[2]}.${m[1]}`;
        if (perderEn === clave) throw falla(-10709);
        if (errores[clave]) throw falla(errores[clave]);
        const mu = muestras[clave] ?? { tipo: "NVARCHAR", valores: [] };
        return { columnas: [{ nombre: m[1], tipo: mu.tipo }], filas: mu.valores.map((v) => [v]) };
      }
      m = /^SELECT "([^"]+)", "([^"]+)" FROM "[^"]*"\."([^"]+)" ORDER BY/.exec(texto);
      if (m) {
        if (errores[`cat.${m[3]}`]) throw falla(errores[`cat.${m[3]}`]);
        return { columnas: [{ nombre: m[1], tipo: "NVARCHAR" }, { nombre: m[2], tipo: "NVARCHAR" }], filas: catalogos[m[3]] ?? [] };
      }
      if (texto.includes('"SYS"."TABLE_COLUMNS"')) {
        if (errores.estructura) throw falla(errores.estructura);
        const filas = Object.entries(estructura).flatMap(([tabla, cols]) => cols.map((c) => [tabla, c]));
        return { columnas: [{ nombre: "TABLE_NAME", tipo: "NVARCHAR" }, { nombre: "COLUMN_NAME", tipo: "NVARCHAR" }], filas };
      }
      const r = sql[texto.replace(/;+\s*$/, "")];
      if (r) return r;
      throw falla(259);
    },
    async cerrar() {},
  };
}

/** Diccionario mínimo de dos tablas para las pruebas finas. */
const mini = () => ({
  base: "SBO_PRUEBA",
  modulos: ["M"],
  nombres: {},
  externas: {},
  catalogos: { OWHS: { clave: "WhsCode", nombre: "WhsName", parcial: true, filas: [["viejo", "Viejo"]] } },
  tablas: [
    {
      codigo: "OITM", nombre: "Items", es: "Artículos", modulo: "M", tipo: "T", llave: "ItemCode", desc: "d",
      campos: [["ItemCode", "Código", "d"], ["OnHand", "Stock", "d"], ["CardCode", "Proveedor", "d"], ["Borrado", "Ya no existe", "d"]],
      relaciones: [],
      muestras: { ItemCode: { v: ["A"], n: 5, f: "real", o: "DBeaver" }, CardCode: { v: ["SECRETO"], n: null, f: "real", o: "DBeaver" } },
      joins: { OnHand: { sql: 'SELECT 1 AS "a" FROM "SBO_PRUEBA"."OITM"', cols: ["a"], filas: [["0"]] } },
    },
    {
      codigo: "OWHS", nombre: "Warehouses", es: "Almacenes", modulo: "M", tipo: "T", llave: "WhsCode", desc: "d",
      campos: [["WhsCode", "Código", "d"], ["WhsName", "Nombre", "d"]], relaciones: [], muestras: {}, joins: {},
    },
  ],
});

/* ------------------------------ lectura ------------------------------ */

await prueba("leerDeHana: valores, tipos, orden de catálogos y campos sensibles", async () => {
  const sap = sapSimulado({
    muestras: {
      "OITM.ItemCode": { tipo: "NVARCHAR", valores: ["A", "B"] },
      "OITM.OnHand": { tipo: "DECIMAL", valores: ["0.000000", "12.500000"] },
      "OITM.Borrado": { tipo: "NVARCHAR", valores: [null, ""] },
      "OWHS.WhsCode": { tipo: "NVARCHAR", valores: ["01", "02"] },
      "OWHS.WhsName": { tipo: "NVARCHAR", valores: ["Principal"] },
    },
    catalogos: { OWHS: [["10", "Diez"], ["2", "Dos"], ["1", "Uno"]] },
    sql: { 'SELECT 1 AS "a" FROM "SBO_PRUEBA"."OITM"': { columnas: [{ nombre: "a", tipo: "INTEGER" }], filas: [[1], [2]] } },
    estructura: { OITM: ["ItemCode", "OnHand", "CardCode", "U_Nuevo", "Otro"], OWHS: ["WhsCode", "WhsName"] },
  });
  const { valores, resumen } = await leerDeHana(mini(), { conexion: sap, esquema: "SBO_PRUEBA" });

  assert.deepEqual(valores.muestras.OITM.ItemCode, { v: ["A", "B"], n: 5, f: "real", o: ORIGEN }); // conserva `n`
  assert.deepEqual(valores.muestras.OITM.OnHand.v, ["0", "12.5"]);
  assert.deepEqual(valores.muestras.OITM.Borrado.v, ["NULL", "(vacío)"]);
  assert.ok(!("CardCode" in valores.muestras.OITM), "CardCode no se debe guardar");
  assert.ok(!sap.consultas.some((q) => q.includes('"CardCode"')), "CardCode no se debe consultar");
  assert.deepEqual(valores.joins.OITM.OnHand, [["1"], ["2"]]);
  assert.deepEqual(valores.catalogos.OWHS, { filas: [["1", "Uno"], ["2", "Dos"], ["10", "Diez"]], parcial: false }); // orden numérico

  assert.equal(resumen.muestras_cambiadas, 5);
  assert.equal(resumen.muestras_iguales, 0);
  assert.equal(resumen.joins_cambiados, 1);
  assert.equal(resumen.catalogos_cambiados, 1);
  assert.equal(resumen.fallos.length, 0);
  assert.ok(sap.consultas.every((q) => /^\s*select\b/i.test(q)));
});

await prueba("leerDeHana: una consulta que falla se anota y se conserva el valor anterior", async () => {
  const sap = sapSimulado({
    muestras: { "OITM.ItemCode": { tipo: "NVARCHAR", valores: ["A"] }, "OITM.OnHand": { tipo: "DECIMAL", valores: ["1.0"] } },
    errores: { "OITM.Borrado": 260 },
  });
  const { valores, resumen } = await leerDeHana(mini(), { conexion: sap, esquema: "S" });
  assert.deepEqual(resumen.fallos.find((f) => f.donde === "OITM.Borrado"), { donde: "OITM.Borrado", motivo: "(código 260)" });
  assert.ok(!("Borrado" in valores.muestras.OITM), "lo que falló no se guarda: queda el valor anterior de tablas.json");
  assert.ok(valores.muestras.OITM.OnHand, "los demás campos sí se actualizan");
});

await prueba("leerDeHana: si la tabla no existe no se insiste con cada campo", async () => {
  const sap = sapSimulado({ errores: { "OITM.ItemCode": 259 } });
  const { resumen } = await leerDeHana(mini(), { conexion: sap, esquema: "S", tablas: ["OITM"] });
  const deOitm = resumen.fallos.filter((f) => f.donde.startsWith("OITM."));
  assert.equal(deOitm.length, 1, "un solo fallo para la tabla, no uno por campo");
  assert.ok(!sap.consultas.some((q) => q.includes('"OnHand"') && q.startsWith("SELECT DISTINCT")));
});

await prueba("leerDeHana: si se pierde la conexión se aborta todo", async () => {
  const sap = sapSimulado({ perderEn: "OITM.OnHand" });
  await assert.rejects(leerDeHana(mini(), { conexion: sap, esquema: "S" }), (e) => e instanceof HanaError && e.codigo === -10709);
});

await prueba("leerDeHana: tablas desconocidas y actualización parcial", async () => {
  await assert.rejects(leerDeHana(mini(), { conexion: sapSimulado(), esquema: "S", tablas: ["NOEXISTE"] }), /Tablas desconocidas: NOEXISTE/);
  const sap = sapSimulado({ muestras: { "OWHS.WhsCode": { tipo: "NVARCHAR", valores: ["01"] } } });
  const { valores, resumen } = await leerDeHana(mini(), { conexion: sap, esquema: "S", tablas: ["owhs"] });
  assert.deepEqual(Object.keys(valores.muestras), ["OWHS"]);
  assert.ok(!sap.consultas.some((q) => q.includes('"OITM"')));
  assert.equal(resumen.estructura, null, "una actualización parcial no revisa la estructura");
  assert.deepEqual(resumen.tablas, ["OWHS"]);
});

await prueba("revisión de estructura", async () => {
  const sap = sapSimulado({ estructura: { OITM: ["ItemCode", "OnHand", "CardCode", "Otro", "U_Nuevo", "U_Otro"] } });
  const { resumen } = await leerDeHana(mini(), { conexion: sap, esquema: "S" });
  const e = resumen.estructura;
  assert.equal(e.revisadas, 1);
  assert.deepEqual(e.tablas_inexistentes, ["OWHS"]);
  assert.deepEqual(e.faltan, [{ tabla: "OITM", campo: "Borrado" }]);
  assert.deepEqual(e.sin_documentar, [{ tabla: "OITM", total: 3, de_usuario: 2, columnas: ["U_Nuevo", "U_Otro", "Otro"] }]); // U_ primero
});

await prueba("revisión de estructura: sin permiso sobre SYS no tumba la actualización", async () => {
  const { resumen } = await leerDeHana(mini(), { conexion: sapSimulado({ errores: { estructura: 258 } }), esquema: "S" });
  assert.match(resumen.estructura.error, /258/);
});

/* ------------------------------ combinar y fusionar ------------------------------ */

await prueba("combinar: los valores de SAP pisan los de la foto y las definiciones no cambian", () => {
  const original = mini();
  const copia = JSON.stringify(original);
  const valores = {
    muestras: { OITM: { ItemCode: { v: ["Z"], n: null, f: "real", o: ORIGEN }, Fantasma: { v: ["x"], f: "real" } } },
    joins: { OITM: { OnHand: [["9"]], NoExiste: [["1"]] } },
    catalogos: { OWHS: { filas: [["1", "Uno"]], parcial: false }, OTRA: { filas: [], parcial: false } },
  };
  const datos = combinar(original, valores);
  assert.equal(JSON.stringify(original), copia, "no modifica la base");
  assert.deepEqual(datos.tablas[0].muestras.ItemCode.v, ["Z"]);
  assert.ok(!("Fantasma" in datos.tablas[0].muestras), "un campo que ya no está en tablas.json se ignora");
  assert.deepEqual(datos.tablas[0].muestras.CardCode.v, ["SECRETO"], "lo que SAP no trajo (sensible) conserva la foto");
  assert.deepEqual(datos.tablas[0].joins.OnHand.filas, [["9"]]);
  assert.equal(datos.tablas[0].joins.OnHand.sql, original.tablas[0].joins.OnHand.sql, "el SQL del JOIN sigue siendo el de tablas.json");
  assert.deepEqual(datos.catalogos.OWHS, { clave: "WhsCode", nombre: "WhsName", parcial: false, filas: [["1", "Uno"]] });
  assert.ok(!("OTRA" in datos.catalogos));
  assert.deepEqual(datos.tablas[0].desc, "d");
  assert.equal(combinar(original, null).tablas.length, 2);
});

await prueba("fusionar: una actualización parcial no borra las demás tablas", () => {
  const previos = {
    muestras: { OITM: { A: { v: ["1"] }, B: { v: ["2"] } }, OWHS: { X: { v: ["x"] } } },
    joins: { OITM: { A: [["1"]] } },
    catalogos: { OWHS: { filas: [["1", "a"]], parcial: false } },
  };
  const nuevos = { muestras: { OITM: { B: { v: ["22"] } } }, joins: {}, catalogos: { OITB: { filas: [], parcial: false } } };
  const f = fusionar(previos, nuevos);
  assert.deepEqual(f.muestras.OITM, { A: { v: ["1"] }, B: { v: ["22"] } });
  assert.deepEqual(f.muestras.OWHS, { X: { v: ["x"] } });
  assert.deepEqual(f.joins.OITM, { A: [["1"]] });
  assert.deepEqual(Object.keys(f.catalogos).sort(), ["OITB", "OWHS"]);
  assert.deepEqual(fusionar(null, nuevos).muestras, nuevos.muestras);
});

await prueba("podar: se van los valores de campos, JOIN, tablas y catálogos que ya no están definidos", () => {
  const def = mini(); // OITM: ItemCode, OnHand, CardCode, Borrado (JOIN en OnHand) · OWHS · catálogo OWHS
  const valores = {
    muestras: { OITM: { ItemCode: { v: ["A"] }, U_Retirado: { v: ["x"] } }, TABLA_VIEJA: { X: { v: ["x"] } } },
    joins: { OITM: { OnHand: [["1"]], Otro: [["2"]] } },
    catalogos: { OWHS: { filas: [], parcial: false }, CAT_VIEJO: { filas: [], parcial: false } },
  };
  const p = podar(valores, def);
  assert.deepEqual(Object.keys(p.muestras), ["OITM"]);
  assert.deepEqual(Object.keys(p.muestras.OITM), ["ItemCode"]);
  assert.deepEqual(Object.keys(p.joins.OITM), ["OnHand"]);
  assert.deepEqual(Object.keys(p.catalogos), ["OWHS"]);
  assert.deepEqual(podar({}, def), { muestras: {}, joins: {}, catalogos: {} });
});

/* ------------------------------ con la foto real de tablas.json ------------------------------ */

await prueba("foto real: una SAP que devuelve lo mismo no produce cambios (salvo los campos aún sin muestra)", async () => {
  const muestras = {};
  let esperadas = 0;
  let camposNuevos = 0; // campos agregados a tablas.json que aún no tienen muestra: la primera lectura de SAP cuenta como cambio
  for (const t of base.tablas) {
    for (const [campo] of t.campos) {
      const m = t.muestras?.[campo];
      const sensible = (t.codigo === "OITM" || t.codigo === "OPOR" || t.codigo === "OPQT") && campo === "CardCode";
      if (!m && !sensible) camposNuevos += 1;
      if (!m || sensible) continue;
      muestras[`${t.codigo}.${campo}`] = { tipo: "NVARCHAR", valores: m.v.map((v) => (v === "NULL" ? null : v === "(vacío)" ? "" : v)) };
      esperadas += m.f === "real" ? 1 : 0;
    }
  }
  const sql = {};
  for (const t of base.tablas) {
    for (const j of Object.values(t.joins ?? {})) {
      sql[j.sql.replace(/;+\s*$/, "")] = { columnas: j.cols.map((c) => ({ nombre: c, tipo: "NVARCHAR" })), filas: j.filas.map((f) => f.map((v) => (v === "NULL" ? null : v === "(vacío)" ? "" : v))) };
    }
  }
  const catalogos = Object.fromEntries(Object.entries(base.catalogos).map(([k, c]) => [k, c.filas]));
  const { valores, resumen } = await leerDeHana(base, { conexion: sapSimulado({ muestras, sql, catalogos }), esquema: base.base });

  assert.equal(resumen.muestras_cambiadas, camposNuevos, JSON.stringify(resumen.fallos.slice(0, 3)));
  assert.equal(resumen.joins_cambiados, 0);
  assert.equal(resumen.catalogos_cambiados, 0);
  assert.equal(resumen.fallos.length, 0);
  assert.equal(resumen.muestras_iguales, esperadas);

  // y combinadas con la base quedan idénticas, salvo el origen de las muestras que pasa a «SAP HANA»
  const datos = combinar(base, valores);
  assert.equal(datos.tablas.length, base.tablas.length);
  for (const t of datos.tablas) {
    const original = base.tablas.find((x) => x.codigo === t.codigo);
    assert.deepEqual(t.campos, original.campos);
    assert.deepEqual(t.relaciones, original.relaciones);
    for (const [campo, j] of Object.entries(t.joins ?? {})) assert.deepEqual(j.filas, original.joins[campo].filas);
  }
});

console.log(`OK: ${pruebas} pruebas del Diccionario con SAP simulado.`);
