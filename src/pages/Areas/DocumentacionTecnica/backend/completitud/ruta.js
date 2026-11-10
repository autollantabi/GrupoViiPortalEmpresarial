import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consulta, enviarJson, enviarTexto } from "../comun.js";
import "../entorno.js";
import { cargarDesdePostgres } from "./cargaPostgres.js";
import { ConexionError } from "../postgres.js";

const DATOS = path.join(path.dirname(fileURLToPath(import.meta.url)), "datos");
const POR_PAGINA = 100; // filas por lote de la tabla continua
const FILTROS = ["empresa", "grupo", "fabricante"];

/* ------------------------------ datos ------------------------------ */

// Fuente de los datos (variable COMPLETITUD_FUENTE de backend/.env):
//   "json" (por defecto)  -> datos/corte.json, una foto exportada del proyecto Django
//   "postgres"            -> se consulta core.dim_item en vivo (ver cargaPostgres.js) y se conserva COMPLETITUD_CACHE_MIN minutos
let cacheArchivos = null;
/** corte.json (la foto del catálogo real) es opcional: no se sube al repositorio. config.json (las reglas) sí es obligatorio. */
function cargarArchivos() {
  const archivo = path.join(DATOS, "corte.json");
  const hayCorte = fs.existsSync(archivo);
  const mtime = hayCorte ? fs.statSync(archivo).mtimeMs : 0;
  if (!cacheArchivos || cacheArchivos.mtime !== mtime) {
    cacheArchivos = {
      mtime,
      corte: hayCorte ? JSON.parse(fs.readFileSync(archivo, "utf-8")) : null,
      config: JSON.parse(fs.readFileSync(path.join(DATOS, "config.json"), "utf-8")),
    };
  }
  return cacheArchivos;
}

let vivo = { corte: null, hasta: 0, pendiente: null };
async function corteEnVivo(config) {
  if (vivo.corte && Date.now() < vivo.hasta) return vivo.corte;
  if (!vivo.pendiente) {
    // una sola consulta a la vez: varias peticiones simultáneas comparten el mismo resultado
    vivo.pendiente = cargarDesdePostgres(config)
      .then((corte) => {
        const minutos = Number(process.env.COMPLETITUD_CACHE_MIN) || 10;
        vivo = { corte, hasta: Date.now() + minutos * 60000, pendiente: null };
        return corte;
      })
      .catch((error) => {
        vivo.pendiente = null;
        throw error;
      });
  }
  return vivo.pendiente;
}

/** { corte, config } de la fuente elegida. */
async function cargar() {
  const base = cargarArchivos();
  if ((process.env.COMPLETITUD_FUENTE || "json").toLowerCase() !== "postgres") {
    if (!base.corte) {
      throw new ConexionError(
        "Completitud no tiene datos: configura COMPLETITUD_FUENTE=postgres y las credenciales DB_* en el backend (o agrega datos/corte.json)."
      );
    }
    return base;
  }
  return { corte: await corteEnVivo(base.config), config: base.config };
}
/* ------------------------------ cálculo (port de apps/completitud/calculo.py) ------------------------------ */

const semaforo = (pct, cfg) => {
  if (pct === null || pct === undefined) return "";
  const s = cfg.semaforo;
  return pct >= s.verde ? "verde" : pct >= s.amarillo ? "amarillo" : "rojo";
};
const pct = (a, b) => (b ? a / b : null);
const faltantes = (p) => Object.entries(p.campos).filter(([, v]) => v === 0).map(([c]) => c);
const menor = (a, b) => (a < b ? -1 : a > b ? 1 : 0); // comparación por código, como el orden de Python

function productosFiltrados(corte, f) {
  return corte.productos.filter((p) => FILTROS.every((n) => !f[n].length || f[n].includes(p[n])));
}

function opcionesFiltros(corte) {
  return Object.fromEntries(
    FILTROS.map((n) => [n, [...new Set(corte.productos.map((p) => p[n]).filter(Boolean))].sort(menor)])
  );
}

