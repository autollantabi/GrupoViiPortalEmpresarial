# Portal Empresarial GrupoVii

SPA (React + Vite) que centraliza acceso a Cartera, Compras, Contabilidad, Marketing, Reportería, RRHH, Gobierno de Datos y Administración. Autenticación y autorización por recurso (y por empresa/línea).

## Requisitos

- Node.js (recomendado LTS)
- npm

## Instalación y configuración

### 1. Clonar e instalar

```bash
git clone <url-del-repositorio>
cd PortalEmpresarial
npm install
```

### 2. Variables de entorno

Copia `.env.development` (o crea uno) en la raíz y ajusta los valores. Las variables se consumen desde `src/config/env.js`.

| Variable | Uso |
|--------|-----|
| `VITE_ENV` | `development` o `production` |
| `VITE_API_URL` | Base URL API principal |
| `VITE_API_URL_NEW` | Base URL API nueva (auth, 5W2H, transacciones, permisos) |
| `VITE_API_URL_APP_SHELL` | Base URL App Shell |
| `VITE_API_KEY_APP_SHELL` | API Key para App Shell (cabecera X-Portal-API-Key) |
| `VITE_ENCRYPTION_KEY` | Clave para encriptar id-session en localStorage |
| `VITE_FRONT_DEV` | (Opcional) URL del frontend para iframes/links |

Para producción usa `.env.production` con las mismas variables y valores de producción.

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

- **URL:** `http://192.168.0.68:5000` (puerto y host en `vite.config.js`).
- **Login:** `/login`. El resto de rutas están protegidas por recurso.

### 4. Build para producción

```bash
npm run build
```

Genera la carpeta **`build/`** (no `dist/`). El script `postbuild` puede copiar a `/var/www/html/portalEmpresarial/` y recargar nginx si está configurado.

### 5. Preview de producción

```bash
npm run preview
```

Sirve el build en el puerto configurado (ej. 7150).

---

## Estructura relevante

```
src/
├── config/          # env.js, axiosConfig.js, constants.js
├── context/         # authContext, ThemeContext, SidebarContext
├── router/          # SimpleRouter.jsx (APP_CONFIG, rutas protegidas)
├── pages/           # auth/, home/, Areas/ (Cartera, Compras, Marketing, etc.)
├── components/      # layout/, common/, UI/
├── services/        # Llamadas HTTP (3 APIs)
└── utils/           # encryption, permissionsValidator, theme, etc.
```

- **Rutas y menú:** `src/router/SimpleRouter.jsx`
- **Sesión:** `src/context/authContext.jsx` + `src/services/authService.js`
- **Variables de entorno:** `src/config/env.js` (todas las `VITE_*`)

---

## Las 3 APIs

El proyecto usa **3 instancias de Axios** (`src/config/axiosConfig.js`):

1. **VITE_API_URL** → Cartera, Compras, Contabilidad, Importaciones, Recovery, Créditos, Transacciones.
2. **VITE_API_URL_NEW** → Login, `/auth/me`, 5W2H, Transacciones cartera, Desbloqueo, Permisos/Roles/Usuarios.
3. **VITE_API_URL_APP_SHELL** → Usuarios/vendedores app shell (cabecera `X-Portal-API-Key`).

---

## Documentación técnica

Para arquitectura, flujos, permisos por recurso y detalle de APIs, ver **[DOCUMENTACION_TECNICA.md](./DOCUMENTACION_TECNICA.md)**.

---

## Colaboradores

- **Diego Barbecho** (GitHub: [diegobarpdev](https://github.com/diegobarpdev)) — Desarrollador Frontend
