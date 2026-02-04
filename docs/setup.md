# Configuración y ejecución del proyecto

Este documento describe los requisitos del sistema, las variables de entorno necesarias, los pasos para ejecutar el proyecto localmente y los errores comunes con su resolución.

---

## 1. Requisitos del sistema

| Requisito        | Versión / detalle                                      |
|------------------|--------------------------------------------------------|
| Node.js          | LTS recomendada (v18 o superior). Verificar con `node -v` |
| npm              | Incluido con Node.js. Verificar con `npm -v`          |
| Sistema operativo| Cualquier SO donde funcione Node.js (Linux, macOS, Windows) |
| Navegador        | Últimas versiones de Chrome, Firefox o Safari (según `browserslist` en `package.json`) |

**Nota:** El script `postbuild` del proyecto asume un entorno Linux con nginx y rutas `/var/www/html/portalEmpresarial`. En Windows o macOS ese script no se ejecutará correctamente a menos que se adapte o se omita (el build se genera igual en la carpeta `build/`).

---

## 2. Variables de entorno necesarias

Todas las variables expuestas al cliente en Vite deben tener el prefijo **`VITE_`**. Se definen en archivos en la raíz del proyecto:

- **Desarrollo:** `.env.development`
- **Producción:** `.env.production`

El código las consume de forma centralizada en **`src/config/env.js`** (exporta `API_URL`, `API_URL_NEW`, `ENCRYPTION_KEY`, `MODE`, `FRONT_DEV`, `ENV_NAME`).

| Variable en .env       | Obligatoria | Uso |
|------------------------|-------------|-----|
| `VITE_API_URL`         | Sí*         | Base URL de la API principal (cartera, compras, contabilidad, importaciones, etc.). En `env.js`: `API_URL`. |
| `VITE_API_URL_NEW`     | Sí*         | Base URL de la API nueva (auth, `/auth/me`, 5W2H, transacciones, permisos). En `env.js`: `API_URL_NEW`. |
| `VITE_ENCRYPTION_KEY`  | Sí*         | Clave para encriptar/desencriptar `id-session` en `localStorage`. En `env.js`: `ENCRYPTION_KEY`. Si no se define, el código usa un valor por defecto (no recomendado en producción). |
| `VITE_FRONT_DEV`       | No          | URL del frontend (ej. iframes o links). En `env.js`: `FRONT_DEV`. |
| `VITE_ENV`             | No          | Entorno: `development` o `production`. En `env.js`: `ENV_NAME`. Por defecto se usa `MODE` de Vite. |

\* Sin `VITE_API_URL` y `VITE_API_URL_NEW` el login y la mayoría de funcionalidades no funcionarán.

**Ejemplo de `.env.development` (valores de ejemplo):**

```env
VITE_ENV=development
VITE_API_URL=http://192.168.0.68:3002
VITE_API_URL_NEW=http://192.168.0.68:3004
VITE_ENCRYPTION_KEY=clave-secreta-cambiar-en-produccion
VITE_FRONT_DEV=http://192.168.0.68:5000
```

Los archivos `.env.development` y `.env.production` están listados en `.gitignore`; no se versionan. Cada desarrollador o entorno debe tener su propia copia con valores correctos.

---

## 3. Pasos para ejecutar el proyecto localmente

### 3.1 Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd PortalEmpresarial
npm install
```

### 3.2 Configurar variables de entorno

1. Crear en la raíz del proyecto el archivo `.env.development` (o copiar desde una plantilla si existe).
2. Completar las variables indicadas en la sección anterior con las URLs y claves del entorno local o de desarrollo.

### 3.3 Ejecutar en desarrollo

```bash
npm run dev
```

- **URL por defecto:** según `vite.config.js`, el servidor de desarrollo suele estar en `http://192.168.0.68:5000` (host `192.168.0.68`, puerto `5000`, `strictPort: true`).
- Para usar otro host o puerto, modificar `vite.config.js` → `server.host` y `server.port`.

### 3.4 Acceder a la aplicación

1. Abrir en el navegador la URL del servidor de desarrollo (ej. `http://192.168.0.68:5000`).
2. Ir a la ruta `/login` e iniciar sesión con credenciales válidas de la API de autenticación (`VITE_API_URL_NEW`).
3. Tras el login, el menú lateral y las rutas visibles dependerán de los permisos (recursos) del usuario.

