/**
 * Pruebas de la validación de sesión y recurso (backend/sesion.js) SIN el portal real: un servidor local imita /auth/me.
 *
 * Uso (desde backend/):   node pruebas/sesion.mjs
 *
 * Comprueban la regla de acceso (la misma del portal: herencia, bloqueos), los códigos 401/403/503, que se cierra por
 * defecto si el portal no responde, el modo de autenticación por variables y la caché de sesiones. Al final, una prueba
 * de punta a punta por HTTP contra apiSimulada con rutas reales.
 */
import assert from "node:assert/strict";
import http from "node:http";

process.env.DOC_SESION_CACHE_S = "60";
const { autorizar, modoAutenticacion, recursoDeRuta, tieneAcceso, vaciarCache, SesionError } = await import("../sesion.js");
const { apiSimulada } = await import("../apiSimulada.js");

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

/* ------------------------------ regla de acceso ------------------------------ */

await prueba("recursoDeRuta: cada sección exige su recurso y lo desconocido exige el raíz", () => {
  assert.equal(recursoDeRuta("/salud/"), null);
  assert.equal(recursoDeRuta("/salud/db/"), "documentaciontecnica");
  assert.equal(recursoDeRuta("/salud/hana/"), "documentaciontecnica");
  assert.equal(recursoDeRuta("/diccionario/"), "documentaciontecnica.diccionario");
  assert.equal(recursoDeRuta("/diccionario/actualizar/"), "documentaciontecnica.diccionario");
  assert.equal(recursoDeRuta("/dwh-mapping/"), "documentaciontecnica.dwhmapping");
  assert.equal(recursoDeRuta("/caracterizacion/"), "documentaciontecnica.caracterizacion");
  assert.equal(recursoDeRuta("/calidad/exportar/"), "documentaciontecnica.calidad");
  assert.equal(recursoDeRuta("/completitud/resumen/"), "documentaciontecnica.completitud");
  assert.equal(recursoDeRuta("/otra-cosa/"), "documentaciontecnica");
});

await prueba("tieneAcceso: coincidencia, herencia, bloqueos y formatos", () => {
  const raiz = [{ RECURSO: "documentaciontecnica" }];
  assert.ok(tieneAcceso(raiz, "documentaciontecnica"));
  assert.ok(tieneAcceso(raiz, "documentaciontecnica.calidad"), "el padre cubre a los hijos");
  assert.ok(tieneAcceso([{ RECURSO: "DocumentacionTecnica.Calidad" }], "documentaciontecnica.calidad"), "sin importar mayúsculas");
  assert.ok(!tieneAcceso([{ RECURSO: "documentaciontecnica.calidad" }], "documentaciontecnica"), "el hijo no cubre al padre");
  assert.ok(!tieneAcceso([{ RECURSO: "documentaciontecnica.calidad" }], "documentaciontecnica.diccionario"));
  assert.ok(!tieneAcceso([{ RECURSO: "documentaciontecnica", HERENCIA: false }], "documentaciontecnica.calidad"), "sin herencia");
  assert.ok(tieneAcceso([{ RECURSO: "documentaciontecnica", HERENCIA: false }], "documentaciontecnica"));
  assert.ok(!tieneAcceso([{ RECURSO: "documentaciontecnica", BLOQUEADO: '["documentaciontecnica.calidad"]' }], "documentaciontecnica.calidad"), "bloqueado (JSON en texto)");
  assert.ok(tieneAcceso([{ RECURSO: "documentaciontecnica", BLOQUEADO: '["documentaciontecnica.calidad"]' }], "documentaciontecnica.diccionario"));
  assert.ok(!tieneAcceso([{ RECURSO: "documentaciontecnica", RECURSOS_BLOQUEADOS: [{ resource: "documentaciontecnica" }] }], "documentaciontecnica.calidad"), "bloqueo con objeto {resource}");
  assert.ok(tieneAcceso([{ RECURSO: "x" }, { RECURSO: "documentaciontecnica" }], "documentaciontecnica.calidad"), "cualquier contexto sirve");
  assert.ok(tieneAcceso(JSON.stringify(raiz), "documentaciontecnica"), "CONTEXTOS como texto JSON");
  for (const vacio of [null, undefined, [], "", "no es json", [{}], [{ RECURSO: "" }]]) assert.ok(!tieneAcceso(vacio, "documentaciontecnica"));
  assert.ok(!tieneAcceso(raiz, ""));
});

