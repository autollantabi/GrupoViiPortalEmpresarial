/**
 * Carga de Completitud en vivo desde PostgreSQL (core.dim_item). Port de apps/completitud/motor.py y del comando
 * `cargar_completitud` del proyecto Django: arma la consulta con las reglas de config.json, lee el almacén y evalúa
 * cada campo de cada producto (lleno / vacío / a revisar) y los códigos repetidos.
 *
 * Los campos marcados `sensible` (código de proveedor) no se leen: la consulta solo trae si están llenos o vacíos.
 * `consultaSql` y `evaluar` son funciones puras (sin conexión) para poder probarlas.
 */
import { consultar, ConexionError } from "../postgres.js";

const IDENTIFICADOR = /^[a-z_][a-z0-9_]*$/i;
const TABLA = /^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$/i;

const textoSql = (v) => `'${String(v).replace(/'/g, "''")}'`;
const menor = (a, b) => (a < b ? -1 : a > b ? 1 : 0); // orden por código, como Python

/** Las columnas y la tabla salen de config.json, pero se validan antes de ir dentro de una consulta. */
function identificador(nombre) {
  if (!IDENTIFICADOR.test(nombre)) throw new ConexionError(`Nombre de columna no válido en config.json: «${nombre}».`);
  return nombre;
}

export function consultaSql(cfg) {
  if (!cfg.clave || !cfg.contexto || !cfg.valores_vacios || !cfg.campos?.every((c) => c.columna)) {
    throw new ConexionError("config.json no tiene las reglas completas: ejecuta backend/herramientas/exportar_completitud.py.");
  }
  if (!TABLA.test(cfg.fuente.tabla)) throw new ConexionError("Nombre de tabla no válido en config.json.");
  const sensibles = new Set(cfg.campos.filter((c) => c.sensible).map((c) => c.columna));
  const vacios = cfg.valores_vacios.map((v) => textoSql(String(v).toUpperCase())).join(", ");
  const columnas = [
    ...Object.values(cfg.clave),
    ...Object.values(cfg.contexto),
    ...Object.values(cfg.filtros ?? {}),
    ...cfg.campos.map((c) => c.columna),
    ...(cfg.unicidad ?? []).map((u) => u.columna),
  ];
  const partes = [...new Set(columnas)].map((col) => {
    identificador(col);
    return sensibles.has(col)
      ? `CASE WHEN UPPER(TRIM(COALESCE(${col}::text, ''))) IN (${vacios}, '') THEN '' ELSE 'LLENO' END AS ${col}`
      : col;
  });
  // `filtro` es una condición escrita por TI en config.json (no viene de ningún usuario de la pantalla)
  return `SELECT ${partes.join(", ")} FROM ${cfg.fuente.tabla}` + (cfg.fuente.filtro ? ` WHERE ${cfg.fuente.filtro}` : "");
}

const normaliza = (v) => (v === null || v === undefined ? "" : String(v).trim().toUpperCase());
const esVacio = (valor, lista) => lista.has(normaliza(valor));
const texto = (v) => (v === null || v === undefined ? "" : String(v).trim());

/** Evalúa las filas leídas. Devuelve { productos, duplicados } con el mismo formato que corte.json. */
export function evaluar(filas, cfg) {
  const k = cfg.clave;
  const ctx = cfg.contexto;
  const vacios = new Set([...cfg.valores_vacios.map((v) => String(v).toUpperCase()), ""]);
  const aRevisar = new Set([...(cfg.valores_a_revisar ?? []).map((v) => String(v).toUpperCase()), ""]);
  const hayRevisar = (cfg.valores_a_revisar ?? []).length > 0;
  const obligatorios = cfg.campos.filter((c) => c.obligatorio !== false);

  const productos = filas.map((fila) => {
    const grupo = fila[ctx.grupo];
    const campos = {};
    const revisar = [];
    for (const campo of obligatorios) {
      const aplicaA = campo.aplica_a_grupos ?? [];
      if (aplicaA.length && !aplicaA.includes(grupo)) continue;
      const vacio = esVacio(fila[campo.columna], vacios);
      campos[campo.etiqueta] = vacio ? 0 : 1;
      if (hayRevisar && !vacio && esVacio(fila[campo.columna], aRevisar)) revisar.push(campo.etiqueta);
    }
    return {
      empresa: texto(fila[k.empresa]),
      codigo: texto(fila[k.codigo]),
      grupo: texto(grupo),
      nombre: texto(fila[ctx.nombre]),
      fabricante: texto(fila[ctx.fabricante]),
      campos,
      revisar,
    };
  });

  // Unicidad: valores llenos pero repetidos
  const duplicados = [];
  for (const u of cfg.unicidad ?? []) {
    const etiqueta = cfg.campos.find((c) => c.columna === u.columna)?.etiqueta ?? u.columna;
    const llenos = [];
    filas.forEach((fila, pos) => {
      if (!esVacio(fila[u.columna], vacios)) llenos.push({ pos, valor: String(fila[u.columna]).trim() });
    });
    const clave = (x) => (u.por_empresa === false ? x.valor : `${productos[x.pos].empresa}\u0000${x.valor}`);
    const conteo = new Map();
    llenos.forEach((x) => conteo.set(clave(x), (conteo.get(clave(x)) || 0) + 1));
    for (const x of llenos) {
      const n = conteo.get(clave(x));
      if (n > 1) {
        const p = productos[x.pos];
        duplicados.push({ campo: etiqueta, valor: x.valor, repeticiones: n, empresa: p.empresa, codigo: p.codigo, grupo: p.grupo, nombre: p.nombre });
      }
    }
  }
  return { productos, duplicados };
}

/** Lee core.dim_item y devuelve un corte con el mismo formato que datos/corte.json. */
export async function cargarDesdePostgres(cfg) {
  const filas = await consultar(consultaSql(cfg));
  const excluidos = new Set(cfg.grupos_excluidos ?? []);
  const utiles = excluidos.size ? filas.filter((f) => !excluidos.has(f[cfg.contexto.grupo])) : filas;
  if (!utiles.length) throw new ConexionError("No hay productos que evaluar con el filtro de config.json.");
  const { productos, duplicados } = evaluar(utiles, cfg);
  // Mismo orden que guarda el proyecto Django
  productos.sort((a, b) => menor(a.empresa, b.empresa) || menor(a.codigo, b.codigo));
  duplicados.sort((a, b) => menor(a.campo, b.campo) || menor(a.empresa, b.empresa) || menor(a.valor, b.valor) || menor(a.codigo, b.codigo));
  return {
    fecha_hora: new Date().toISOString().replace("T", " ").replace("Z", ""),
    origen: "PostgreSQL",
    total: productos.length,
    productos,
    duplicados,
  };
}
