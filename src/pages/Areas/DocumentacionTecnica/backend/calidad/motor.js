/**
 * Motor de calidad de datos del catálogo de llantas. Port a Node de apps/calidad/motor/calidad_llantas.py (pandas)
 * y de la parte de cálculo del comando `cargar_calidad` del proyecto Django.
 *
 * Qué hace: compara, para cada producto, lo que dice la base (marca, medida, carga, velocidad, lonas, ancho, serie,
 * rin, diseño y nomenclatura) contra lo que se puede extraer del nombre, y le asigna uno de cinco estados
 * (CORRECTO / INCONSISTENTE / SIN CLASIFICAR / NO VERIFICABLE / NO EVALUABLE) y un puntaje de 0 a 1.
 *
 * Solo se porta lo que termina guardado en calidad.json; las columnas auxiliares del original (sugerencias,
 * observaciones, avisos de prefijo, medidarin, códigos duplicados…) no se usan en la plataforma y no se calculan.
 *
 * Entrada: filas con las columnas crudas, todas texto o null (ver COLUMNAS). Nunca incluye el código del proveedor.
 * Funciones puras (sin base de datos ni archivos), para poder probarlas contra los resultados de Django.
 */

/* ------------------------------ constantes ------------------------------ */

export const COLUMNAS = [
  "dit_creacion_sap", "dit_empresa", "dit_codigo", "dit_lonas", "dit_nombre", "dit_proveedorprincipal_nombre",
  "dit_grupo", "dit_rin", "dit_serie", "dit_ancho", "dit_velocidad", "dit_carga", "dit_nomenclatura",
  "dit_categoria", "dit_medida", "marca", "dit_disenio",
];

const VALORES_NULOS = new Set([
  "", "-", "UF", "NA", "N/A", "NULL", "NINGUNO", "VARIOS", "SIN MARCA", "NO DEFINIDO", "NO IDENTIFICADO",
  "SIN DISENO", "NO EXISTE PROPIEDAD ACTIVA",
]);

const ALIAS_MARCAS = { "FARROAD BRAND": "FARROAD", "GOOD YEAR": "GOODYEAR", "CHENG SHIN": "CST" };
const MARCAS_EXCLUIR_EXTRA = new Set(["- NINGUN FABRICANTE -", "FARROAD BRAND"]);
const MARCAS_EXTRA = [
  "MAXXIS", "CST", "MAXTREK", "FORTUNE", "APLUS", "ANTARES", "SUNFULL", "AUSTONE", "GOODYEAR", "GOOD YEAR", "FARROAD",
  "KENDA", "PIRELLI", "TRIANGLE", "WINDA", "CHENG SHIN", "GENERAL TIRE", "BRIDGESTONE", "MICHELIN", "DUNLOP", "HANKOOK",
  "YOKOHAMA", "CONTINENTAL", "ROADCRUZA", "ORNET", "CHENG SANG", "KEYSTONE", "TOURADOR", "CONTANCY", "FEXNIWAY",
  "MILEKING", "ADVANCE", "WANLI", "ALLIANCE", "MARSWAY", "CHAMPIRO", "GT RADIAL", "CHENGSHAN", "COMFORSER", "TOYO",
  "OTANI", "KUMHO", "ZESTINO", "GITI", "ROADGUIDER", "UNIMAX",
];

const CODIGOS_VELOCIDAD = new Set([
  "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "B", "C", "D", "E", "F", "G", "J", "K", "L", "M",
  "N", "P", "Q", "R", "S", "T", "U", "H", "V", "W", "Y",
]);
const CV = "(?:A[1-8]|[BCDEFGJKLMNPQRSTUHVWY])";
const FIN_VELOCIDAD = "(?:(?=TL(?![A-Z0-9]))|(?!\\w))";

const EXTENSIONES_CATALOGO = [
  "RUN FLAT", "SEMI SLICK", "TUBELESS", "DOBLE SERVICIO", "DIRECCIONAL", "TRACCION", "TAXI", "SET", "XL", "LN", "LB",
  "TL", "OWL", "WW", "RBL", "BSW", "WL", "POS", "DEL",
];
const EXTENSIONES_TEXTO = EXTENSIONES_CATALOGO.filter((e) => e !== "TAXI");

export const ESTADOS = ["CORRECTO", "INCONSISTENTE", "SIN CLASIFICAR", "NO VERIFICABLE", "NO EVALUABLE"];