await prueba("modoAutenticacion: por defecto cierra en producción y abre en desarrollo local", () => {
  assert.equal(modoAutenticacion({}), "ninguna");
  assert.equal(modoAutenticacion({ PORTAL_API_URL: "http://x" }), "portal");
  assert.equal(modoAutenticacion({ NODE_ENV: "production" }), "portal", "en producción sin variables, no se deja pasar");
  assert.equal(modoAutenticacion({ NODE_ENV: "production", DOC_AUTH: "ninguna" }), "ninguna", "lo explícito manda");
  assert.equal(modoAutenticacion({ PORTAL_API_URL: "http://x", DOC_AUTH: "ninguna" }), "ninguna");
  assert.equal(modoAutenticacion({ DOC_AUTH: "PORTAL" }), "portal");
  assert.equal(modoAutenticacion({ DOC_AUTH: "otra cosa" }), "ninguna");
});

/* ------------------------------ portal simulado ------------------------------ */

const sesiones = {
  ti: { CONTEXTOS: [{ RECURSO: "documentaciontecnica" }] },
  soloCalidad: { CONTEXTOS: [{ RECURSO: "documentaciontecnica.calidad" }] },
  sinCalidad: { CONTEXTOS: [{ RECURSO: "documentaciontecnica", BLOQUEADO: '["documentaciontecnica.calidad"]' }] },
  otraArea: { CONTEXTOS: [{ RECURSO: "cartera" }] },
  anidada: { data: { CONTEXTOS: [{ RECURSO: "documentaciontecnica" }] } }, // el portal acepta response.data.data o response.data
};
let consultasAlPortal = 0;
let modoPortal = "normal"; // "normal" | "caido" | "error500" | "basura"
const portal = http.createServer((req, res) => {
  consultasAlPortal += 1;
  if (req.url !== "/auth/me") return res.writeHead(404).end();
  if (modoPortal === "error500") return res.writeHead(500).end("{}");
  if (modoPortal === "basura") return res.writeHead(200).end("no es json");
  const s = sesiones[req.headers["id-session"]];
  if (!s) return res.writeHead(401, { "Content-Type": "application/json" }).end('{"message":"sesión inválida"}');
  res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(s));
});
await new Promise((ok) => portal.listen(0, "127.0.0.1", ok));
const urlPortal = `http://127.0.0.1:${portal.address().port}`;

const peticion = (sesion) => ({ headers: sesion === undefined ? {} : { "id-session": sesion } });
const resultado = async (sesion, ruta) => {
  try {
    await autorizar(peticion(sesion), ruta);
    return "pasa";
  } catch (e) {
    assert.ok(e instanceof SesionError, `error inesperado: ${e}`);
    return e.estado;
  }
};
const modoPortalActivo = () => {
  process.env.DOC_AUTH = "portal";
  process.env.PORTAL_API_URL = urlPortal + "/"; // con barra final a propósito
  vaciarCache();
  consultasAlPortal = 0;
  modoPortal = "normal";
};

await prueba("autorizar: 401 sin sesión o con sesión desconocida; 200 con TI", async () => {
  modoPortalActivo();
  assert.equal(await resultado(undefined, "/calidad/resumen/"), 401);
  assert.equal(await resultado("", "/calidad/resumen/"), 401);
  assert.equal(await resultado("   ", "/calidad/resumen/"), 401);
  assert.equal(consultasAlPortal, 0, "sin cabecera ni siquiera se consulta al portal");
  assert.equal(await resultado("no-existe", "/calidad/resumen/"), 401);
  assert.equal(await resultado("ti", "/calidad/resumen/"), "pasa");
  assert.equal(await resultado("anidada", "/diccionario/"), "pasa");
});

await prueba("autorizar: 403 según el recurso de cada ruta", async () => {
  modoPortalActivo();
  assert.equal(await resultado("otraArea", "/calidad/resumen/"), 403);
  assert.equal(await resultado("otraArea", "/salud/hana/"), 403);
  assert.equal(await resultado("soloCalidad", "/calidad/resumen/"), "pasa");
  assert.equal(await resultado("soloCalidad", "/calidad/actualizar/"), "pasa");
  assert.equal(await resultado("soloCalidad", "/diccionario/"), 403);
  assert.equal(await resultado("soloCalidad", "/salud/db/"), 403, "las rutas de salud exigen el recurso raíz");
  assert.equal(await resultado("sinCalidad", "/calidad/resumen/"), 403);
  assert.equal(await resultado("sinCalidad", "/completitud/resumen/"), "pasa");
  assert.equal(await resultado("ti", "/ruta-inventada/"), "pasa");
  assert.equal(await resultado("otraArea", "/ruta-inventada/"), 403);
});

await prueba("autorizar: /salud/ es pública", async () => {
  modoPortalActivo();
  assert.equal(await resultado(undefined, "/salud/"), "pasa");
  assert.equal(consultasAlPortal, 0);
});

