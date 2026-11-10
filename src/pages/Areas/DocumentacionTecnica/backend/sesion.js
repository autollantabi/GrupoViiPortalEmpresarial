/**
 * Validación de la sesión del Portal Empresarial y del recurso `documentaciontecnica` (acceso exclusivo de TI).
 *
 * Cómo funciona (la misma regla que usa el portal en src/utils/permissionsValidator.js):
 *  1. El navegador manda la cabecera `id-session` (la agrega api.js del módulo).
 *  2. Aquí se pregunta al portal quién es: GET {PORTAL_API_URL}/auth/me con esa cabecera. Esa API devuelve al usuario con
 *     sus `CONTEXTOS` (cada uno con un RECURSO, HERENCIA y lo BLOQUEADO).
 *  3. Un contexto da acceso a un recurso si coincide con él o es su padre ("documentaciontecnica" cubre
 *     "documentaciontecnica.calidad") y no está bloqueado.
 *  Cada ruta exige su recurso: /calidad/* → documentaciontecnica.calidad, etc.; las de salud, el recurso raíz.
 *
 * Respuestas: 401 sin sesión válida, 403 sin permiso, 503 si el portal no responde (se cierra por defecto: sin poder
 * validar no se deja pasar). El resultado se guarda en memoria `DOC_SESION_CACHE_S` segundos (60 por defecto) para no
 * preguntar al portal en cada petición. El id-session nunca se escribe en el registro ni se devuelve.
 *
 * Variables:
 *   PORTAL_API_URL   base de la API de autenticación del portal (la misma que VITE_API_URL_NEW), sin "/auth/me" al final
 *   DOC_AUTH         "portal" (exige sesión) o "ninguna" (sin validar; solo para desarrollo local).
 *                    Sin definirla: "portal" si hay PORTAL_API_URL o si NODE_ENV=production; si no, "ninguna".
 */
import "./entorno.js";

export class SesionError extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

export const RECURSO_RAIZ = "documentaciontecnica";
const SECCIONES = [
  ["/diccionario/", "diccionario"],
  ["/dwh-mapping/", "dwhmapping"],
  ["/caracterizacion/", "caracterizacion"],
  ["/calidad/", "calidad"],
  ["/completitud/", "completitud"],
];

const normalizar = (v) => String(v ?? "").toLowerCase().trim();

/** Recurso que exige una ruta de la API; null si es pública (solo /salud/). Una ruta desconocida exige el recurso raíz. */
export function recursoDeRuta(ruta) {
  if (ruta === "/salud/") return null;
  const seccion = SECCIONES.find(([prefijo]) => ruta.startsWith(prefijo));
  return seccion ? `${RECURSO_RAIZ}.${seccion[1]}` : RECURSO_RAIZ;
}

export function modoAutenticacion(env = process.env) {
  const dado = normalizar(env.DOC_AUTH);
  if (dado === "portal" || dado === "ninguna") return dado;
  return normalizar(env.PORTAL_API_URL) || normalizar(env.NODE_ENV) === "production" ? "portal" : "ninguna";
}

/* ------------------------------ la regla de acceso del portal ------------------------------ */

function aLista(valor) {
  if (!valor || valor === "[]") return [];
  if (Array.isArray(valor)) return valor;
  if (typeof valor === "string") {
    try {
      const r = JSON.parse(valor);
      return Array.isArray(r) ? r : [];
    } catch {
      return [];
    }
  }
  return [];
}

function estaBloqueado(bloqueados, objetivo) {
  return aLista(bloqueados).some((b) => {
    const recurso = normalizar(typeof b === "string" ? b : b?.resource);
    return recurso && (recurso === objetivo || objetivo.startsWith(`${recurso}.`));
  });
}

/** Port de hasAccessToResource del portal: ¿algún contexto da acceso a `recurso`? */
export function tieneAcceso(contextos, recurso) {
  const lista = aLista(contextos);
  const objetivo = normalizar(recurso);
  if (!lista.length || !objetivo) return false;
  return lista.some((c) => {
    const propio = normalizar(c?.RECURSO);
    if (!propio) return false;
    if (estaBloqueado(c.RECURSOS_BLOQUEADOS || c.BLOQUEADO, objetivo)) return false;
    if (propio === objetivo) return true;
    return c.HERENCIA !== false && objetivo.startsWith(`${propio}.`);
  });
}

/* ------------------------------ consulta al portal ------------------------------ */

const TIEMPO_ESPERA_MS = 8000;
const MAX_EN_MEMORIA = 500;
const cache = new Map(); // id-session -> { hasta, contextos }
const pendientes = new Map(); // id-session -> promesa (varias peticiones a la vez comparten la consulta)

export const vaciarCache = () => {
  cache.clear();
  pendientes.clear();
};

async function preguntarAlPortal(idSesion) {
  const base = String(process.env.PORTAL_API_URL ?? "").trim().replace(/\/+$/, "");
  if (!base) throw new SesionError(503, "La validación de sesión no está configurada (falta PORTAL_API_URL).");
  let respuesta;
  try {
    respuesta = await fetch(`${base}/auth/me`, { headers: { "id-session": idSesion }, signal: AbortSignal.timeout(TIEMPO_ESPERA_MS) });
  } catch {
    throw new SesionError(503, "No se pudo validar la sesión con el portal.");
  }
  if (respuesta.status === 401 || respuesta.status === 403) throw new SesionError(401, "Sesión no válida o vencida.");
  if (!respuesta.ok) throw new SesionError(503, "No se pudo validar la sesión con el portal.");
  let cuerpo;
  try {
    cuerpo = await respuesta.json();
  } catch {
    throw new SesionError(503, "No se pudo validar la sesión con el portal.");
  }
  const usuario = cuerpo?.data ?? cuerpo; // el portal lee response.data.data || response.data
  const contextos = aLista(usuario?.CONTEXTOS);
  if (!usuario || typeof usuario !== "object") throw new SesionError(401, "Sesión no válida o vencida.");
  return contextos;
}

async function contextosDe(idSesion) {
  const guardado = cache.get(idSesion);
  if (guardado && guardado.hasta > Date.now()) return guardado.contextos;
  if (!pendientes.has(idSesion)) {
    const segundos = Number(process.env.DOC_SESION_CACHE_S);
    const duracion = (Number.isFinite(segundos) && segundos >= 0 ? segundos : 60) * 1000;
    pendientes.set(
      idSesion,
      preguntarAlPortal(idSesion)
        .then((contextos) => {
          if (cache.size >= MAX_EN_MEMORIA) cache.delete(cache.keys().next().value);
          if (duracion > 0) cache.set(idSesion, { hasta: Date.now() + duracion, contextos });
          return contextos;
        })
        .finally(() => pendientes.delete(idSesion))
    );
  }
  return pendientes.get(idSesion);
}

/** Deja pasar la petición o lanza SesionError (401, 403 o 503). `ruta` es la ruta de la API sin el prefijo. */
export async function autorizar(req, ruta) {
  const recurso = recursoDeRuta(ruta);
  if (!recurso || modoAutenticacion() === "ninguna") return;
  const idSesion = String(req.headers["id-session"] ?? "").trim();
  if (!idSesion) throw new SesionError(401, "Falta iniciar sesión en el portal.");
  const contextos = await contextosDe(idSesion);
  if (!tieneAcceso(contextos, recurso)) throw new SesionError(403, "Tu usuario no tiene acceso a Documentación Técnica.");
}
