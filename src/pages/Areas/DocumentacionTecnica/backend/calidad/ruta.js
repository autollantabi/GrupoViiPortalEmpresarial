import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consulta, enviarJson, enviarTexto } from "../comun.js";
import "../entorno.js";
import { configurada, ConexionError } from "../postgres.js";
import { cargarFilas } from "./cargaPostgres.js";
import { ATRIBUTOS_CLASIFICACION, ATRIBUTOS_VALIDADOS, calcularCalidad } from "./motor.js";
import { armarDatos } from "./actualizar.js";

const CARPETA = path.join(path.dirname(fileURLToPath(import.meta.url)), "datos");
const BASE = path.join(CARPETA, "calidad.json"); // foto exportada del proyecto Django (y punto de partida del historial)
const VIVO = path.join(CARPETA, "calidad_vivo.json"); // lo que deja «Actualizar datos»; si existe, tiene prioridad

/* ------------------------------ datos (con caché por fecha de archivo) ------------------------------ */

// Sin ningún archivo (calidad.json, la foto del catálogo real, no se sube al repositorio) la API responde «sin datos»
// y «Actualizar datos» crea el primero.
const VACIO = {
  corrida_detalle: null,
  atributos_indice: [...ATRIBUTOS_VALIDADOS],
  atributos_aparte: [...ATRIBUTOS_CLASIFICACION],
  perfiles: {},
  corridas: [],
  resumen_atributos: [],
  resumen_empresas: [],
  historial: [],
  items: [],
};

let cache = null;
function cargar() {
  const archivo = fs.existsSync(VIVO) ? VIVO : fs.existsSync(BASE) ? BASE : null;
  if (!archivo) return VACIO;
  const mtime = fs.statSync(archivo).mtimeMs;
  if (!cache || cache.archivo !== archivo || cache.mtime !== mtime) {
    const d = JSON.parse(fs.readFileSync(archivo, "utf-8"));
    // GRUPO ya no se evalúa: los archivos guardados antes de quitarlo aún lo traen, y no debe mostrarse
    d.atributos_aparte = [...ATRIBUTOS_CLASIFICACION];
    cache = { archivo, mtime, d };
  }
  return cache.d;
}

/* ------------------------------ actualización en vivo ------------------------------ */

let actualizando = null;
/**
 * Lee core.dim_item, recalcula la calidad con el motor y guarda el resultado en calidad_vivo.json (escritura atómica:
 * se escribe un temporal y se renombra, así una lectura nunca ve el archivo a medias). Varias peticiones simultáneas
 * comparten la misma ejecución.
 */
function actualizar() {
  if (!actualizando) {
    actualizando = (async () => {
      const filas = await cargarFilas();
      let calculo;
      try {
        calculo = calcularCalidad(filas);
      } catch (error) {
        throw new ConexionError(error.message); // «No hay llantas que evaluar»: se muestra tal cual
      }
      const datos = armarDatos(cargar(), calculo);
      const temporal = `${VIVO}.tmp`;
      fs.writeFileSync(temporal, JSON.stringify(datos), "utf-8");
      fs.renameSync(temporal, VIVO);
      const corrida = datos.corridas.find((c) => c.id === datos.corrida_detalle);
      return { ok: true, productos: datos.items.length, corrida };
    })().finally(() => {
      actualizando = null;
    });
  }
  return actualizando;
}

/* ------------------------------ constantes (port de apps/calidad/logica.py) ------------------------------ */