function calcular(productos, cfg) {
  const total = productos.length;
  const orden = cfg.campos.filter((c) => c.obligatorio !== false).map((c) => c.etiqueta);

  const porCampo = Object.fromEntries(orden.map((c) => [c, [0, 0]])); // etiqueta -> [evaluados, llenos]
  const porGrupo = new Map(); // grupo -> { campo -> [evaluados, llenos] }
  const nFaltantes = new Map();
  const revisarCampo = new Map();
  let revisarN = 0;
  let completos = 0;
  const rank = { Empresa: new Map(), Fabricante: new Map() }; // nombre -> [total, listos]

  for (const p of productos) {
    let faltan = 0;
    if (!porGrupo.has(p.grupo)) porGrupo.set(p.grupo, {});
    const pg = porGrupo.get(p.grupo);
    for (const [campo, v] of Object.entries(p.campos)) {
      if (!porCampo[campo]) continue;
      porCampo[campo][0] += 1;
      porCampo[campo][1] += v;
      pg[campo] = pg[campo] || [0, 0];
      pg[campo][0] += 1;
      pg[campo][1] += v;
      faltan += 1 - v;
    }
    const listo = faltan === 0;
    if (listo) completos += 1;
    const k = Math.min(faltan, 4);
    nFaltantes.set(k, (nFaltantes.get(k) || 0) + 1);
    for (const [dim, valor] of [["Empresa", p.empresa], ["Fabricante", p.fabricante || "(vacío)"]]) {
      const r = rank[dim].get(valor) || [0, 0];
      r[0] += 1;
      r[1] += listo ? 1 : 0;
      rank[dim].set(valor, r);
    }
    if (p.revisar.length) {
      revisarN += 1;
      for (const c of p.revisar) revisarCampo.set(c, (revisarCampo.get(c) || 0) + 1);
    }
  }

  const campos = [];
  for (const c of orden) {
    const [ev, llenos] = porCampo[c];
    if (!ev) continue;
    const p = llenos / ev;
    campos.push({ campo: c, evaluados: ev, vacios: ev - llenos, pct: p, pct_vacios: 1 - p, semaforo: semaforo(p, cfg) });
  }
  campos.sort((a, b) => a.pct - b.pct || menor(a.campo, b.campo));
  let peor = campos.reduce((m, c) => (!m || c.vacios > m.vacios ? c : m), null);
  if (peor && !peor.vacios) peor = null;

  const matriz = [...porGrupo.keys()]
    .filter(Boolean)
    .sort(menor)
    .map((g) => ({
      grupo: g,
      total: productos.filter((p) => p.grupo === g).length,
      celdas: orden.map((c) => {
        const [ev, llenos] = porGrupo.get(g)[c] || [0, 0];
        const p = pct(llenos, ev);
        return { pct: p, semaforo: semaforo(p, cfg) };
      }),
    }));

  const ranking = {};
  for (const [dim, datos] of Object.entries(rank)) {
    ranking[dim] = [...datos.entries()]
      .map(([nombre, [t, l]]) => ({ nombre, total: t, listos: l, corregir: t - l, pct: l / t, semaforo: semaforo(l / t, cfg) }))
      .sort((a, b) => b.corregir - a.corregir || menor(a.nombre, b.nombre));
  }

  const distribucion = [0, 1, 2, 3, 4].map((k) => ({
    n: k,
    productos: nFaltantes.get(k) || 0,
    pct: pct(nFaltantes.get(k) || 0, total),
  }));

  const revisar = [...revisarCampo.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => ({ campo: c, productos: n, evaluados: porCampo[c]?.[0] ?? 0, pct: pct(n, porCampo[c]?.[0] ?? 0) }));

  return {
    total,
    completos,
    por_corregir: total - completos,
    pct_completos: pct(completos, total),
    pct_corregir: pct(total - completos, total),
    semaforo_completos: semaforo(pct(completos, total), cfg),
    campos,
    orden,
    peor,
    matriz,
    ranking,
    distribucion,
    revisar,
    n_revisar: revisarN,
  };
}

const coincideTexto = (p, q) => !q || `${p.codigo} ${p.nombre} ${p.fabricante} ${p.empresa}`.toLowerCase().includes(q);

function aCorregir(productos, cfg, q = "", n = "", campo = "") {
  q = q.trim().toLowerCase();
  const filas = [];
  for (const p of productos) {
    const falta = faltantes(p);
    if (!falta.length) continue;
    if (n && (n === "4" ? falta.length < 4 : falta.length !== Number(n))) continue;
    if (campo && !falta.includes(campo)) continue;
    if (!coincideTexto(p, q)) continue;
    const porc = 1 - falta.length / Object.keys(p.campos).length;
    filas.push({ p, faltan: falta, pct: porc, semaforo: semaforo(porc, cfg) });
  }
  return filas.sort((a, b) => a.pct - b.pct || menor(a.p.empresa, b.p.empresa) || menor(a.p.codigo, b.p.codigo));
}

function aRevisar(productos, q = "", campo = "") {
  q = q.trim().toLowerCase();
  const filas = [];
  for (const p of productos) {
    if (!p.revisar.length || (campo && !p.revisar.includes(campo))) continue;
    if (!coincideTexto(p, q)) continue;
    filas.push({ p, campos: p.revisar });
  }
  return filas.sort((a, b) => b.campos.length - a.campos.length || menor(a.p.empresa, b.p.empresa) || menor(a.p.codigo, b.p.codigo));
}

function duplicados(corte, productos) {
  const claves = new Set(productos.map((p) => `${p.empresa}\u0000${p.codigo}`));
  return corte.duplicados.filter((d) => claves.has(`${d.empresa}\u0000${d.codigo}`));
}

/* ------------------------------ rutas ------------------------------ */