await prueba("autorizar: la sesión validada se guarda en memoria y las consultas simultáneas se comparten", async () => {
  modoPortalActivo();
  await Promise.all([resultado("ti", "/calidad/resumen/"), resultado("ti", "/diccionario/"), resultado("ti", "/completitud/resumen/")]);
  assert.equal(consultasAlPortal, 1, "tres peticiones a la vez, una sola consulta al portal");
  await resultado("ti", "/calidad/filas/");
  await resultado("ti", "/calidad/filas/");
  assert.equal(consultasAlPortal, 1, "las siguientes salen de la memoria");
  await resultado("soloCalidad", "/calidad/resumen/");
  assert.equal(consultasAlPortal, 2, "otra sesión se consulta aparte");
});

await prueba("autorizar: sin caché (DOC_SESION_CACHE_S=0) se consulta cada vez, y un rechazo no se guarda", async () => {
  modoPortalActivo();
  process.env.DOC_SESION_CACHE_S = "0";
  await resultado("ti", "/calidad/resumen/");
  await resultado("ti", "/calidad/resumen/");
  assert.equal(consultasAlPortal, 2);
  process.env.DOC_SESION_CACHE_S = "60";
  vaciarCache();
  await resultado("no-existe", "/calidad/resumen/");
  await resultado("no-existe", "/calidad/resumen/");
  assert.equal(consultasAlPortal, 4, "una sesión rechazada se vuelve a consultar (podría iniciar sesión después)");
});

await prueba("autorizar: si el portal falla se cierra con 503, nunca se deja pasar", async () => {
  modoPortalActivo();
  modoPortal = "error500";
  assert.equal(await resultado("ti", "/calidad/resumen/"), 503);
  modoPortal = "basura";
  assert.equal(await resultado("ti", "/calidad/resumen/"), 503);
  modoPortal = "normal";
  process.env.PORTAL_API_URL = "http://127.0.0.1:1"; // nadie escucha
  vaciarCache();
  assert.equal(await resultado("ti", "/calidad/resumen/"), 503);
  process.env.PORTAL_API_URL = "";
  vaciarCache();
  assert.equal(await resultado("ti", "/calidad/resumen/"), 503, "modo portal sin PORTAL_API_URL");
});

await prueba("autorizar: DOC_AUTH=ninguna no valida nada (solo desarrollo local)", async () => {
  process.env.DOC_AUTH = "ninguna";
  process.env.PORTAL_API_URL = "http://127.0.0.1:1";
  assert.equal(await resultado(undefined, "/calidad/resumen/"), "pasa");
  assert.equal(await resultado("cualquiera", "/salud/hana/"), "pasa");
});

/* ------------------------------ de punta a punta por HTTP ------------------------------ */

await prueba("HTTP: apiSimulada responde 401, 403, 200 y no filtra el id-session", async () => {
  modoPortalActivo();
  const api = http.createServer((req, res) => apiSimulada(req, res));
  await new Promise((ok) => api.listen(0, "127.0.0.1", ok));
  const base = `http://127.0.0.1:${api.address().port}/api/documentacion`;
  const pedir = async (ruta, sesion, opciones = {}) => {
    const r = await fetch(base + ruta, { ...opciones, headers: { ...(sesion ? { "id-session": sesion } : {}), ...opciones.headers } });
    return { estado: r.status, cuerpo: await r.text() };
  };

  assert.equal((await pedir("/salud/")).estado, 200);
  const sin = await pedir("/calidad/resumen/");
  assert.equal(sin.estado, 401);
  assert.match(sin.cuerpo, /iniciar sesión/);
  const prohibido = await pedir("/calidad/resumen/", "otraArea");
  assert.equal(prohibido.estado, 403);
  assert.equal((await pedir("/calidad/resumen/", "ti")).estado, 200);
  assert.equal((await pedir("/diccionario/", "soloCalidad")).estado, 403);
  assert.equal((await pedir("/diccionario/", "ti")).estado, 200);
  assert.equal((await pedir("/ruta-que-no-existe/", "ti")).estado, 404);
  // los POST también pasan por la validación (antes de leer ninguna base)
  assert.equal((await pedir("/calidad/actualizar/", undefined, { method: "POST" })).estado, 401);
  assert.equal((await pedir("/diccionario/actualizar/", "otraArea", { method: "POST" })).estado, 403);
  assert.equal((await pedir("/diccionario/actualizar/", "soloCalidad", { method: "POST" })).estado, 403);
  for (const r of [sin, prohibido]) assert.ok(!/otraArea|PORTAL_API_URL|127\.0\.0\.1/.test(r.cuerpo), "los errores no revelan sesión ni direcciones");

  modoPortal = "caido";
  process.env.PORTAL_API_URL = "http://127.0.0.1:1";
  vaciarCache();
  const caido = await pedir("/calidad/resumen/", "ti");
  assert.equal(caido.estado, 503);
  assert.ok(!/127\.0\.0\.1/.test(caido.cuerpo));
  api.close();
});

portal.close();
console.log(`OK: ${pruebas} pruebas de sesión y permisos.`);
process.exit(0);