### 3.5 Otros comandos útiles

| Comando           | Descripción |
|-------------------|-------------|
| `npm run build`   | Genera el build de producción en la carpeta `build/`. Requiere `NODE_OPTIONS=--max-old-space-size=4096` y `VITE_ENV=production` (según `package.json`). |
| `npm run preview` | Sirve el contenido de `build/` (puerto 7150, host 192.168.0.2 según `package.json`). |
| `npm run pm2Dev`  | Ejecuta el dev server bajo PM2 (nombre `portalEmpresarial`) y muestra logs. Depende de tener PM2 instalado. |

---

## 4. Errores comunes y cómo resolverlos

### 4.1 Login no redirige / "Network Error" o timeout en login

- **Causa:** `VITE_API_URL_NEW` incorrecta, API caída o CORS.
- **Solución:** Verificar que `VITE_API_URL_NEW` apunte a la API de autenticación accesible desde el navegador; comprobar que el backend esté en marcha y permita el origen del frontend.

### 4.2 Después del login, pantalla en blanco o sin menú

- **Causa:** Falla en `/auth/me` (API nueva) o usuario sin `CONTEXTOS`/permisos; también puede ser un error de JavaScript no capturado.
- **Solución:** Revisar la pestaña Red del navegador para ver si `/auth/me` responde 200 y devuelve usuario con `CONTEXTOS`. Revisar consola del navegador por errores. Verificar que el backend devuelva la estructura esperada (ver documentación de la API).

### 4.3 Puerto 5000 ya en uso

- **Causa:** Otro proceso usa el puerto configurado en `vite.config.js` (`strictPort: true`).
- **Solución:** Cambiar `server.port` en `vite.config.js` o cerrar el proceso que usa el puerto 5000.

### 4.4 Build falla por "JavaScript heap out of memory"

- **Causa:** El proceso de Node se queda sin memoria durante el build.
- **Solución:** El script `build` en `package.json` ya define `NODE_OPTIONS=--max-old-space-size=4096`. Si sigue fallando, aumentar el valor (ej. 8192) o ejecutar: `export NODE_OPTIONS=--max-old-space-size=8192 && npm run build`.

### 4.5 postbuild falla (rm, cp, nginx)

- **Causa:** El script `postbuild` está pensado para un servidor Linux con nginx y rutas concretas.
- **Solución:** En desarrollo local o en Windows/macOS, no es necesario ejecutar `postbuild`. Ejecutar solo `npm run build`; el resultado estará en `build/`. Para producción en Linux, adaptar las rutas y permisos del script o desactivar `postbuild` y desplegar por otro medio (CI/CD, script propio).

### 4.6 Módulo no encontrado (alias de path)

- **Causa:** Import con alias (`components/`, `config/`, `pages/`, etc.) no resuelto.
- **Solución:** Los alias están definidos en `vite.config.js` → `resolve.alias`. Asegurarse de usar los mismos nombres que en la configuración (`components`, `config`, `pages`, `router`, `services`, `utils`, `assets`, `hooks`). Si se añade un nuevo alias, añadirlo también en `vite.config.js` y, si existe, en `jsconfig.json`.

### 4.7 Tailwind / withMT

- **Causa:** `tailwind.config.js` usa `require("@material-tailwind/react/utils/withMT")`. Si el paquete `@material-tailwind/react` no está instalado, el build o el dev pueden fallar.
- **Solución:** Instalar la dependencia si se usa Material Tailwind, o simplificar `tailwind.config.js` para usar solo Tailwind estándar (ver [docs/pendientes.md](pendientes.md)).

---

## 5. Verificación rápida

Tras `npm install` y configurar `.env.development`:

1. `npm run dev` — no debe haber errores de compilación.
2. Abrir la URL del servidor y navegar a `/login`.
3. Iniciar sesión — debe redirigir al inicio o al home y mostrar el sidebar según permisos.

Si alguno de estos pasos falla, revisar consola del navegador, pestaña Red y logs del terminal; y contrastar con los errores comunes anteriores.