export const ATRIBUTOS_VALIDADOS = [
  "MARCA", "NOMENCLATURA", "CARGA", "VELOCIDAD", "LONAS", "ANCHO", "SERIE", "RIN", "DISENIO", "MEDIDA",
];
// Atributos que se muestran aparte del índice. Quedó vacío: GRUPO se quitó (9-nov-2026), porque el grupo sale de SAP y
// no hay otro campo con el cual compararlo (antes se deducía de la categoría).
export const ATRIBUTOS_CLASIFICACION = [];

export const PERFILES_EVALUACION = {
  LLANTAS: ATRIBUTOS_VALIDADOS,
  "LLANTAS MOTO": ATRIBUTOS_VALIDADOS,
  TUBO: ["MARCA", "NOMENCLATURA", "RIN", "DISENIO", "MEDIDA"],
  MOUSSE: ["MARCA", "RIN", "DISENIO", "MEDIDA"],
  ARO: ["MARCA", "RIN", "MEDIDA"],
};
export const atributosDelPerfil = (tipo) => PERFILES_EVALUACION[tipo] ?? ATRIBUTOS_VALIDADOS;

/* ------------------------------ expresiones regulares ------------------------------ */
// Las de Python usan (?P<nombre>…); en JavaScript es (?<nombre>…). El texto ya llega normalizado (mayúsculas, sin tildes).

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PREFIJOS_COMERCIALES = /^(?:(?:NEW|PROMO|LIQUIDACION|LIQ|OFERTA|LLANTA|NEUMATICO|TUBO|CAMARA|DEFENSA)\s+)+/;

const PATRONES_MEDIDAS = {
  AMERICANA: /(?<![\w./])(?:(?:LT|AT)\s*)?(?<diametro>\d{2,3}(?:[.,]\d+)?)\s*X\s*(?<ancho>\d{1,2}(?:[.,]\d+)?)\s*(?<construccion>ZRF|ZR|RF|R|D|B|-)\s*-?\s*(?<rin>\d{1,2}(?:[.,]\d+)?)(?:LT|C)?(?![\w./])/gi,
  MILIMETRICA: /(?<![\w./])(?:LT\s*|P\s*)?(?<ancho>\d{2,3})\s*\/\s*(?<serie>\d{2,3})\s*(?:P\s+)?(?<construccion>ZRF|ZR|RF|R|D|B|-|\/)\s*-?\s*(?<rin>\d{1,2}(?:[.,]\d+)?)(?:C|LT)?\/?(?![\w./])/gi,
  SIN_PERFIL: /(?<![\w./])(?:LT\s*)?(?<ancho>\d{3})\s*(?<construccion>RF|R)\s*-?\s*(?<rin>\d{1,2}(?:[.,]\d+)?)(?:C|LT)?(?![\w./])/gi,
  DECIMAL: /(?<![\w./])(?:LT\s*)?(?<ancho>\d{1,2}(?:[.,]\d+)?)(?:\s*\/\s*(?<ancho_alt>\d{1,2}[.,]\d+))?(?<separador>\s*\/\s*R\s*-?\s*|\s*R\s*-?\s*|\s*-\s*|\s+)(?<rin>\d{1,2}(?:[.,]\d+)?)(?:C|LT)?(?![\w./])/gi,
};
const SISTEMAS = ["AMERICANA", "MILIMETRICA", "SIN_PERFIL", "DECIMAL"];

const PATRON_ARO_FILTRO = /\b\d{2}(?:[.,]\d+)?\s*X\s*\d{1,2}(?:[.,]\d+)?\s+\d[HX]\s*-?\s*\d{2,3}(?:[.,]\d+)?\b/i;
const PATRONES_PRODUCTO = [
  ["TUBO", /\b(TUBO|CAMARA|CAMARA DE AIRE)\b/i],
  ["DEFENSA", /\b(DEFENSA|PROTECTOR DE ARO)\b/i],
  ["MOUSSE", /\bMOUSSE\b/i],
  ["ARO", PATRON_ARO_FILTRO],
];

const PATRON_LONAS = /(?<!\w)(?<lonas>\d{1,2})\s*PR\b/i;
const PATRON_LONAS_G = /(?<!\w)(?<lonas>\d{1,2})\s*PR\b/gi;
const PATRON_CARGA_DUAL = new RegExp(`(?<![\\w/.-])(?<carga1>\\d{2,3})\\s*/\\s*(?<carga2>\\d{2,3})[ ]?(?<velocidad>${CV})${FIN_VELOCIDAD}`, "gi");
const PATRON_CARGA_SIMPLE = new RegExp(`(?<![\\w/.-])(?<carga>\\d{2,3})[ ]?(?<velocidad>${CV})${FIN_VELOCIDAD}`, "gi");
const PATRON_INDICE_PARA_DISENIO = new RegExp(`(?<![\\w/.-])\\d{2,3}(?:\\s*/\\s*\\d{2,3})?${CV}(?!\\w)`, "gi");
const unirExtensiones = (lista) => lista.map(escapar).join("|");
const PATRON_EXTENSIONES = new RegExp(`(?<![A-Z0-9])(?:${unirExtensiones(EXTENSIONES_TEXTO)})(?![A-Z0-9])`, "gi");