const ESTADOS = ["CORRECTO", "INCONSISTENTE", "SIN CLASIFICAR", "NO VERIFICABLE", "NO EVALUABLE"];
const CLASE_ESTADO = Object.fromEntries(ESTADOS.map((e) => [e, e.toLowerCase().replace(/ /g, "-")]));
const SIGNIFICADO = {
  CORRECTO: "El nombre y la columna de la base coinciden",
  INCONSISTENTE: "Ambos tienen dato, pero son distintos",
  "SIN CLASIFICAR": "El nombre sí trae el dato, pero la base está vacía",
  "NO VERIFICABLE": "La base tiene el dato, pero el nombre no lo trae o no se pudo extraer",
  "NO EVALUABLE": "Ni el nombre ni la base tienen dato",
};
const GENERAL = "GENERAL";
const TIPOS_PRODUCTO = ["LLANTAS", "LLANTAS MOTO", "TUBO", "MOUSSE", "ARO"];
const TIPOS_LLANTA = ["LLANTAS", "LLANTAS MOTO"];
const NOMBRE_TIPO = { LLANTAS: "llantas", "LLANTAS MOTO": "llantas moto", TUBO: "tubos", MOUSSE: "mousse", ARO: "aros" };
const UMBRAL_VERDE = 95.0;
const UMBRAL_AMARILLO = 85.0;
const POR_PAGINA = 150; // filas que se cargan cada vez que la tabla continua llega al final
const CAMPOS_MULTIPLES = { empresa: "empresa", proveedor: "proveedor", marca: "marca", grupo: "grupo", tipo: "tipo_producto" };

const menor = (a, b) => (a < b ? -1 : a > b ? 1 : 0); // orden por código, como Python
const miles = (n) => Number(n).toLocaleString("de-DE");
const nombreAtributo = (a) => (a === "DISENIO" ? "Diseño" : a.charAt(0) + a.slice(1).toLowerCase());
const redondea = (v, dec) => Math.round((v + Number.EPSILON) * 10 ** dec) / 10 ** dec;

/** Porcentaje con 1 decimal sin redondear hacia 100 un valor que no llega (99,96 → 99,9). */
function pctTexto(pct) {
  if (pct === null || pct === undefined) return null;
  if (pct < 100 && redondea(pct, 1) >= 100) return 99.9;
  return redondea(pct, 1);
}
function semaforo(pct) {
  if (pct === null || pct === undefined) return "nd";
  return pct >= UMBRAL_VERDE ? "ok" : pct >= UMBRAL_AMARILLO ? "aviso" : "error";
}

/* ------------------------------ filtros ------------------------------ */

function puntaje(valor, defecto) {
  const x = parseFloat(valor);
  if (Number.isNaN(x)) return defecto;
  return Math.min(1, Math.max(0, x)).toFixed(2);
}

function leerFiltros(q, d) {
  const todos = [...d.atributos_indice, ...d.atributos_aparte];
  let atributo = (q.get("atributo") || GENERAL).toUpperCase();
  if (![...todos, GENERAL].includes(atributo)) atributo = GENERAL;
  const lista = (n) => q.getAll(n).map((x) => x.trim()).filter(Boolean);
  let pmin = puntaje(q.get("pmin"), "0.00");
  let pmax = puntaje(q.get("pmax"), "1.00");
  if (parseFloat(pmin) > parseFloat(pmax)) [pmin, pmax] = [pmax, pmin];
  const f = {
    atributo,
    estado: lista("estado").filter((e) => ESTADOS.includes(e)),
    pagina: Math.max(1, parseInt(q.get("pagina") || "1", 10) || 1),
    pmin,
    pmax,
    q: (q.get("q") || "").trim().slice(0, 60),
  };
  for (const campo of Object.keys(CAMPOS_MULTIPLES)) f[campo] = lista(campo);
  return f;
}

/** Productos que pasan los filtros generales (sin el de estado). `omitir` deja fuera un filtro (para las listas en cascada). */
function itemsFiltrados(d, f, omitir = null) {
  const texto = f.q.toLowerCase();
  const usaPuntaje = omitir !== "puntaje" && (f.pmin !== "0.00" || f.pmax !== "1.00");
  return d.items.filter((i) => {
    for (const [campo, columna] of Object.entries(CAMPOS_MULTIPLES)) {
      if (f[campo].length && omitir !== campo && !f[campo].includes(i[columna])) return false;
    }
    if (usaPuntaje && !(i.score !== null && i.score >= parseFloat(f.pmin) - 0.001 && i.score <= parseFloat(f.pmax) + 0.001)) return false;
    if (texto && omitir !== "q" && !(i.codigo.toLowerCase().includes(texto) || i.nombre.toLowerCase().includes(texto))) return false;
    return true;
  });
}

