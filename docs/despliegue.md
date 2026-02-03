# Despliegue

Este documento describe el proceso de build, la configuración de ambientes y las consideraciones para producción del Portal Empresarial.

---

## 1. Proceso de build

### 1.1 Comando de build

```bash
npm run build
```

Según `package.json`, el script ejecuta:

- `export NODE_OPTIONS=--max-old-space-size=4096` (aumento de memoria para Node durante el build).
- `VITE_ENV=production vite build --mode production`.

Vite compila el proyecto en modo producción y genera la salida en la carpeta **`build/`** (definido en `vite.config.js` → `build.outDir: "build"`).

### 1.2 Contenido del build

- **HTML:** `index.html` (o el punto de entrada configurado) con referencias a los assets.
- **JavaScript/CSS:** Bundles con hash en el nombre (cache busting); los assets estáticos de `public/` se copian tal cual.
- **Variables de entorno:** Solo las variables con prefijo `VITE_` están disponibles en el cliente; se reemplazan en tiempo de build según el archivo `.env` del modo (`production` usa `.env.production`).

### 1.3 Requisitos para un build correcto

- Node.js con suficiente memoria (el script fija 4096 MB).
- Archivo **`.env.production`** en la raíz con las variables necesarias para producción (ver [setup.md](setup.md)):
  - `VITE_API_URL`, `VITE_API_URL_NEW` (obligatorias para login y funcionalidad principal).
  - `VITE_API_URL_APP_SHELL`, `VITE_API_KEY_APP_SHELL` (si se usan rutas del App Shell).
  - `VITE_ENCRYPTION_KEY` (recomendado no usar el valor por defecto en producción).
- Dependencias instaladas (`npm install`) y sin errores de compilación (p. ej. ESLint o tipos si se añaden).

### 1.4 Posibles fallos de build

- **JavaScript heap out of memory:** Aumentar `NODE_OPTIONS=--max-old-space-size=8192` (o superior) o ejecutar con ese valor antes de `npm run build`.
- **Error en tailwind.config.js:** Si se usa `@material-tailwind/react/utils/withMT` y el paquete no está instalado, el build puede fallar; ver [pendientes.md](pendientes.md).
- **Módulo no encontrado:** Verificar que todos los imports usen alias o rutas relativas correctas y que no falte ninguna dependencia en `package.json`.

---

## 2. Configuración de ambientes

### 2.1 Desarrollo

- **Archivo de entorno:** `.env.development`.
- **Comando:** `npm run dev`.
- **Servidor:** Vite dev server (host y puerto en `vite.config.js`; por defecto `http://192.168.0.68:5000`).
- **Variables:** Deben apuntar a APIs de desarrollo o a proxy local (p. ej. `/apid1`, `/apid2` si se usa proxy).

### 2.2 Producción

- **Archivo de entorno:** `.env.production`.
- **Comando:** `npm run build` (genera `build/`).
- **Variables:** Deben apuntar a las URLs y claves de las APIs de producción. No usar valores de desarrollo ni la clave de encriptación por defecto.

### 2.3 Preview (build local)

- **Comando:** `npm run preview`.
- **Uso:** Sirve el contenido de la carpeta `build/` para probar el build antes de desplegar (puerto 7150, host 192.168.0.2 según `package.json`).
- **Nota:** No sustituye a un servidor de producción; sirve para validar que el build funciona correctamente.

---

## 3. Consideraciones para producción

### 3.1 Variables de entorno

- Todas las `VITE_*` se embeben en el bundle en tiempo de build. No es posible cambiar URLs o claves sin volver a hacer build.
- En producción, usar `.env.production` con:
  - URLs finales de las tres APIs (HTTPS recomendado).
  - `VITE_ENCRYPTION_KEY` fuerte y exclusivo para producción.
  - `VITE_API_KEY_APP_SHELL` si se usan rutas del App Shell.

### 3.2 Servidor web y rutas SPA

- La aplicación es una SPA: todas las rutas deben devolver el mismo `index.html` (fallback) para que el router del cliente funcione al recargar o al acceder por URL directa.
- **Nginx (ejemplo):** Configurar `try_files $uri $uri/ /index.html;` para la ubicación que sirve los archivos estáticos del portal.
- **Otros servidores:** Asegurar que las rutas no manejadas por archivos estáticos redirijan o sirvan `index.html`.

### 3.3 CORS y cabeceras

- Las tres APIs deben permitir el origen del frontend en producción (cabecera `Origin`). Si las APIs y el frontend están en dominios distintos, CORS debe estar configurado en el backend.
- La API nueva debe aceptar la cabecera `id-session` desde el origen del frontend; la API App Shell debe aceptar `X-Portal-API-Key`.

### 3.4 Postbuild (script opcional)

El script `postbuild` en `package.json`:

- Borra el contenido de `/var/www/html/portalEmpresarial/`.
- Copia el contenido de `build/` a esa ruta.
- Ejecuta `sudo nginx -t` y `sudo systemctl reload nginx`.

Está pensado para un servidor Linux con nginx instalado y permisos de sudo. En otros entornos (Windows, macOS, CI/CD en contenedor, otro servidor web) este script no debe ejecutarse tal cual; se puede:

- Omitir el postbuild y desplegar `build/` por otro medio (rsync, CI/CD, contenedor).
- Adaptar el script a la ruta y al servidor web del entorno (IIS, Apache, etc.).

### 3.5 Seguridad

- No versionar `.env.development` ni `.env.production` (ya están en `.gitignore`).
- No usar en producción la clave de encriptación por defecto (`ENCRYPTION_KEY` en `env.js`).
- El token de sesión se guarda encriptado en `localStorage`; el backend debe validar y, si aplica, rotar o expirar sesiones.

### 3.6 Rendimiento y caché

- Los bundles generados por Vite incluyen hash en el nombre; se puede configurar el servidor para cachear assets estáticos con cabeceras de larga duración.
- El `index.html` no debe cachearse de forma agresiva para que los usuarios reciban nuevas referencias a JS/CSS tras cada despliegue.

---

## 4. Resumen de comandos

| Objetivo           | Comando           | Salida / efecto |
|--------------------|-------------------|------------------|
| Desarrollo local   | `npm run dev`     | Servidor en host:puerto (p. ej. 192.168.0.68:5000). |
| Build producción   | `npm run build`   | Carpeta `build/` con assets y `index.html`. |
| Probar build local | `npm run preview` | Sirve `build/` en puerto 7150. |
| Desarrollo con PM2 | `npm run pm2Dev`  | Dev server bajo PM2 (nombre `portalEmpresarial`). |

---

*Ante cambios en `vite.config.js`, `package.json` o en la forma de desplegar, conviene actualizar este documento.*