/* ------------------------------ utilidades que replican a Python ------------------------------ */

const esNulo = (v) => v === null || v === undefined || (typeof v === "number" && Number.isNaN(v));

// Espacios según Python (str.strip y \s de re), que incluye algunos separadores que JavaScript no.
const ESPACIOS = "\\t\\n\\v\\f\\r\\x1c-\\x1f \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000";
const RE_ESPACIOS = new RegExp(`[${ESPACIOS}]+`, "g");
const RE_BORDES = new RegExp(`^[${ESPACIOS}]+|[${ESPACIOS}]+$`, "g");
const RE_COMBINANTES = /\p{Mn}/gu;

/** str(float) de Python: 205 → "205.0", 6.5 → "6.5". */
const textoFloat = (n) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

/** round(x, n) de Python: redondea a la mitad par cuando el valor binario es exactamente un empate. */
export function redondeaPy(x, n) {
  if (!Number.isFinite(x)) return x;
  const signo = x < 0 ? -1 : 1;
  const exacto = Math.abs(x).toFixed(Math.min(100, n + 60)); // expansión decimal exacta del double (hasta donde cabe)
  const punto = exacto.indexOf(".");
  const resto = exacto.slice(punto + 1 + n);
  const entero = exacto.slice(0, punto) + exacto.slice(punto + 1, punto + 1 + n); // dígitos hasta la posición n
  let valor = BigInt(entero);
  if (/^50*$/.test(resto)) {
    if (valor % 2n === 1n) valor += 1n; // empate exacto: hacia el par
  } else if (resto[0] >= "5") {
    valor += 1n;
  }
  return (signo * Number(valor)) / 10 ** n;
}

/** Suma por pares de numpy (la que usa pandas en Series.mean). */
function sumaPares(v, ini, n) {
  if (n < 8) {
    let r = 0;
    for (let i = 0; i < n; i++) r += v[ini + i];
    return r;
  }
  if (n <= 128) {
    const r = v.slice(ini, ini + 8);
    let i;
    for (i = 8; i < n - (n % 8); i += 8) for (let k = 0; k < 8; k++) r[k] += v[ini + i + k];
    let res = r[0] + r[1] + (r[2] + r[3]) + (r[4] + r[5] + (r[6] + r[7]));
    for (; i < n; i++) res += v[ini + i];
    return res;
  }
  let n2 = Math.floor(n / 2);
  n2 -= n2 % 8;
  return sumaPares(v, ini, n2) + sumaPares(v, ini + n2, n - n2);
}
const mediaSerie = (v) => (v.length ? sumaPares(v, 0, v.length) / v.length : null);
/** Media por grupos como la de pandas (suma compensada de Kahan). */
function mediaKahan(v) {
  let suma = 0;
  let comp = 0;
  for (const x of v) {
    const y = x - comp;
    const t = suma + y;
    comp = t - suma - y;
    suma = t;
  }
  return suma / v.length;
}

/** float() de Python para el texto ya normalizado; null si no es un número finito. */
function floatPy(texto) {
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:E[+-]?\d+)?$/i.test(texto)) return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------ normalización ------------------------------ */

export function normalizarTexto(valor) {
  if (esNulo(valor)) return "";
  let t = String(valor).replace(RE_BORDES, "").toUpperCase();
  t = t.normalize("NFKD").replace(RE_COMBINANTES, "");
  t = t.replace(/[®™©]/g, "");
  return t.replace(RE_ESPACIOS, " ").replace(RE_BORDES, "");
}

const esVacio = (v) => VALORES_NULOS.has(normalizarTexto(v));