/** Qué se evalúa con los filtros actuales (igual que el dashboard original). */
function alcance(d, f) {
  const filtrados = itemsFiltrados(d, f);
  const tipos = [...new Set(filtrados.map((i) => i.tipo_producto))];
  let evaluados, aplicables, conGrupo;
  if (tipos.some((t) => TIPOS_LLANTA.includes(t))) {
    evaluados = filtrados.filter((i) => i.es_llanta);
    aplicables = d.atributos_indice;
    conGrupo = true;
  } else if (tipos.length) {
    const comunes = tipos.map((t) => new Set(d.perfiles[t] || [])).reduce((a, b) => new Set([...a].filter((x) => b.has(x))));
    evaluados = filtrados;
    aplicables = d.atributos_indice.filter((a) => comunes.has(a));
    conGrupo = false;
  } else {
    evaluados = filtrados;
    aplicables = d.atributos_indice;
    conGrupo = false;
  }
  const enEval = new Set(evaluados.map((i) => i.tipo_producto));
  const presentes = [...TIPOS_PRODUCTO.filter((t) => enEval.has(t)), ...[...enEval].filter((t) => !TIPOS_PRODUCTO.includes(t)).sort(menor)];
  const unidad = presentes.map((t) => NOMBRE_TIPO[t] || t.toLowerCase()).join(" y ") || "productos";
  return {
    items: evaluados,
    aplicables,
    conGrupo,
    n: evaluados.length,
    filtrados: filtrados.length,
    total: d.items.length,
    excluidos: filtrados.length - evaluados.length,
    unidad,
  };
}

/** Valores de cada lista, limitados a los que existen con los demás filtros (en cascada). Lo ya elegido se conserva. */
function opcionesFiltros(d, f) {
  const salida = {};
  for (const [campo, columna] of Object.entries(CAMPOS_MULTIPLES)) {
    const valores = new Set(itemsFiltrados(d, f, campo).map((i) => i[columna]).filter(Boolean));
    f[campo].forEach((v) => valores.add(v));
    salida[campo] =
      campo === "tipo"
        ? [...TIPOS_PRODUCTO.filter((t) => valores.has(t)), ...[...valores].filter((v) => !TIPOS_PRODUCTO.includes(v)).sort(menor)]
        : [...valores].sort(menor);
  }
  return salida;
}

/* ------------------------------ cálculos ------------------------------ */

function resumenEnVivo(d, evaluados, aplicables, conGrupo) {
  const puntajes = evaluados.map((i) => i.score).filter((s) => s !== null);
  const indice = puntajes.length ? puntajes.reduce((a, b) => a + b, 0) / puntajes.length : null;
  const atributos = [...aplicables, ...(conGrupo ? d.atributos_aparte : [])];
  const cuentas = Object.fromEntries(atributos.map((a) => [a, { total: 0, ok: 0 }]));
  for (const i of evaluados) {
    for (const a of atributos) {
      const r = i.a[a];
      if (!r) continue;
      cuentas[a].total += 1;
      if (r[2] === "CORRECTO") cuentas[a].ok += 1;
    }
  }
  const fila = (nombre) => {
    const r = cuentas[nombre];
    const pct = !r || !r.total ? null : (r.ok / r.total) * 100;
    return {
      clave: nombre,
      nombre: nombreAtributo(nombre),
      pct: pctTexto(pct),
      ancho: pct === null ? 0 : redondea(pct, 1),
      semaforo: semaforo(pct),
      por_revisar: miles(!r ? 0 : r.total - r.ok),
    };
  };
  return {
    n: evaluados.length,
    indice: indice === null ? null : redondea(indice * 100, 2),
    indice_txt: indice === null ? null : pctTexto(redondea(indice * 100, 2)),
    en_indice: aplicables.map(fila).sort((a, b) => a.ancho - b.ancho),
    aparte: conGrupo ? d.atributos_aparte.map(fila) : [],
  };
}

