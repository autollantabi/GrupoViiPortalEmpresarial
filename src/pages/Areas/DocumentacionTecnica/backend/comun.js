import fs from "node:fs";

/** Responde con JSON. Si `cuerpo` ya es texto JSON se envía tal cual. */
export function enviarJson(res, codigo, cuerpo) {
  res.statusCode = codigo;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo));
}

/** Parámetros de la URL; los valores múltiples llegan repetidos (?empresa=A&empresa=B). */
export function consulta(req) {
  return new URL(req.url, "http://localhost").searchParams;
}

/** Responde con texto plano (por ejemplo un CSV para descargar). */
export function enviarTexto(res, codigo, texto, cabeceras = {}) {
  res.statusCode = codigo;
  for (const [k, v] of Object.entries(cabeceras)) res.setHeader(k, v);
  res.end(texto);
}

/** Responde con el contenido de un archivo JSON (lo lee en cada petición, así los cambios se ven al instante). */
export function enviarArchivoJson(res, ruta) {
  try {
    enviarJson(res, 200, fs.readFileSync(ruta, "utf-8"));
  } catch {
    enviarJson(res, 404, { error: "Falta el archivo de datos de esta sección" });
  }
}
