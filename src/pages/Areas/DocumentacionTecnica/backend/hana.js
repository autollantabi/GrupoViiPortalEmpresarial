/**
 * Conexión de SOLO LECTURA a SAP HANA (la base de SAP Business One), con las credenciales de backend/.env o del sistema.
 * Port de apps/diccionario/hana.py del proyecto Django.
 *
 * Variables: HANA_HOST, HANA_PORT, HANA_USER, HANA_PASSWORD y HANA_SCHEMA (la base de la empresa, por ejemplo
 * SBO_AUTOLLANTA_PROD). Opcional: HANA_ENCRYPT=true para conexiones cifradas (TLS).
 *
 * - Solo se aceptan sentencias SELECT y de una sola instrucción: la plataforma nunca escribe en SAP.
 * - Los mensajes de error nunca incluyen el servidor, el usuario ni la contraseña: solo el código del error.
 * - El conector oficial `@sap/hana-client` (el mismo que usa `hdbcli` en Python) se carga solo cuando se usa.
 * - Cada valor se pasa a texto según el tipo de la columna que informa HANA, con las mismas reglas que `como_texto` de Django.
 */
import "./entorno.js";
import { createRequire } from "node:module";
import { ConexionError } from "./postgres.js";

const REQUERIDAS = ["HANA_HOST", "HANA_PORT", "HANA_USER", "HANA_PASSWORD", "HANA_SCHEMA"];
const SOLO_SELECT = /^\s*select\b/i;

/** Error de HANA con su código numérico (para decidir si seguir o abortar). El mensaje no revela datos de conexión. */
export class HanaError extends ConexionError {
  constructor(mensaje, codigo = null) {
    super(mensaje);
    this.codigo = codigo;
  }
}

export const configurada = () => REQUERIDAS.every((v) => (process.env[v] ?? "").trim() !== "");
export const esquema = () => (process.env.HANA_SCHEMA ?? "").trim();

function configuracion() {
  const faltan = REQUERIDAS.filter((v) => !(process.env[v] ?? "").trim());
  if (faltan.length) {
    throw new HanaError(`Faltan variables en backend/.env: ${faltan.join(", ")}. Agrégalas (ver backend/.env.example).`);
  }
  const puerto = Number(process.env.HANA_PORT);
  if (!Number.isInteger(puerto) || puerto <= 0) throw new HanaError("HANA_PORT debe ser un número (por ejemplo 30015).");
  return { host: process.env.HANA_HOST.trim(), puerto, usuario: process.env.HANA_USER, clave: process.env.HANA_PASSWORD };
}

/** Códigos de HANA que se explican en español. El resto se informa solo con su número. */
const PISTAS = {
  10: "usuario o contraseña incorrectos",
  258: "el usuario no tiene permiso de lectura sobre ese objeto",
  259: "la tabla no existe en el esquema",
  260: "una columna no existe",
  362: "el esquema no existe (revisa HANA_SCHEMA)",
  "-10709": "no se pudo establecer la conexión (revisa HANA_HOST, HANA_PORT y la red o la VPN)",
  "-10108": "se agotó el tiempo de espera",
};
/** Códigos que indican que se perdió la conexión: no tiene sentido seguir con las demás consultas. */
const CONEXION_PERDIDA = new Set([-10709, -10108, -10807]);

function explicar(error) {
  const codigo = error?.code ?? error?.name ?? "desconocido";
  const pista = PISTAS[String(codigo)];
  return new HanaError(`No se pudo consultar SAP HANA (código ${codigo})${pista ? `: ${pista}` : ""}.`, typeof codigo === "number" ? codigo : null);
}

export const conexionPerdida = (error) => error instanceof HanaError && CONEXION_PERDIDA.has(error.codigo);

function cargarDriver() {
  try {
    return createRequire(import.meta.url)("@sap/hana-client");
  } catch {
    throw new HanaError("Falta instalar el conector de SAP HANA: ejecuta `npm install` dentro de la carpeta backend.");
  }
}

/**
 * Abre una conexión. Devuelve { consultar(sql) -> { columnas:[{nombre,tipo}], filas:[[...]] }, cerrar() }.
 * Quien la abre debe cerrarla (try/finally).
 */
