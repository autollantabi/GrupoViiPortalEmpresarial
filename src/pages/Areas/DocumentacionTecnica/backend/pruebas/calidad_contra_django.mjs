/**
 * Prueba de regresión del motor de calidad (backend/calidad/motor.js) contra lo que calculó Django con pandas.
 *
 * Uso (desde backend/):   node pruebas/calidad_contra_django.mjs [ruta-del-json-de-django]
 *
 * calidad.json trae, por cada producto, el nombre y el valor de la base de cada atributo, es decir, las columnas que
 * el motor lee. Con ellas se reconstruyen las filas crudas, se vuelve a calcular todo en Node y se compara contra lo
 * que Django guardó: estado, valor extraído del nombre, puntaje y tipo de cada producto, y los resúmenes por atributo y
 * por empresa de la corrida de detalle. No necesita base de datos.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calcularCalidad } from "../calidad/motor.js";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const vivo = process.argv.includes("--vivo");
const archivo = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? path.join(aqui, "..", "calidad", "datos", "calidad.json");
if (!fs.existsSync(archivo)) {
  console.log(
    `OMITIDA: falta ${archivo}.\nEsta prueba compara contra la foto de Django (calidad.json), que no se sube al repositorio por contener el catálogo real.\n` +
      "Pásale la ruta de ese archivo como argumento para correrla: node pruebas/calidad_contra_django.mjs <ruta-a-calidad.json>"
  );
  process.exit(0);
}
const d = JSON.parse(fs.readFileSync(archivo, "utf-8"));

const vacioANull = (v) => (v === undefined || v === "" ? null : v);
// Con --vivo las filas salen de PostgreSQL (prueba además la carga); si no, se reconstruyen desde el JSON de Django.
// Ojo: con --vivo solo coincide si la base no cambió desde que Django calculó ese JSON.
const filas = vivo ? (await (await import("../calidad/cargaPostgres.js")).cargarFilas()) : d.items.map((i) => ({
  dit_creacion_sap: i.fecha_creacion,
  dit_empresa: i.empresa,
  dit_codigo: i.codigo,
  dit_nombre: vacioANull(i.nombre),
  dit_proveedorprincipal_nombre: vacioANull(i.proveedor),
  dit_grupo: vacioANull(i.grupo),
  dit_categoria: vacioANull(i.a.GRUPO?.[3]),
  marca: vacioANull(i.a.MARCA[0]),
  dit_nomenclatura: vacioANull(i.a.NOMENCLATURA[0]),
  dit_carga: vacioANull(i.a.CARGA[0]),
  dit_velocidad: vacioANull(i.a.VELOCIDAD[0]),
  dit_lonas: vacioANull(i.a.LONAS[0]),
  dit_ancho: vacioANull(i.a.ANCHO[0]),
  dit_serie: vacioANull(i.a.SERIE[0]),
  dit_rin: vacioANull(i.a.RIN[0]),
  dit_disenio: vacioANull(i.a.DISENIO[0]),
  dit_medida: vacioANull(i.a.MEDIDA[0]),
}));
if (vivo) console.log(`PostgreSQL: ${filas.length} filas leídas`);

const t0 = Date.now();
const nuevo = calcularCalidad(filas);
console.log(`Motor: ${filas.length} productos en ${Date.now() - t0} ms`);

const clave = (i) => `${i.empresa}\u0000${i.codigo}`;
const esperados = new Map(d.items.map((i) => [clave(i), i]));
let diferencias = 0;
const muestra = [];
const porCampo = {};
const anota = (campo, i, esperado, obtenido) => {
  diferencias += 1;
  porCampo[campo] = (porCampo[campo] ?? 0) + 1;
  if (muestra.length < 15) muestra.push({ campo, codigo: i.codigo, nombre: i.nombre, esperado, obtenido });
};

for (const n of nuevo.items) {
  const e = esperados.get(clave(n));
  if (!e) {
    anota("producto", n, "no existe", "existe");
    continue;
  }
  for (const campo of ["tipo_producto", "es_llanta", "grupo", "marca", "proveedor", "fecha_creacion", "score"]) {
    if (e[campo] !== n[campo]) anota(campo, n, e[campo], n[campo]);
  }
  for (const atributo of Object.keys(e.a)) {
    const a = e.a[atributo];
    const b = n.a[atributo];
    if (!b) continue; // GRUPO: Django todavía lo evalúa, este motor ya no
    ["bd", "extraido", "estado", "extra"].forEach((nombre, k) => {
      if (a[k] !== b[k]) anota(`${atributo}.${nombre}`, n, a[k], b[k]);
    });
  }
}

// Resúmenes de la corrida de detalle
const corrida = d.corridas.find((c) => c.id === d.corrida_detalle);
const compara = (nombre, esperado, obtenido) => {
  if (JSON.stringify(esperado) !== JSON.stringify(obtenido)) {
    diferencias += 1;
    porCampo[nombre] = (porCampo[nombre] ?? 0) + 1;
    muestra.push({ campo: nombre, esperado, obtenido });
  }
};
compara("registros", corrida.registros, nuevo.registros);
compara("indice_general", corrida.indice_general, nuevo.indice);
for (const r of d.resumen_atributos.filter((x) => x.corrida_id === corrida.id && x.atributo !== "GRUPO")) {
  const { corrida_id, ...esperado } = r;
  compara(`resumen ${r.atributo}`, esperado, nuevo.resumenAtributos.find((x) => x.atributo === r.atributo));
}
for (const r of d.resumen_empresas.filter((x) => x.corrida_id === corrida.id)) {
  const { corrida_id, ...esperado } = r;
  compara(`empresa ${r.empresa}`, esperado, nuevo.resumenEmpresas.find((x) => x.empresa === r.empresa));
}
const histEsperado = d.historial.filter((h) => h[0] === corrida.id).map(([, e, c, s]) => [e, c, s]);
compara("historial", histEsperado.length, nuevo.historial.length);
const hs = new Map(histEsperado.map(([e, c, s]) => [`${e}\u0000${c}`, s]));
for (const [e, c, s] of nuevo.historial) if (hs.get(`${e}\u0000${c}`) !== s) compara(`historial ${e} ${c}`, hs.get(`${e}\u0000${c}`), s);
compara("perfiles", d.perfiles, nuevo.perfiles);

// Historial semanal (backend/calidad/actualizar.js)
const { armarDatos, viernesDeLaSemana } = await import("../calidad/actualizar.js");
const viernes = (anio, mes, dia) => viernesDeLaSemana(new Date(anio, mes - 1, dia, 12));
compara("viernes del lunes", "2026-11-13", viernes(2026, 11, 9));
compara("viernes del viernes", "2026-11-06", viernes(2026, 11, 6));
compara("viernes del domingo", "2026-11-06", viernes(2026, 11, 8));
compara("viernes del sábado (la semana va de lunes a domingo)", "2026-11-06", viernes(2026, 11, 7));

const idsMax = Math.max(...d.corridas.map((c) => c.id));
const mismaSemana = armarDatos(d, nuevo, new Date(2026, 10, 6, 12)); // la semana de la última corrida de Django
compara("misma semana: corridas", [1, idsMax + 1], mismaSemana.corridas.map((c) => c.id));
compara("misma semana: sin resúmenes viejos", false, mismaSemana.resumen_atributos.some((r) => r.corrida_id === corrida.id));
compara("misma semana: sin historial viejo", false, mismaSemana.historial.some((h) => h[0] === corrida.id));
compara("misma semana: conserva la semana anterior", d.historial.filter((h) => h[0] === 1).length, mismaSemana.historial.filter((h) => h[0] === 1).length);
compara("misma semana: detalle", idsMax + 1, mismaSemana.corrida_detalle);
const otraSemana = armarDatos(d, nuevo, new Date(2026, 10, 13, 12));
compara("otra semana: corridas", [1, idsMax, idsMax + 1], otraSemana.corridas.map((c) => c.id));
compara("otra semana: semana nueva", "2026-11-13", otraSemana.corridas.at(-1).semana);

if (diferencias) {
  console.log(`\nDIFERENCIAS: ${diferencias}`, porCampo);
  console.log(JSON.stringify(muestra, null, 1));
  process.exit(1);
}
console.log("OK: todos los productos, resúmenes, índice e historial coinciden con Django.");