function filtrosDe(q) {
  return Object.fromEntries(FILTROS.map((n) => [n, q.getAll(n).filter(Boolean)]));
}

const fila = (p) => ({ empresa: p.empresa, codigo: p.codigo, grupo: p.grupo, nombre: p.nombre, fabricante: p.fabricante });

/**
 * Sección Completitud (maestro de productos). Todos los endpoints aceptan los filtros generales
 * repetidos en la URL: ?empresa=A&empresa=B&grupo=LLANTAS&fabricante=X
 *
 *   GET /completitud/resumen/
 *     -> { corte{fecha_hora,origen,total}, config{titulo,semaforo,valores_a_revisar,fuente_tabla}, opciones{empresa[],grupo[],fabricante[]},
 *          m{total,completos,por_corregir,pct_*,semaforo_completos,campos[],orden[],peor,matriz[],ranking{Empresa[],Fabricante[]},
 *            distribucion[],revisar[],n_revisar}, n_duplicados }
 *   GET /completitud/productos/?vista=corregir|revisar&q=&n=1..4&campo=&pagina=1
 *     -> { total, siguiente|null, filas[{ empresa,codigo,grupo,nombre,fabricante, faltan[]+pct+semaforo | campos[] }] }
 *   GET /completitud/duplicados/
 *     -> { duplicados[{ campo,valor,repeticiones,empresa,codigo,grupo,nombre }] }
 *   GET /completitud/exportar/?formato=csv
 *     -> CSV (;) de los productos a corregir con los filtros indicados
 *
 * En producción estos datos los guarda `cargar_completitud` (lee core.dim_item de PostgreSQL y evalúa las
 * reglas de config.yaml). Aquí salen de datos/corte.json y datos/config.json.
 */
export const rutas = {
  "/completitud/resumen/": async (req, res) => {
    const { corte, config } = await cargar();
    const f = filtrosDe(consulta(req));
    const productos = productosFiltrados(corte, f);
    enviarJson(res, 200, {
      // Django guarda la fecha en UTC (USE_TZ); se envía en ISO 8601 y la pantalla la muestra en hora de Guayaquil.
      corte: { fecha_hora: corte.fecha_hora.replace(" ", "T") + "Z", origen: corte.origen, total: corte.total },
      config: {
        titulo: config.titulo,
        semaforo: config.semaforo,
        valores_a_revisar: config.valores_a_revisar,
        fuente_tabla: config.fuente_tabla,
      },
      opciones: opcionesFiltros(corte),
      m: calcular(productos, config),
      n_duplicados: duplicados(corte, productos).length,
    });
  },

  "/completitud/productos/": async (req, res) => {
    const { corte, config } = await cargar();
    const q = consulta(req);
    const f = filtrosDe(q);
    const vista = q.get("vista") === "revisar" ? "revisar" : "corregir";
    const n = ["1", "2", "3", "4"].includes(q.get("n")) ? q.get("n") : "";
    const pagina = Math.max(1, parseInt(q.get("pagina") || "1", 10) || 1);
    const productos = productosFiltrados(corte, f);
    const filas =
      vista === "corregir"
        ? aCorregir(productos, config, q.get("q") || "", n, q.get("campo") || "")
        : aRevisar(productos, q.get("q") || "", q.get("campo") || "");
    const ini = (pagina - 1) * POR_PAGINA;
    const lote = filas.slice(ini, ini + POR_PAGINA).map((x) =>
      vista === "corregir"
        ? { ...fila(x.p), faltan: x.faltan, pct: x.pct, semaforo: x.semaforo }
        : { ...fila(x.p), campos: x.campos }
    );
    enviarJson(res, 200, { total: filas.length, siguiente: ini + POR_PAGINA < filas.length ? pagina + 1 : null, filas: lote });
  },

  "/completitud/duplicados/": async (req, res) => {
    const { corte } = await cargar();
    const productos = productosFiltrados(corte, filtrosDe(consulta(req)));
    enviarJson(res, 200, { duplicados: duplicados(corte, productos) });
  },

  "/completitud/exportar/": async (req, res) => {
    const { corte, config } = await cargar();
    const productos = productosFiltrados(corte, filtrosDe(consulta(req)));
    const celda = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lineas = [["Empresa", "Código", "Grupo", "Nombre", "Fabricante", "Campos faltantes", "% completitud"].map(celda).join(";")];
    for (const x of aCorregir(productos, config)) {
      lineas.push(
        [x.p.empresa, x.p.codigo, x.p.grupo, x.p.nombre, x.p.fabricante, x.faltan.join(", "), (x.pct * 100).toFixed(1).replace(".", ",")]
          .map(celda)
          .join(";")
      );
    }
    const sello = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "").replace(/^(\d{8})(\d{4})$/, "$1_$2");
    enviarTexto(res, 200, "﻿" + lineas.join("\r\n"), {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="productos_a_corregir_${sello}.csv"`,
    });
  },
};