function distribucionEstados(items, atributo) {
  const conteo = Object.fromEntries(ESTADOS.map((e) => [e, 0]));
  for (const i of items) if (i.a[atributo]) conteo[i.a[atributo][2]] += 1;
  const total = Object.values(conteo).reduce((a, b) => a + b, 0) || 1;
  const mayor = Math.max(...Object.values(conteo), 1);
  return ESTADOS.map((e) => ({
    estado: e,
    clase: CLASE_ESTADO[e],
    n: conteo[e],
    pct: redondea((conteo[e] / total) * 100, 1),
    alto: redondea((conteo[e] / mayor) * 100, 1),
  }));
}

function estadosPorAtributo(items, atributos) {
  return atributos.map((a) => {
    const conteo = Object.fromEntries(ESTADOS.map((e) => [e, 0]));
    for (const i of items) if (i.a[a]) conteo[i.a[a][2]] += 1;
    const suma = Object.values(conteo).reduce((x, y) => x + y, 0);
    const total = suma || 1;
    return {
      atributo: a,
      total: suma,
      segmentos: ESTADOS.map((e) => ({ estado: e, clase: CLASE_ESTADO[e], n: conteo[e], pct: redondea((conteo[e] / total) * 100, 2) })),
    };
  });
}

function distribucionPuntaje(items) {
  const conteo = new Array(11).fill(0);
  for (const i of items) if (i.score !== null) conteo[Math.min(10, Math.max(0, Math.round(i.score * 10)))] += 1;
  const mayor = Math.max(...conteo, 1);
  return conteo.map((n, k) => ({ puntaje: (k / 10).toFixed(1), n, alto: redondea((n / mayor) * 100, 1) }));
}

/* ------------------------------ tabla de detalle ------------------------------ */

function filasDetalle(items, f, aplicables) {
  if (f.atributo === GENERAL) {
    return f.estado.length
      ? items.filter((i) => aplicables.some((a) => i.a[a] && f.estado.includes(i.a[a][2])))
      : items;
  }
  return items.filter((i) => i.a[f.atributo] && (!f.estado.length || f.estado.includes(i.a[f.atributo][2])));
}

const filaBase = (i) => ({
  fecha_creacion: i.fecha_creacion,
  empresa: i.empresa,
  codigo: i.codigo,
  nombre: i.nombre,
  proveedor: i.proveedor,
  score: i.score,
});

/* ------------------------------ evolución semanal ------------------------------ */

function corridasSemanales(d) {
  const ultimas = new Map();
  for (const c of [...d.corridas].sort((a, b) => menor(a.semana, b.semana) || a.id - b.id)) {
    if (c.origen.startsWith("CSV")) continue; // un CSV es una copia vieja y contaminaría la serie
    ultimas.set(c.semana, c);
  }
  return [...ultimas.values()];
}

function evolucion(d) {
  const corridas = corridasSemanales(d);
  if (!corridas.length) return null;
  const ids = new Set(corridas.map((c) => c.id));
  const semanaDe = Object.fromEntries(corridas.map((c) => [c.id, c.semana]));
  const semanas = corridas.map((c) => c.semana);
  const puntos = corridas.map((c) => ({ semana: c.semana, indice: c.indice_general, registros: c.registros, origen: c.origen }));

  const pivote = (filas, clave, valor, orden) => {
    const datos = {};
    for (const r of filas) {
      if (!ids.has(r.corrida_id)) continue;
      (datos[r[clave]] = datos[r[clave]] || {})[semanaDe[r.corrida_id]] = r[valor];
    }
    return orden(datos).map((k) => {
      const valores = semanas.map((s) => (datos[k][s] === undefined ? null : datos[k][s]));
      let variacion = null;
      if (valores.length >= 2 && valores.at(-1) !== null && valores.at(-2) !== null) variacion = redondea(valores.at(-1) - valores.at(-2), 2);
      return { nombre: k, valores, variacion };
    });
  };
  const todos = [...d.atributos_indice, ...d.atributos_aparte];
  const por_atributo = pivote(d.resumen_atributos, "atributo", "pct_correcto", (x) => todos.filter((a) => a in x));
  const por_empresa = pivote(d.resumen_empresas, "empresa", "indice", (x) => Object.keys(x).sort(menor));
  let variacion = null;
  if (puntos.length >= 2 && puntos.at(-1).indice !== null && puntos.at(-2).indice !== null) {
    variacion = redondea(puntos.at(-1).indice - puntos.at(-2).indice, 2);
  }
  return { corridas, puntos, semanas, por_atributo, por_empresa, ultima: puntos.at(-1), variacion };
}