function normalizarDimension(valor) {
  if (esNulo(valor)) return null;
  const texto = normalizarTexto(typeof valor === "number" ? textoFloat(valor) : valor);
  if (VALORES_NULOS.has(texto)) return null;
  const t = texto.replace(/,/g, ".");
  if (!/^\d+(?:\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return n > 0 ? n : null; // el cero no es una dimensión válida
}

function normalizarCarga(valor) {
  if (esNulo(valor)) return null;
  const texto = normalizarTexto(valor);
  if (VALORES_NULOS.has(texto)) return null;
  let m = /^(\d{2,3})\s*\/\s*(\d{2,3})\s*[A-Z]?$/.exec(texto);
  if (m) return `${parseInt(m[1], 10)}/${parseInt(m[2], 10)}`;
  m = /^(\d{2,3})\s*[A-Z]?$/.exec(texto);
  if (m) return String(parseInt(m[1], 10));
  return null;
}

const cargaContieneVelocidad = (valor) => !esNulo(valor) && /^\d{2,3}(?:\s*\/\s*\d{2,3})?\s*[A-Z]$/.test(normalizarTexto(valor));

function normalizarVelocidad(valor) {
  if (esNulo(valor)) return null;
  const texto = normalizarTexto(valor);
  if (VALORES_NULOS.has(texto)) return null;
  return CODIGOS_VELOCIDAD.has(texto) ? texto : null;
}

/** Solo para contrastar diseños: quita todo separador. */
const normalizarDisenio = (valor) => normalizarTexto(valor).replace(/[\s\-_./]+/g, "");

/* ------------------------------ marca ------------------------------ */

function construirCatalogoMarcas(filas) {
  const marcas = new Set();
  for (const f of filas) {
    if (esNulo(f.marca)) continue;
    const m = normalizarTexto(f.marca);
    if (!VALORES_NULOS.has(m) && !MARCAS_EXCLUIR_EXTRA.has(m)) marcas.add(m);
  }
  for (const m of MARCAS_EXTRA) marcas.add(m);
  return [...marcas].sort((a, b) => b.length - a.length);
}

function extraerMarca(nombre, catalogo) {
  let n = normalizarTexto(nombre);
  if (!n) return null;
  n = n.replace(PREFIJOS_COMERCIALES, "").replace(RE_BORDES, "");
  for (const marca of catalogo) {
    if (n.startsWith(marca) && (n.length === marca.length || /\s/.test(n[marca.length]))) return marca;
  }
  return null;
}

const canonizarMarca = (valor) => {
  const t = normalizarTexto(valor);
  return ALIAS_MARCAS[t] ?? t;
};

/** Los cinco estados a partir de si cada lado tiene dato; `comparar` decide cuando los dos lo tienen. */
function estado5(extraccionTiene, bdTiene, comparar) {
  if (!extraccionTiene && !bdTiene) return "NO EVALUABLE";
  if (!extraccionTiene && bdTiene) return "NO VERIFICABLE";
  if (extraccionTiene && !bdTiene) return "SIN CLASIFICAR";
  return comparar();
}

function validarMarca(marcaBd, marcaAu) {
  const original = canonizarMarca(marcaBd);
  const bdTiene = !VALORES_NULOS.has(original) && original !== "- NINGUN FABRICANTE -";
  return estado5(marcaAu !== null, bdTiene, () => (original === canonizarMarca(marcaAu) ? "CORRECTO" : "INCONSISTENTE"));
}

/* ------------------------------ medidas ------------------------------ */

function buscarCoincidenciaMedida(nombre) {
  if (esNulo(nombre) || !String(nombre).trim()) return [null, null];
  const texto = normalizarTexto(nombre);
  if (!texto) return [null, null];
  if (PATRON_ARO_FILTRO.test(texto)) return [null, null]; // un aro no se evalúa como medida
  for (const sistema of SISTEMAS) {
    for (const m of texto.matchAll(PATRONES_MEDIDAS[sistema])) {
      if (sistema === "DECIMAL") {
        const sep = m.groups.separador ?? "";
        if (/^\s+$/.test(sep) && !/[.,]\d+/.test(m.groups.ancho)) continue;
      }
      return [sistema, m];
    }
  }
  return [null, null];
}

const aNumero = (s) => Number(s.replace(",", "."));

function extraerMedidas(nombre) {
  const r = { nomenclatura: null, tipoMedida: null, ancho: null, serie: null, rin: null, diametro: null, construccion: null };
  const [sistema, m] = buscarCoincidenciaMedida(nombre);
  if (!m) return r;
  const g = m.groups;
  r.ancho = aNumero(g.ancho);
  r.rin = aNumero(g.rin);

  let construccion = g.construccion ? g.construccion.toUpperCase() : null;
  if (!construccion && sistema === "DECIMAL") {
    const sep = (g.separador ?? "").toUpperCase();
    construccion = sep.includes("R") ? "R" : sep.includes("-") ? "-" : null;
  }
  if (construccion === "/") construccion = null;
  r.construccion = construccion;

  if (sistema === "AMERICANA") {
    r.nomenclatura = "AMERICANA";
    r.tipoMedida = "CON DIAMETRO";
    r.diametro = aNumero(g.diametro);
  } else if (sistema === "MILIMETRICA") {
    r.nomenclatura = "MILIMETRICA";
    r.tipoMedida = "CON PERFIL";
    r.serie = aNumero(g.serie);
  } else if (sistema === "SIN_PERFIL") {
    r.nomenclatura = "MILIMETRICA";
    r.tipoMedida = "SIN PERFIL";
  } else {
    r.nomenclatura = "DECIMAL";
    r.tipoMedida = "SIN PERFIL";
  }
  return r;
}

function validarNomenclatura(bd, au) {
  const original = normalizarTexto(bd);
  const extraida = normalizarTexto(au);
  return estado5(extraida !== "", !VALORES_NULOS.has(original), () => (original === extraida ? "CORRECTO" : "INCONSISTENTE"));
}

function serieEsperada(m) {
  if (m.nomenclatura === "AMERICANA") return normalizarDimension(m.diametro);
  if (m.nomenclatura === "MILIMETRICA" && m.tipoMedida === "CON PERFIL") return normalizarDimension(m.serie);
  return null;
}

function validarDimension(original, esperado) {
  const esp = normalizarDimension(esperado);
  const bdTiene = !VALORES_NULOS.has(normalizarTexto(original));
  return estado5(esp !== null, bdTiene, () => {
    const num = normalizarDimension(original);
    if (num === null) return "INCONSISTENTE"; // la base tiene algo que no es un número
    return Math.abs(num - esp) <= 0.001 ? "CORRECTO" : "INCONSISTENTE";
  });
}

/* ------------------------------ tipo de producto ------------------------------ */

function identificarTipoProducto(nombre, grupo, nomenclatura) {
  if (esNulo(nombre) || !String(nombre).trim()) return "NO IDENTIFICADO";
  const n = normalizarTexto(nombre);
  for (const [tipo, patron] of PATRONES_PRODUCTO) if (patron.test(n)) return tipo;
  if (normalizarTexto(grupo) === "LLANTAS MOTO") return "LLANTAS MOTO";
  if (nomenclatura !== null) return "LLANTAS";
  return "NO IDENTIFICADO";
}

/* ------------------------------ carga, velocidad y lonas ------------------------------ */

const juntarSinMedida = (texto, m) => `${texto.slice(0, m.index)} ${texto.slice(m.index + m[0].length)}`.replace(RE_ESPACIOS, " ").replace(RE_BORDES, "");

function quitarMedida(nombre) {
  const texto = normalizarTexto(nombre);
  const [, m] = buscarCoincidenciaMedida(texto);
  return m ? juntarSinMedida(texto, m) : texto;
}

function extraerEspecificaciones(nombre) {
  const r = { lonas: null, carga: null, velocidad: null };
  if (esNulo(nombre) || !String(nombre).trim()) return r;
  const texto = normalizarTexto(nombre);
  const lonas = PATRON_LONAS.exec(texto);
  if (lonas) r.lonas = parseInt(lonas.groups.lonas, 10);

  const [, medida] = buscarCoincidenciaMedida(texto);
  if (!medida) return r;
  const resto = juntarSinMedida(texto, medida).replace(PATRON_LONAS_G, " ");

  for (const m of resto.matchAll(PATRON_CARGA_DUAL)) {
    const a = parseInt(m.groups.carga1, 10);
    const b = parseInt(m.groups.carga2, 10);
    const v = m.groups.velocidad.toUpperCase();
    // la norma exige a > b; con el par invertido ("112/118L") la carga no es confiable pero la velocidad sí
    if (a >= 20 && a <= 200 && b >= 20 && b <= 200 && a > b && CODIGOS_VELOCIDAD.has(v)) {
      r.carga = `${a}/${b}`;
      r.velocidad = v;
      return r;
    }
    if (a >= 20 && a <= 200 && b >= 20 && b <= 200 && a < b && CODIGOS_VELOCIDAD.has(v)) {
      r.velocidad = v;
      return r;
    }
  }
  for (const m of resto.matchAll(PATRON_CARGA_SIMPLE)) {
    const a = parseInt(m.groups.carga, 10);
    const v = m.groups.velocidad.toUpperCase();
    if (a >= 20 && a <= 200 && CODIGOS_VELOCIDAD.has(v)) {
      r.carga = String(a);
      r.velocidad = v;
      return r;
    }
  }
  return r;
}

function validarLonas(bd, lonasAu) {
  const original = normalizarTexto(bd);
  const extraccionTiene = lonasAu !== null;
  const bdTiene = !VALORES_NULOS.has(original);
  if (!extraccionTiene && !bdTiene) return "CORRECTO"; // sin PR en el nombre y sin lonas en la base: coinciden
  return estado5(extraccionTiene, bdTiene, () => {
    const n = floatPy(original.replace("PR", "").replace(RE_BORDES, ""));
    return n !== null && n === lonasAu ? "CORRECTO" : "INCONSISTENTE";
  });
}

function validarCarga(bd, cargaAu) {
  const original = normalizarCarga(bd);
  const extraida = normalizarCarga(cargaAu);
  return estado5(extraida !== null, !esVacio(bd), () => {
    if (original === null || original !== extraida) return "INCONSISTENTE";
    return cargaContieneVelocidad(bd) ? "INCONSISTENTE" : "CORRECTO";
  });
}

function validarVelocidad(bd, velocidadAu) {
  const original = normalizarVelocidad(bd);
  const extraida = normalizarVelocidad(velocidadAu);
  return estado5(extraida !== null, !esVacio(bd), () => (original !== null && original === extraida ? "CORRECTO" : "INCONSISTENTE"));
}

/* ------------------------------ diseño ------------------------------ */

const comparaTexto = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function construirPatronesDisenio(filas) {
  const excluir = new Set([...VALORES_NULOS, "SIN DISENO", ...EXTENSIONES_CATALOGO.map(normalizarTexto)]);
  const frecuencia = new Map(); // grafía normalizada -> veces que aparece en la base
  const candidatos = new Set();
  for (const f of filas) {
    if (esNulo(f.dit_disenio)) continue;
    const d = normalizarTexto(f.dit_disenio);
    frecuencia.set(d, (frecuencia.get(d) ?? 0) + 1);
    if (!excluir.has(d)) candidatos.add(d);
  }
  const catalogo = [...candidatos].sort(
    (x, y) => normalizarDisenio(y).length - normalizarDisenio(x).length || y.length - x.length || comparaTexto(x, y)
  );
  // La grafía canónica de cada clave es la MÁS USADA, no la más larga
  const porClave = new Map();
  for (const d of catalogo) {
    const clave = normalizarDisenio(d);
    if (!clave) continue;
    const vigente = porClave.get(clave);
    if (vigente === undefined) {
      porClave.set(clave, d);
      continue;
    }
    const cand = [frecuencia.get(d) ?? 0, -d.length];
    const act = [frecuencia.get(vigente) ?? 0, -vigente.length];
    if (cand[0] > act[0] || (cand[0] === act[0] && cand[1] > act[1])) porClave.set(clave, d);
  }
  const patrones = [];
  for (const [clave, disenio] of porClave) {
    const flexible = [...clave].map(escapar).join("[\\s\\-_.\\/]*");
    patrones.push({ largo: clave.length, disenio, patron: new RegExp(`(?<![A-Z0-9])${flexible}(?![A-Z0-9])`, "i") });
  }
  patrones.sort((x, y) => y.largo - x.largo || y.disenio.length - x.disenio.length || comparaTexto(x.disenio, y.disenio));
  return patrones;
}

function prepararTextoDisenio(nombre, marca) {
  let texto = normalizarTexto(nombre);
  if (!texto) return "";
  texto = texto.replace(PREFIJOS_COMERCIALES, "").replace(RE_BORDES, "");
  const marcaNorm = esNulo(marca) ? "" : normalizarTexto(marca);
  const quitarMarca = (t) =>
    marcaNorm && t.startsWith(marcaNorm) && (t.length === marcaNorm.length || /\s/.test(t[marcaNorm.length]))
      ? t.slice(marcaNorm.length).replace(RE_BORDES, "")
      : t;
  texto = quitarMarca(texto);
  texto = quitarMedida(texto);
  texto = quitarMarca(texto);
  texto = texto.replace(PATRON_LONAS_G, " ").replace(PATRON_INDICE_PARA_DISENIO, " ").replace(PATRON_EXTENSIONES, " ");
  return texto.replace(RE_ESPACIOS, " ").replace(RE_BORDES, "");
}

function extraerDisenio(nombre, marca, patrones) {
  const texto = prepararTextoDisenio(nombre, marca);
  if (!texto) return null;
  for (const { disenio, patron } of patrones) if (patron.test(texto)) return disenio;
  return null;
}

function validarDisenio(bd, disenioAu) {
  const original = normalizarDisenio(bd);
  const extraido = normalizarDisenio(disenioAu);
  // «SINDISENO» es «SIN DISENO» ya sin separadores: no coincide directo con VALORES_NULOS
  const bdTiene = !VALORES_NULOS.has(original) && original !== "SINDISENO";
  return estado5(Boolean(extraido), bdTiene, () => (original === extraido ? "CORRECTO" : "INCONSISTENTE"));
}

/* ------------------------------ medida ------------------------------ */

function normalizarClaveMedida(valor) {
  if (esNulo(valor)) return "";
  const texto = normalizarTexto(valor);
  if (VALORES_NULOS.has(texto)) return "";
  const s = texto.replace(RE_ESPACIOS, "").replace(/,/g, ".");
  const fmt = (x) => (Number.isInteger(x) ? String(x) : String(x));
  let m = /^(\d+(?:\.\d+)?)[X*](\d+(?:\.\d+)?)$/.exec(s);
  if (m) return `${fmt(Number(m[1]))}X${fmt(Number(m[2]))}`;
  m = /^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(s);
  if (m) return `${fmt(Number(m[1]))}/${fmt(Number(m[2]))}`;
  m = /^(\d+(?:\.\d+)?)$/.exec(s);
  if (m) return fmt(Number(m[1]));
  return s;
}

function medidaEsperada(m) {
  const formato = (v) => (Number.isInteger(v) ? String(v) : String(v));
  if (m.tipoMedida === "CON PERFIL") return m.ancho === null || m.serie === null ? null : `${formato(m.ancho)}/${formato(m.serie)}`;
  if (m.tipoMedida === "CON DIAMETRO") return m.diametro === null || m.ancho === null ? null : `${formato(m.diametro)}X${formato(m.ancho)}`;
  if (m.tipoMedida === "SIN PERFIL") return m.ancho === null ? null : formato(m.ancho);
  return null;
}

function validarMedida(bd, esperada) {
  return estado5(esperada !== null, !esVacio(bd), () => (normalizarClaveMedida(bd) === normalizarClaveMedida(esperada) ? "CORRECTO" : "INCONSISTENTE"));
}

/* ------------------------------ pipeline ------------------------------ */

/** Puntaje de 0 a 1: aciertos entre los atributos que aplican al tipo de producto. */
function puntaje(estados, tipo) {
  const aplican = atributosDelPerfil(tipo);
  let aciertos = 0;
  for (const a of aplican) if (estados[a] === "CORRECTO") aciertos += 1;
  return aplican.length ? aciertos / aplican.length : 0;
}

/**
 * Calcula, para cada fila cruda, lo extraído del nombre, el estado de cada atributo, el tipo de producto y el puntaje.
 * Devuelve un arreglo del mismo largo y orden que `filas`.
 */
export function ejecutarPipeline(filas) {
  const catalogoMarcas = construirCatalogoMarcas(filas);
  const patronesDisenio = construirPatronesDisenio(filas);

  const resultados = filas.map((f) => {
    const nom = normalizarTexto(f.dit_nombre);
    const marcaAu = extraerMarca(nom, catalogoMarcas);
    const med = extraerMedidas(nom);
    const tipo = identificarTipoProducto(nom, f.dit_grupo, med.nomenclatura);
    const esp = extraerEspecificaciones(nom);
    const serie = serieEsperada(med);
    const disenioAu = extraerDisenio(nom, marcaAu, patronesDisenio);
    const medidaAu = medidaEsperada(med);

    const estados = {
      MARCA: validarMarca(f.marca, marcaAu),
      NOMENCLATURA: validarNomenclatura(f.dit_nomenclatura, med.nomenclatura),
      CARGA: validarCarga(f.dit_carga, esp.carga),
      VELOCIDAD: validarVelocidad(f.dit_velocidad, esp.velocidad),
      LONAS: validarLonas(f.dit_lonas, esp.lonas),
      ANCHO: validarDimension(f.dit_ancho, med.ancho),
      SERIE: validarDimension(f.dit_serie, serie),
      RIN: validarDimension(f.dit_rin, med.rin),
      DISENIO: validarDisenio(f.dit_disenio, disenioAu),
      MEDIDA: validarMedida(f.dit_medida, medidaAu),
    };
    return {
      tipo,
      esLlanta: tipo === "LLANTAS" || tipo === "LLANTAS MOTO",
      score: puntaje(estados, tipo),
      estados,
      // lo extraído del nombre, tal como lo guarda Django (antes de pasarlo a texto)
      au: {
        MARCA: marcaAu, NOMENCLATURA: med.nomenclatura, CARGA: esp.carga, VELOCIDAD: esp.velocidad, LONAS: esp.lonas,
        ANCHO: med.ancho, SERIE: serie, RIN: med.rin, DISENIO: disenioAu, MEDIDA: medidaAu,
      },
    };
  });

  // pandas guarda las lonas como entero solo si ninguna fila está vacía; si no, como decimal (12 → "12.0")
  resultados.lonasEnteras = resultados.every((r) => r.au.LONAS !== null);
  return resultados;
}

/* ------------------------------ resultado para guardar ------------------------------ */

const recortar = (valor, largo) => (esNulo(valor) ? "" : String(valor).slice(0, largo));
const textoAu = (atributo, valor, enteras) => {
  if (valor === null) return "";
  if (typeof valor !== "number") return valor;
  return atributo === "LONAS" && enteras ? String(valor) : textoFloat(valor);
};
const fechaIso = (valor) => {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(valor ?? ""));
  return m ? m[1] : null;
};

/**
 * Detalle y resúmenes de una corrida a partir de las filas crudas. No decide ids ni semana: eso lo hace quien guarda.
 * Devuelve { items, resumenAtributos, resumenEmpresas, historial, indice, registros, perfiles } con el mismo formato
 * que usa calidad.json (historial como [empresa, codigo, score]).
 */
export function calcularCalidad(filas) {
  const res = ejecutarPipeline(filas);
  if (!res.some((r) => r.esLlanta)) throw new Error("No hay llantas que evaluar.");
  const enteras = res.lonasEnteras;
  const todos = [...ATRIBUTOS_VALIDADOS, ...ATRIBUTOS_CLASIFICACION];

  const items = filas.map((f, i) => {
    const r = res[i];
    const a = {};
    for (const nombre of todos) {
      const bd = { MARCA: f.marca, NOMENCLATURA: f.dit_nomenclatura, CARGA: f.dit_carga, VELOCIDAD: f.dit_velocidad,
        LONAS: f.dit_lonas, ANCHO: f.dit_ancho, SERIE: f.dit_serie, RIN: f.dit_rin, DISENIO: f.dit_disenio,
        MEDIDA: f.dit_medida }[nombre];
      a[nombre] = [recortar(bd, 120), recortar(textoAu(nombre, r.au[nombre], enteras), 120), r.estados[nombre], ""];
    }
    return {
      fecha_creacion: fechaIso(f.dit_creacion_sap),
      empresa: recortar(f.dit_empresa, 1000),
      codigo: recortar(f.dit_codigo, 1000),
      nombre: recortar(f.dit_nombre, 300),
      tipo_producto: r.tipo,
      es_llanta: r.esLlanta,
      grupo: recortar(f.dit_grupo, 60),
      marca: recortar(r.au.MARCA, 80),
      proveedor: recortar(f.dit_proveedorprincipal_nombre, 200),
      score: r.score,
      a,
    };
  });
  items.sort((x, y) => comparaTexto(x.empresa, y.empresa) || comparaTexto(x.codigo, y.codigo));

  const llantas = res.map((r, i) => ({ r, f: filas[i] })).filter((x) => x.r.esLlanta);
  const registros = llantas.length;

  const resumenAtributos = todos.map((atributo) => {
    const cuenta = Object.fromEntries(ESTADOS.map((e) => [e, 0]));
    for (const { r } of llantas) cuenta[r.estados[atributo]] += 1;
    return {
      atributo,
      registros,
      correcto: cuenta.CORRECTO,
      inconsistente: cuenta.INCONSISTENTE,
      sin_clasificar: cuenta["SIN CLASIFICAR"],
      no_verificable: cuenta["NO VERIFICABLE"],
      no_evaluable: cuenta["NO EVALUABLE"],
      pct_correcto: registros ? redondeaPy((cuenta.CORRECTO / registros) * 100, 2) : null,
    };
  });

  const porEmpresa = new Map();
  for (const { r, f } of llantas) {
    if (esNulo(f.dit_empresa)) continue;
    const e = String(f.dit_empresa);
    if (!porEmpresa.has(e)) porEmpresa.set(e, []);
    porEmpresa.get(e).push(r.score);
  }
  const resumenEmpresas = [...porEmpresa.keys()].sort(comparaTexto).map((empresa) => ({
    empresa,
    registros: porEmpresa.get(empresa).length,
    indice: redondeaPy(mediaKahan(porEmpresa.get(empresa)) * 100, 2),
  }));

  const historial = llantas
    .map(({ r, f }) => [String(f.dit_empresa), String(f.dit_codigo), r.score])
    .sort((x, y) => comparaTexto(x[0], y[0]) || comparaTexto(x[1], y[1]));

  const tipos = [...new Set([...items.map((i) => i.tipo_producto), "LLANTAS", "LLANTAS MOTO", "TUBO", "MOUSSE", "ARO"])].sort(comparaTexto);
  return {
    items,
    resumenAtributos,
    resumenEmpresas,
    historial,
    registros,
    indice: redondeaPy(mediaSerie(llantas.map((x) => x.r.score)) * 100, 2),
    perfiles: Object.fromEntries(tipos.map((t) => [t, [...atributosDelPerfil(t)]])),
  };
}
