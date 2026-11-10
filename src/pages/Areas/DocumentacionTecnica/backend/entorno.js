/**
 * Carga backend/.env (si existe) en process.env. Sin dependencias: formato CLAVE=valor, líneas con # son comentarios,
 * los valores pueden ir entre comillas. Las variables que ya estén definidas en el sistema NO se pisan:
 * así en un servidor se pueden definir las credenciales como variables de entorno, sin archivo .env.
 *
 * Este archivo nunca imprime valores: los .env contienen credenciales.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const archivo = path.join(path.dirname(fileURLToPath(import.meta.url)), ".env");

export const hayArchivoEnv = fs.existsSync(archivo);

if (hayArchivoEnv) {
  for (const linea of fs.readFileSync(archivo, "utf-8").split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(linea);
    if (!m || linea.trim().startsWith("#")) continue;
    let valor = m[2];
    if (/^(["']).*\1$/.test(valor)) valor = valor.slice(1, -1);
    else valor = valor.replace(/\s+#.*$/, ""); // comentario al final de la línea
    if (process.env[m[1]] === undefined) process.env[m[1]] = valor;
  }
}
