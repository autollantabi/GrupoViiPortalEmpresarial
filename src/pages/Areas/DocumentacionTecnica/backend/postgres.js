/**
 * Conexión de SOLO LECTURA a PostgreSQL (core.dim_item), con las credenciales de backend/.env o del sistema.
 *
 * Variables: DB_HOST, DB_PORT (5432 por defecto), DB_NAME, DB_USER, DB_PASSWORD.
 * Los mensajes de error nunca incluyen el servidor, el usuario ni la contraseña: solo el código del error.
 * La dependencia `pg` se carga solo cuando se usa, así el proyecto corre sin instalarla mientras no se conecte.
 */
import "./entorno.js";

const REQUERIDAS = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const SOLO_SELECT = /^\s*select\b/i;

export class ConexionError extends Error {}

export const configurada = () => REQUERIDAS.every((v) => (process.env[v] ?? "").trim() !== "");

function configuracion() {
  const faltan = REQUERIDAS.filter((v) => !(process.env[v] ?? "").trim());
  if (faltan.length) {
    throw new ConexionError(
      `Faltan variables en backend/.env: ${faltan.join(", ")}. Copia backend/.env.example como backend/.env y complétalo.`
    );
  }
  const puerto = Number(process.env.DB_PORT || 5432);
  if (!Number.isInteger(puerto)) throw new ConexionError("DB_PORT debe ser un número (por ejemplo 5432).");
  return { host: process.env.DB_HOST, port: puerto, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD };
}

/** Explica un código de error de forma útil sin revelar datos de conexión. */
function explicar(error) {
  const codigo = error?.code || error?.name || "desconocido";
  const pistas = {
    "28P01": "usuario o contraseña incorrectos",
    "28000": "el usuario no tiene permiso para entrar",
    "3D000": "la base de datos no existe (revisa DB_NAME)",
    "42P01": "la tabla no existe (revisa fuente.tabla en config.json)",
    "42703": "una columna no existe (revisa las columnas en config.json)",
    "42501": "el usuario no tiene permiso de lectura sobre esa tabla",
    ECONNREFUSED: "el servidor rechazó la conexión (revisa DB_HOST y DB_PORT)",
    ENOTFOUND: "no se encontró el servidor (revisa DB_HOST)",
    ETIMEDOUT: "el servidor no respondió a tiempo (revisa la red o la VPN)",
    EHOSTUNREACH: "no se puede llegar al servidor (revisa la red o la VPN)",
  };
  return `No se pudo consultar PostgreSQL (${codigo})${pistas[codigo] ? `: ${pistas[codigo]}` : ""}.`;
}

let pool = null;
let pg = null;

async function obtenerPool() {
  if (pool) return pool;
  const cfg = configuracion();
  try {
    pg = (await import("pg")).default;
  } catch {
    throw new ConexionError("Falta instalar la dependencia `pg`: ejecuta `npm install` dentro de la carpeta backend.");
  }
  pool = new pg.Pool({
    ...cfg,
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    statement_timeout: 120000,
    application_name: "documentacion-calidad",
  });
  pool.on("error", () => undefined); // un cliente inactivo que se cae no debe tumbar la API
  return pool;
}

/**
 * Ejecuta un SELECT y devuelve las filas. Rechaza cualquier otra sentencia.
 * `analizadores` (opcional): { [oid del tipo de PostgreSQL]: (texto) => valor } para cambiar cómo se convierte un tipo
 * (por ejemplo, dejar las fechas como texto); los demás tipos usan la conversión normal del driver.
 */
export async function consultar(sql, analizadores = null) {
  if (!SOLO_SELECT.test(sql)) throw new ConexionError("Solo se permiten consultas SELECT.");
  const p = await obtenerPool();
  try {
    const peticion = analizadores
      ? { text: sql, types: { getTypeParser: (oid, formato) => analizadores[oid] ?? pg.types.getTypeParser(oid, formato) } }
      : sql;
    return (await p.query(peticion)).rows;
  } catch (error) {
    throw new ConexionError(explicar(error));
  }
}

/** Comprueba la conexión con una consulta mínima. */
export async function probarConexion() {
  const inicio = Date.now();
  await consultar("SELECT 1 AS ok");
  return { ok: true, ms: Date.now() - inicio };
}