function cambiosEntreSemanas(d, corridas, anterior, actual) {
  const a = corridas.find((c) => c.semana === anterior);
  const b = corridas.find((c) => c.semana === actual);
  if (!a || !b || a === b) return null;
  const mapa = (corrida) => {
    const m = new Map();
    for (const [cid, emp, cod, score] of d.historial) if (cid === corrida.id) m.set(`${emp}\u0000${cod}`, score);
    return m;
  };
  const antes = mapa(a);
  const ahora = mapa(b);
  const filas = [];
  for (const clave of new Set([...antes.keys(), ...ahora.keys()])) {
    const s0 = antes.has(clave) ? antes.get(clave) : null;
    const s1 = ahora.has(clave) ? ahora.get(clave) : null;
    if (s0 === null || s1 === null || s0 !== s1) {
      const [empresa, codigo] = clave.split("\u0000");
      filas.push({ empresa, codigo, antes: s0, ahora: s1, diferencia: s0 === null || s1 === null ? null : redondea(s1 - s0, 2) });
    }
  }
  filas.sort((x, y) => (x.diferencia === null) - (y.diferencia === null) || (x.diferencia ?? 0) - (y.diferencia ?? 0));
  return {
    total: filas.length,
    filas: filas.slice(0, 200),
    mejoran: filas.filter((r) => (r.diferencia ?? 0) > 0).length,
    empeoran: filas.filter((r) => (r.diferencia ?? 0) < 0).length,
    nuevos: filas.filter((r) => r.antes === null).length,
  };
}

/* ------------------------------ rutas ------------------------------ */

const iso = (utc) => utc.replace(" ", "T") + "Z"; // Django guarda en UTC (USE_TZ)

/**
 * Sección Calidad de datos. Todos los endpoints aceptan los filtros generales repetidos en la URL:
 * ?empresa=A&proveedor=B&marca=C&grupo=D&tipo=E&pmin=0.5&pmax=1&q=texto (y `atributo` para el detalle).
 *
 *   GET /calidad/resumen/?atributo=GENERAL|MARCA|…
 *     -> { hay_datos, corrida{fecha_hora,origen}, fuente, con_proveedor, cuenta{filtrados,total}, unidad, excluidos,
 *          opciones{empresa[],proveedor[],marca[],grupo[],tipo[]}, resumen{n,indice,indice_txt,en_indice[],aparte[]},
 *          atributo, general, no_aplica, nombre_atributo, tabs[{clave,nombre}], leyenda[], estados[],
 *          detalle{ puntajes[], apiladas[], columnas_estado[] | distribucion[], con_categoria } }
 *   GET /calidad/filas/?atributo=…&estado=…&pagina=1   -> { total, siguiente|null, filas[], general, columnas_estado[] }
 *   GET /calidad/buscar/?q=texto                        -> { q, total, items[{codigo,nombre,empresa}] }
 *   GET /calidad/exportar/?atributo=…                   -> CSV del detalle con los filtros actuales
 *   GET /calidad/evolucion/?ant=YYYY-MM-DD&act=YYYY-MM-DD
 *     -> { hay_datos, puntos[], semanas[], por_atributo[], por_empresa[], ultima, variacion, opciones[], ant, act, cambios|null }
 *
 *   POST /calidad/actualizar/   (rutasPost)
 *     -> { ok, productos, corrida{id,semana,fecha_hora,origen,registros,indice_general} }
 *        Lee core.dim_item de PostgreSQL, recalcula con motor.js, guarda la corrida de la semana y reemplaza el detalle.
 *        Sin credenciales o con la base caída responde 503 con un mensaje que no revela datos de conexión.
 *
 * Los datos salen de datos/calidad_vivo.json si existe (lo que deja «Actualizar datos») y, si no, de datos/calidad.json
 * (foto exportada del Django, que `cargar_calidad` calcula con pandas). Del proveedor solo viaja el nombre del
 * principal, nunca su código ni su RUC.
 */