export async function conectar() {
  const cfg = configuracion();
  const hana = cargarDriver();
  const cx = hana.createConnection();
  const opciones = {
    serverNode: `${cfg.host}:${cfg.puerto}`,
    uid: cfg.usuario,
    pwd: cfg.clave,
    connectTimeout: 15000,
    communicationTimeout: 120000,
  };
  if ((process.env.HANA_ENCRYPT ?? "").trim().toLowerCase() === "true") opciones.encrypt = true;

  await new Promise((ok, ko) => cx.connect(opciones, (e) => (e ? ko(explicar(e)) : ok())));

  return {
    consultar(sql) {
      const texto = String(sql).trim().replace(/;+\s*$/, "");
      if (!SOLO_SELECT.test(texto) || texto.includes(";")) return Promise.reject(new HanaError("Solo se permiten consultas SELECT de una sola instrucción."));
      return new Promise((ok, ko) => {
        cx.prepare(texto, (e, stmt) => {
          if (e) return ko(explicar(e));
          // `nativeTypeName` es el tipo de la columna en SAP (DECIMAL, LONGDATE, NVARCHAR…); `typeName` es solo el del lado del cliente (STRING)
          const columnas = stmt.getColumnInfo().map((c) => ({ nombre: c.columnName, tipo: String(c.nativeTypeName || c.typeName || "").toUpperCase() }));
          stmt.exec([], { rowsAsArray: true }, (e2, filas) => {
            stmt.drop(() => undefined);
            return e2 ? ko(explicar(e2)) : ok({ columnas, filas });
          });
        });
      });
    },
    cerrar() {
      return new Promise((ok) => cx.disconnect(() => ok()));
    },
  };
}

/** Comprueba la conexión con una consulta mínima. */
export async function probarConexion() {
  const inicio = Date.now();
  const cx = await conectar();
  try {
    await cx.consultar('SELECT 1 AS "ok" FROM "DUMMY"');
  } finally {
    await cx.cerrar();
  }
  return { ok: true, ms: Date.now() - inicio };
}

/* ------------------------------ valores a texto ------------------------------ */

const TIPOS_ENTEROS = new Set(["TINYINT", "SMALLINT", "INT", "INTEGER", "BIGINT"]);
const TIPOS_DECIMALES = new Set(["DECIMAL", "SMALLDECIMAL", "REAL", "DOUBLE", "FLOAT"]);
const TIPOS_FECHA = new Set(["DATE", "SECONDDATE", "TIMESTAMP", "LONGDATE"]);

/** Número en texto sin exponente ni ceros sobrantes ("12.500000" → "12.5", "100.000" → "100"). */
function decimalNormalizado(valor) {
  let t = String(valor).trim();
  if (/e/i.test(t)) {
    const n = Number(t);
    if (Number.isFinite(n)) t = n.toFixed(20);
  }
  if (t.includes(".")) t = t.replace(/0+$/, "").replace(/\.$/, "");
  return t === "-0" ? "0" : t;
}

/**
 * Valor de HANA tal como lo muestra el diccionario: NULL y vacío con nombre, números sin ceros sobrantes, fechas sin
 * hora cuando la hora es 00:00:00 (igual que `como_texto` de Django).
 */
export function valorATexto(valor, tipo = "") {
  if (valor === null || valor === undefined) return "NULL";
  if (typeof valor === "boolean") return valor ? "True" : "False";
  if (valor instanceof Date) {
    const dos = (n) => String(n).padStart(2, "0");
    const dia = `${valor.getFullYear()}-${dos(valor.getMonth() + 1)}-${dos(valor.getDate())}`;
    const hora = `${dos(valor.getHours())}:${dos(valor.getMinutes())}:${dos(valor.getSeconds())}`;
    return hora === "00:00:00" ? dia : `${dia} ${hora}`;
  }
  if (Buffer.isBuffer(valor)) return valor.toString("hex");
  if (typeof valor === "bigint") return String(valor);
  if (typeof valor === "number") return TIPOS_ENTEROS.has(tipo) ? String(valor) : decimalNormalizado(valor);
  const t = String(valor);
  if (TIPOS_DECIMALES.has(tipo)) return decimalNormalizado(t);
  if (TIPOS_FECHA.has(tipo)) {
    const m = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?/.exec(t);
    if (m) return !m[2] || m[2] === "00:00:00" ? m[1] : `${m[1]} ${m[2]}`;
    return t;
  }
  return t === "" ? "(vacío)" : t;
}