export const rutas = {
  "/calidad/resumen/": (req, res) => {
    const d = cargar();
    const f = leerFiltros(consulta(req), d);
    const ctx = alcance(d, f);
    const corrida = d.corridas.find((c) => c.id === d.corrida_detalle);
    if (!corrida) return enviarJson(res, 200, { hay_datos: false, puede_actualizar: configurada() });

    const resumen = resumenEnVivo(d, ctx.items, ctx.aplicables, ctx.conGrupo);
    const general = f.atributo === GENERAL;
    const noAplica = general ? false : d.atributos_aparte.includes(f.atributo) ? !ctx.conGrupo : !ctx.aplicables.includes(f.atributo);

    const detalle = { con_categoria: d.atributos_aparte.includes(f.atributo) };
    if (resumen.n && general) {
      detalle.puntajes = distribucionPuntaje(ctx.items);
      detalle.apiladas = estadosPorAtributo(ctx.items, ctx.aplicables);
      detalle.columnas_estado = ctx.aplicables.map((a) => ({ atributo: a, nombre: nombreAtributo(a) }));
    } else if (resumen.n && !noAplica) {
      detalle.distribucion = distribucionEstados(ctx.items, f.atributo);
    }

    const nombresTab = [...ctx.aplicables, ...(ctx.conGrupo ? d.atributos_aparte : []), GENERAL];
    enviarJson(res, 200, {
      hay_datos: true,
      corrida: { fecha_hora: iso(corrida.fecha_hora), origen: corrida.origen },
      fuente: corrida.origen.startsWith("CSV") ? "core.dim_item (exportación en CSV)" : "core.dim_item (PostgreSQL)",
      puede_actualizar: configurada(), // hay credenciales de PostgreSQL: se puede recalcular con «Actualizar datos»
      con_proveedor: d.items.some((i) => i.proveedor !== ""),
      cuenta: { filtrados: ctx.filtrados, total: ctx.total },
      unidad: ctx.unidad,
      excluidos: ctx.excluidos,
      opciones: opcionesFiltros(d, f),
      resumen,
      atributo: f.atributo,
      general,
      no_aplica: noAplica,
      nombre_atributo: general ? "General" : nombreAtributo(f.atributo),
      tabs: nombresTab.map((t) => ({ clave: t, nombre: t === GENERAL ? "General" : nombreAtributo(t) })),
      estados: ESTADOS,
      leyenda: ESTADOS.map((e) => ({ estado: e, clase: CLASE_ESTADO[e], significado: SIGNIFICADO[e] })),
      detalle,
    });
  },

  "/calidad/filas/": (req, res) => {
    const d = cargar();
    const f = leerFiltros(consulta(req), d);
    const ctx = alcance(d, f);
    const filas = filasDetalle(ctx.items, f, ctx.aplicables);
    const ini = (f.pagina - 1) * POR_PAGINA;
    const lote = filas.slice(ini, ini + POR_PAGINA).map((i) =>
      f.atributo === GENERAL
        ? { ...filaBase(i), celdas: ctx.aplicables.map((a) => (i.a[a] ? { estado: i.a[a][2], bd: i.a[a][0], extraido: i.a[a][1] } : null)) }
        : { ...filaBase(i), bd: i.a[f.atributo][0], extraido: i.a[f.atributo][1], estado: i.a[f.atributo][2], extra: i.a[f.atributo][3] }
    );
    enviarJson(res, 200, {
      total: filas.length,
      siguiente: ini + POR_PAGINA < filas.length ? f.pagina + 1 : null,
      general: f.atributo === GENERAL,
      columnas_estado: ctx.aplicables.map((a) => ({ atributo: a, nombre: nombreAtributo(a) })),
      filas: lote,
    });
  },

  "/calidad/buscar/": (req, res) => {
    const d = cargar();
    const f = leerFiltros(consulta(req), d);
    const texto = f.q;
    if (texto.length < 2) return enviarJson(res, 200, { q: texto, total: 0, items: [] });
    const t = texto.toLowerCase();
    const coincidencias = itemsFiltrados(d, f, "q").filter((i) => i.codigo.toLowerCase().includes(t) || i.nombre.toLowerCase().includes(t));
    enviarJson(res, 200, {
      q: texto,
      total: coincidencias.length,
      items: coincidencias.slice(0, 12).map((i) => ({ codigo: i.codigo, nombre: i.nombre, empresa: i.empresa })),
    });
  },

  "/calidad/exportar/": (req, res) => {
    const d = cargar();
    const f = leerFiltros(consulta(req), d);
    const ctx = alcance(d, f);
    const conProv = d.items.some((i) => i.proveedor !== "");
    const celda = (v) => {
      const s = String(v ?? "");
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const fila = (a) => a.map(celda).join(",");
    const prov = conProv ? ["Proveedor principal"] : [];
    const lineas = [];
    const filas = filasDetalle(ctx.items, f, ctx.aplicables);
    if (f.atributo === GENERAL) {
      lineas.push(fila(["Fecha creación", "Empresa", "Código", "Nombre", ...prov, "Puntaje", ...ctx.aplicables.map((a) => `${a} (estado)`)]));
      for (const i of filas) {
        lineas.push(fila([i.fecha_creacion || "", i.empresa, i.codigo, i.nombre, ...(conProv ? [i.proveedor] : []), i.score ?? "",
          ...ctx.aplicables.map((a) => (i.a[a] ? i.a[a][2] : ""))]));
      }
    } else {
      lineas.push(fila(["Fecha creación", "Empresa", "Código", "Nombre", ...prov, `${f.atributo} (BD)`, `${f.atributo} (extraído del nombre)`, "Estado", "Puntaje"]));
      for (const i of filas) {
        const r = i.a[f.atributo];
        lineas.push(fila([i.fecha_creacion || "", i.empresa, i.codigo, i.nombre, ...(conProv ? [i.proveedor] : []), r[0], r[1], r[2], i.score ?? ""]));
      }
    }
    const sello = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "").replace(/^(\d{8})(\d{4})$/, "$1_$2");
    enviarTexto(res, 200, "﻿" + lineas.join("\r\n"), {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="calidad_${f.atributo.toLowerCase()}_${sello}.csv"`,
    });
  },

  "/calidad/evolucion/": (req, res) => {
    const d = cargar();
    const q = consulta(req);
    const evo = evolucion(d);
    if (!evo) return enviarJson(res, 200, { hay_datos: false });
    const opciones = evo.semanas;
    let ant = null;
    let act = null;
    let cambios = null;
    if (opciones.length >= 2) {
      ant = q.get("ant") || opciones.at(-2);
      act = q.get("act") || opciones.at(-1);
      cambios = cambiosEntreSemanas(d, evo.corridas, ant, act);
    }
    const { corridas, ...resto } = evo;
    enviarJson(res, 200, { hay_datos: true, ...resto, opciones, ant, act, cambios });
  },
};

/** Rutas que cambian datos (POST). apiSimulada solo las atiende con ese método. */
export const rutasPost = {
  "/calidad/actualizar/": async (req, res) => enviarJson(res, 200, await actualizar()),
};
