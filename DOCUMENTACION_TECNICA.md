# Documentación Técnica — Portal Empresarial GrupoVii

**Proyecto:** Portal Empresarial GrupoVii  
**Stack:** React 18, Vite 6, styled-components, Axios  
**Autor principal:** Diego Barbecho (GitHub: diegobarpdev)

---

## 1. Visión general del proyecto

### 1.1 Propósito

Portal Empresarial es una SPA (Single Page Application) que actúa como **portal unificado** para distintas áreas de negocio: Cartera, Compras (Importaciones, Créditos, Anticipos), Contabilidad (Comisiones, Flujo de Caja, Conversión), Marketing (5W2H, Inventario, Comercial), Reportería (múltiples reportes por empresa/línea), RRHH (Documentación), Gobierno de Datos (Maestros) y Administración de Usuarios.

### 1.2 Características principales

- **Autenticación:** Login con correo/contraseña; sesión persistente mediante `id-session` encriptado en `localStorage`.
- **Autorización por recursos:** Acceso por recurso con notación de puntos (ej. `contabilidad.comisiones.tecnicentro.productos`). Empresas y líneas disponibles se calculan por recurso desde el backend.
- **Rutas protegidas:** `SimpleRouter` + `ProtectedContent` verifican recurso y alternativos; inyectan `routeConfig`, `availableCompanies`, `availableLines` a cada página.
- **Tema:** Light/Dark persistido en `localStorage`.
- **Sidebar dinámico:** Menú generado desde `APP_CONFIG` y permisos del usuario; jerarquía por puntos (ej. Contabilidad > Comisiones > Tecnicentro > Reportes / Categorías).

### 1.3 Tecnologías

| Tecnología        | Uso principal                          |
|-------------------|----------------------------------------|
| React 18          | UI y hooks                             |
| Vite 6            | Build, dev server, alias, proxy        |
| react-router-dom 6| Rutas (createBrowserRouter)            |
| styled-components | Estilos por componente                 |
| Axios             | 3 instancias (3 APIs distintas)        |
| react-toastify    | Notificaciones                        |
| react-select      | Selects avanzados                     |
| xlsx                 | Exportación Excel                  |
| Bootstrap 5 (parcial) | Algunos estilos/componentes      |

---

## 2. Arquitectura general

### 2.1 Flujo de información (alto nivel)

```
index.jsx
  → App.jsx (AuthContextProvider → ThemeProvider → RouterProvider)
      → router (SimpleRouter)
          → Rutas públicas: /login, /recovery
          → Rutas protegidas: ProtectedWrapper(recurso, recursosAlternativos)
              → ProtectedContent
                  → Verifica isAuthenticated, user, hasAccessToResource
                  → Obtiene availableCompanies, availableLines (getAvailableCompanies/Lines)
                  → Calcula rolDelRecurso
                  → React.cloneElement(children, { routeConfig, availableCompanies, availableLines })
              → LayoutContent → TemplatePaginas (Sidebar + Header + children)
                  → Página concreta (Importaciones, CategoriasProductosTecnicentro, etc.)
```

### 2.2 Contextos globales

- **AuthContext:** `isAuthenticated`, `user`, `idSession`, `login`, `logout`, `fetchUserMe`, `fetchUserData`. Persistencia de sesión vía `localStorage` (token encriptado).
- **ThemeContext:** `theme`, `toggleTheme`. Tema en `localStorage`.
- **SidebarContext:** `isExpanded`, `setIsExpanded` (sidebar hover).
- **Permisos en rutas:** SimpleRouter inyecta `routeConfig`, `availableCompanies` y `availableLines` a cada página; la fuente de verdad es `user.CONTEXTOS` y `permissionsValidator.js`.

### 2.3 Datos del usuario (post login)

Tras login se llama a `/auth/me` (API Nueva). La respuesta se guarda en `user` con estructura tipo:

- `USUARIO`, `EMPRESAS`, `LINEAS`, `PERMISOS`, `ROLES`, `CONTEXTOS`
- `CONTEXTOS`: array de contextos (recurso, rol, alcance por empresas/líneas, bloqueados, herencia).
- Compatibilidad: `user.data` se mantiene como alias de `CONTEXTOS` en varios sitios.

---

## 3. Estructura de carpetas

```
PortalEmpresarial/
├── public/                 # Estáticos servidos tal cual
│   ├── ARCHIVO_BASE.xlsx
│   ├── favicon.ico, Logo.png, logo192/512.png, manifest.json, robots.txt, spin.png
│   └── heison.jpeg
├── src/
│   ├── App.jsx             # Punto de montaje: AuthContext, Theme, Router, ToastUI
│   ├── index.jsx           # ReactDOM.createRoot, Bootstrap/Toastify CSS
│   ├── index.css           # Estilos globales
│   │
│   ├── assets/             # Recursos estáticos de la app
│   │   ├── fonts/          # MuseoSansCyrl-500.woff
│   │   ├── images/         # svg (excel, person-circle, upload, wheel), webp_png_jpeg
│   │   └── styles/         # Loaders (CamionCSS, CamionLoader), StyledComponents (ContenedorPadre)
│   │
│   ├── components/
│   │   ├── common/         # FormComponents.jsx (formularios reutilizables)
│   │   ├── layout/         # Header, Sidebar, TemplatePaginas
│   │   └── UI/Components/  # Botones, Cards, Inputs, Modales, Tablas, Select, Export Excel, etc.
│   │
│   ├── config/
│   │   ├── axiosConfig.js       # 3 instancias Axios + interceptores + id-session / X-Portal-API-Key
│   │   ├── constants.js         # globalConst (alturas header/menu)
│   │   └── env.js               # Variables de entorno (API_URL, API_URL_NEW, APP_SHELL_API_KEY, etc.)
│   │
│   ├── context/
│   │   ├── authContext.jsx
│   │   ├── SidebarContext.jsx
│   │   └── ThemeContext.jsx
│   │
│   ├── pages/
│   │   ├── auth/                # NewInicioSesion, PasswordRecovery
│   │   ├── home/                # Portal.jsx
│   │   ├── NotFound.jsx
│   │   └── Areas/               # Por dominio de negocio
│   │       ├── AdministracionUsu/
│   │       ├── Cartera/
│   │       ├── Compras/
│   │       ├── Contabilidad/
│   │       ├── Gobierno de Datos/
│   │       ├── Marketing/
│   │       ├── Reporteria/
│   │       ├── RRHH/
│   │       ├── Tecnicentro/
│   │       └── ...
│   │
│   ├── router/
│   │   └── SimpleRouter.jsx     # APP_CONFIG, createBrowserRouter, ProtectedContent, getSidebarItems
│   │
│   ├── services/                # Capa de llamadas HTTP por dominio
│   │   ├── administracionService.js
│   │   ├── authService.js
│   │   ├── carteraService.js
│   │   ├── cartera/             # cargarTransferencias, ejecutarbancos
│   │   ├── carteraDesbloqueoClientesService.js
│   │   ├── contabilidadService.js
│   │   ├── creditosService.js
│   │   ├── importacionesService.js
│   │   ├── marketingService.js
│   │   ├── appShell_Service.js
│   │   ├── recoveryService.js
│   │   ├── transaccionesService.js
│   │   └── usuariosService.js
│   │
│   └── utils/
│       ├── colors.js
│       ├── encryption.js        # encrypt/decrypt + VITE_ENCRYPTION_KEY
│       ├── functionsPermissions.js
│       ├── permisosArbol.js
│       ├── permissionsValidator.js  # hasAccessToResource, getAvailableCompanies, getAvailableLines
│       ├── theme.js             # lightTheme, darkTheme
│       └── Utils.js             # transformarDataAValueLabel, obtenerAniosDesde2020
│
├── .env.development / .env.production
├── app.config.json              # Config PM2/serve (frontend)
├── index.html
├── jsconfig.json
├── package.json
├── tailwind.config.js
└── vite.config.js               # Alias, proxy /apid1, /apid2, build outDir: build
```

---

## 4. Módulos principales y responsabilidades

### 4.1 Router y protección (`SimpleRouter.jsx`)

- **APP_CONFIG:** Array de objetos `{ path?, title, icon, component, recurso, recursosAlternativos? }`. Path se deriva de `recurso` (puntos → barras) si no se indica.
- **ProtectedContent:** Usa `user.CONTEXTOS`, `hasAccessToResource`, `getAvailableCompanies`, `getAvailableLines`; construye `routeConfig` (recurso, recursosAlternativos, rolDelRecurso, availableCompanies, availableLines) y lo inyecta al hijo.
- **getSidebarItems(userContexts):** Filtra por recurso (y alternativos), agrupa por raíz y construye jerarquía anidada (construirJerarquia) para el sidebar.
- **Rutas generadas:** `generateRoutes()` mapea APP_CONFIG a rutas; cada ruta protegida usa `ProtectedWrapper` y pasa `routeConfig` al componente.

### 4.2 Layout (`TemplatePaginas`, `Sidebar`, `Header`)

- **TemplatePaginas:** Sidebar + Header + área de contenido; animación fade-in; sin NavBar (eliminado en versión actual).
- **Sidebar:** Items desde `getSidebarItems(userContexts)`; expandible por hover; niveles con margen/ancho; Separador entre items; Toggle tema y Cerrar sesión abajo.
- **Header:** Cabecera de la aplicación (sin breadcrumb en TemplatePaginas actual).

### 4.3 Páginas por área (resumen)

| Área            | Páginas / Componentes principales |
|-----------------|-----------------------------------|
| Administración  | EleccionAccion → GestionUsuarios, MantenimientoPermisos, MantenimientoPermisosNuevos, TiposUsuario, UsuariosAppShell, CrearModulo, Correos, Bancos |
| Cartera         | CargarTransferencias, RegistrosBancarios, RegistrosBancariosHistorial, GestionCheques, DesbloqueoClientes |
| Compras         | Reportes, Importaciones (filtros, tabla, ventana edición, creación), Creditos, Anticipos |
| Contabilidad    | ConversionArchivosBancos, ReporteFlujoCaja, Comisiones (Mayoristas, Tecnicentro reportes/categorías, Lubricantes) |
| Marketing       | ConsultaMarketing, ComercialMarketing, FacturacionMarketing, Marketing.5w2h |
| Reportería      | TemplateReporteria; reportes por tipo (Comercial, Flash de Ventas, Importaciones, Coordenadas, Cobranzas, Tecnicentro, etc.) |
| RRHH            | Documentacion |
| Gobierno de Datos | Maestros (GeneralMaestros) |

### 4.4 Componentes UI destacados

- **TablaInputsUI:** Tabla editable con filtros, ordenación, permisos por empresa (E/C), guardado por fila.
- **TablaInfoUI:** Tabla de solo lectura/info.
- **SelectUI, InputUI, ButtonUI, ModalUI, ModalConfirmacionUI, ExportarAExcelUI:** Uso transversal.
- **LoaderUI, ToastUI, ToggleThemeButtonUI, IconUI (IconsUI):** Soporte general.

### 4.5 Utilidades críticas

- **permissionsValidator.js:** `hasAccessToResource`, `getAvailableCompanies`, `getAvailableLines` (recursos con puntos, bloqueos, herencia).
- **encryption.js:** Encriptación/desencriptación del token de sesión; clave desde `VITE_ENCRYPTION_KEY`.
- **Utils.js:** `transformarDataAValueLabel`, `obtenerAniosDesde2020` (usados en muchos módulos).

---

## 5. Integración con APIs externas

El proyecto consume **3 APIs** mediante **3 instancias de Axios** definidas en `config/axiosConfig.js`; las URLs se leen de `config/env.js`.

---

### API 1 — API principal (Backend legacy / multipropósito)

- **Nombre / propósito:** Backend principal para cartera, compras, contabilidad, administración (módulos/roles/usuarios), importaciones, recovery, créditos, etc.
- **Variable de entorno:** `VITE_API_URL` (en `env.js` como `API_URL`).
- **Instancia Axios:** `axiosInstance` (timeout 300000 ms).
- **Integración:** Directa por servicios; sin middleware adicional.

**Servicios que la usan:**

- `contabilidadService.js` (bancos, flujo caja, comisiones Tecnicentro/Mayoristas, categorías/subcategorías, productos).
- `carteraService.js` (empresas cartera, cheques, vendedores, bancos; también usa API 2 para transacciones).
- `importacionesService.js` (empresas, proveedores, marcas, clientes, navieras, transportistas, aduanero, CRUD importaciones, documentos, bodega, nacionalización, factura proveedor, carga BAT, etc.).
- `administracionService.js` (parte: modulo, rol, usuario, empresas) — también usa API 2 para permisos/roles/usuarios-rol-contexto.
- `usuariosService.js` (usuario, actualizar contraseña, por correo; tipo usuario usa API 2).
- `recoveryService.js` (recovery/token, recovery/obtenertoken).
- `creditosService.js` (creditos/creditosproveedores).
- `transaccionesService.js` (transaccion/actualizar/banco, fecha).
- `cartera/cargarTransferencias.js` (solo para algunas rutas si aplica; principalmente usa API 2 para subir archivos).

**Endpoints representativos (no exhaustivos):**

- GET/POST `/bancos`, `/empresas`, `/usuario/`, `/modulo/`, `/rol/`, `/recovery/*`, `/cheques/*`, `/vendedor/*`, `/importaciones/*`, `/producto/categoria/subCategoria/`, `/promocion/*`, `/creditos/creditosproveedores/`, `/transaccion/actualizar/banco`.
- POST `/recovery/token/:correo`, GET `/recovery/obtenertoken/:correo`.

**Datos típicos:** JSON; formularios multipart en importaciones (documentos). Respuestas suelen traer `data` o estructura similar.

**Riesgos / dependencias:** API muy amplia; parte administración tiene código comentado o rutas no usadas en el router actual. Recovery usa esta API; auth login/me usa API 2.

---

### API 2 — API nueva (Auth, sesión, permisos, transacciones, 5W2H, cartera moderna)

- **Nombre / propósito:** Backend de autenticación, usuario actual, permisos/roles/contextos, transacciones bancarias, 5W2H Marketing, cartera (desbloqueo, carga archivos transferencias), BAT bancos.
- **Variable de entorno:** `VITE_API_URL_NEW` (en `env.js` como `API_URL_NEW`).
- **Instancia Axios:** `axiosInstanceNew` (timeout 300000 ms).
- **Cabecera:** `id-session` (se establece tras login con `setAxiosIdSession`; se elimina en logout con `removeAxiosIdSession`).

**Servicios que la usan:**

- `authService.js`: POST `/auth/login`, GET `/auth/me`, POST `/reset-password/request`, `/reset-password/verify-otp`, `/reset-password/resPss`.
- `marketingService.js`: GET/POST/PUT/PATCH/DELETE `/5w2h/cabecera`, `/5w2h/detalle/*`.
- `carteraService.js`: GET transacciones, PATCH `/transacciones/:id`, PATCH transacciones batch.
- `cartera/ejecutarbancos.js`: POST `/cartera/bash/bancos/`.
- `cartera/cargarTransferencias.js`: POST para Bolivariano y Pichincha (carga archivos).
- `carteraDesbloqueoClientesService.js`: GET/POST `/cartera/desbloqueo`.
- `administracionService.js`: POST `/usuarios/`, GET/POST/PUT/DELETE `/permisos`, `/roles`, `/permisos-rol`, `/usuarios-rol-contexto`.
- `usuariosService.js`: GET/POST/PUT/DELETE `/usuarios/tipoUsuario/`, y otros endpoints de usuarios nuevos.

**Endpoints representativos:**

- Auth: `/auth/login`, `/auth/me`, `/reset-password/*`.
- 5W2H: `/5w2h/cabecera`, `/5w2h/detalle`, `/5w2h/detalle/cabecera/:id`.
- Cartera: `/transacciones`, `/transacciones/:id`, `/cartera/bash/bancos/`, `/cartera/desbloqueo`, uploads de archivos transferencias.
- Administración: `/usuarios/`, `/permisos`, `/roles`, `/permisos-rol`, `/usuarios-rol-contexto`.
- Usuarios: `/usuarios/tipoUsuario/`, etc.

**Datos:** Login envía `correo`, `contrasena`; respuesta incluye `idSession`. `/auth/me` devuelve usuario con CONTEXTOS, EMPRESAS, LINEAS, ROLES, etc.

**Riesgos / dependencias:** Toda la sesión actual depende de esta API (login y /auth/me). Si `id-session` no se envía o expira, las llamadas fallan; el interceptor no renueva token automáticamente.

---

### API 3 — App Shell

- **Nombre / propósito:** Gestión de usuarios/vendedores del app shell.
- **Variable de entorno:** `VITE_API_URL_APP_SHELL` (en `env.js` como `API_URL_APP_SHELL`).
- **Instancia Axios:** `axiosInstanceAppShell` (timeout 300000 ms).
- **Cabecera:** `X-Portal-API-Key` con valor de `VITE_API_KEY_APP_SHELL` (en `env.js` como `APP_SHELL_API_KEY`; configurado en `axiosConfig.js`).

**Servicios que la usan:**

- `appShell_Service.js`:
  - GET `/usuarios/` → listar usuarios.
  - POST `/usuarios/` → crear vendedor (name, lastname, card_id, email, phone, roleId, birth_date).

**Datos:** Entrada/salida JSON. Si `VITE_API_KEY_APP_SHELL` no está definida en el .env, el backend puede responder "API KEY requerida".

**Riesgos / dependencias:** Dependencia de la variable `VITE_API_KEY_APP_SHELL`; sin ella la integración falla.

---

### Resumen de uso por instancia

| Instancia                      | Env URL                         | Env Key (si aplica)   | Uso principal                          |
|--------------------------------|----------------------------------|------------------------|----------------------------------------|
| axiosInstance                  | VITE_API_URL                     | —                      | Cartera, Compras, Contabilidad, Admin, Importaciones, Recovery, Créditos, Transacciones |
| axiosInstanceNew               | VITE_API_URL_NEW                 | id-session (header)    | Auth, 5W2H, Transacciones cartera, Desbloqueo, BAT, Administración (permisos/roles/URC), Usuarios nuevos |
| axiosInstanceAppShell         | VITE_API_URL_APP_SHELL          | VITE_API_KEY_APP_SHELL       | App Shell (usuarios/vendedores) |

---

## 6. Manejo de estados, lógica de negocio y flujos críticos

### 6.1 Autenticación y sesión

1. Usuario envía correo/contraseña → `authService_login` (API 2) → respuesta con `idSession`.
2. `idSession` se encripta con `encryption.encrypt` y se guarda en `localStorage` bajo clave fija.
3. `setAxiosIdSession(idSession)` configura cabecera `id-session` en `axiosInstanceNew`.
4. Se llama a `fetchUserMe()` → GET `/auth/me` → se guarda en `user` (CONTEXTOS, EMPRESAS, LINEAS, etc.).
5. En carga de app, `authContext` lee token encriptado del `localStorage`, desencripta, setea id-session y llama a `/auth/me`; si falla, limpia sesión.

### 6.2 Autorización por recurso

- **Cálculo de acceso:** `hasAccessToResource(userContexts, recurso)` compara recurso solicitado con cada `context.RECURSO` (exacto o prefijo con herencia); respeta `BLOQUEADO` / `RECURSOS_BLOQUEADOS`.
- **Empresas/líneas:** `getAvailableCompanies(userContexts, recurso, user.EMPRESAS)` y `getAvailableLines(..., user.LINEAS)` agregan empresas/líneas de los contextos que tienen acceso al recurso (alcance por contexto).
- **Rol por recurso:** `rolDelRecurso` se obtiene en SimpleRouter buscando en user.CONTEXTOS y user.ROLES el rol del recurso (o alternativos) y se incluye en `routeConfig`.

### 6.3 Flujos de negocio relevantes

- **Importaciones:** Filtros → ListarImportaciones → tabla; edición/creación con ventanas modales y múltiples servicios (consulta, updateGeneral, transaccion, bodega, nacionalizacion, etc.). Roles (ventas, bodega, jefatura) definen columnas y permisos en vista.
- **Registros Bancarios (Cartera):** Filtros por empresa/fechas → transacciones (API 2); permisos por recurso; alternativas contabilidad.registrosbancarios.
- **Marketing 5W2H:** Cabeceras y detalles (API 2); agrupación por CABECERA_ID; permisos de edición por rol "jefatura".
- **Comisiones Tecnicentro:** Reportes y Categorías de productos; categorías usa API 1 (ObtenerProductosTecnicentro, UpdateCategoriasSubcategoriasTecnicentro); permisos de edición por rol "jefatura" y empresas con AUTOLLANTA.
- **Reportería:** TemplateReporteria recibe reportes por tipo/módulo/empresa; selects en cascada (rol → recurso → empresa); iframe o contenido según reporte seleccionado.

### 6.4 Permisos en tabla (TablaInputsUI)

- Prop `permisos`: array de `{ empresa, permiso: "E"|"C" }`.
- Doble clic: si `permisos` tiene entrada para `item.EMPRESA` con `permiso === "E"` se activa edición; si es "C" solo consulta o flujo alternativo.
- Varias páginas construyen este array desde `availableCompanies` + `routeConfig.rolDelRecurso` (ej. jefatura → "E", resto → "C").

---

## 7. Configuraciones importantes

### 7.1 Variables de entorno (Vite)

Todas las variables se definen en `.env.development` y `.env.production` y se leen de forma centralizada en `src/config/env.js` (exportes: `API_URL`, `API_URL_NEW`, `API_URL_APP_SHELL`, `APP_SHELL_API_KEY`, `ENCRYPTION_KEY`, `MODE`, `FRONT_DEV`, `ENV_NAME`).

| Variable en .env              | Uso |
|-----------------------------|-----|
| VITE_API_URL                | Base URL API principal (env.js: `API_URL`). |
| VITE_API_URL_NEW            | Base URL API nueva (env.js: `API_URL_NEW`). |
| VITE_API_URL_APP_SHELL       | Base URL App Shell (env.js: `API_URL_APP_SHELL`). |
| VITE_API_KEY_APP_SHELL       | API Key para App Shell, cabecera X-Portal-API-Key (env.js: `APP_SHELL_API_KEY`). |
| VITE_ENCRYPTION_KEY          | Clave para encriptar/desencriptar id-session en localStorage (env.js: `ENCRYPTION_KEY`). |
| VITE_FRONT_DEV               | URL del frontend, ej. iframes o links (env.js: `FRONT_DEV`). |
| VITE_ENV                     | development \| production (env.js: `ENV_NAME`). |

### 7.2 Vite (vite.config.js)

- **Alias:** assets, components, config, context, pages, router, services, utils.
- **Proxy (dev):** `/apid1` → localhost:3002, `/apid2` → localhost:3004 (rewrite quitando prefijo).
- **Server:** host 192.168.0.68, port 5000, strictPort.
- **Build:** outDir `build`.

### 7.3 Scripts (package.json)

- `dev`: Vite dev.
- `pm2Dev`: PM2 con nombre portalEmpresarial (run dev + log).
- `build`: NODE_OPTIONS max-old-space-size 4096, VITE_ENV=production, vite build --mode production.
- `postbuild`: Copia `build/*` a `/var/www/html/portalEmpresarial/`, nginx -t y reload (entorno Linux).
- `preview`: vite preview port 7150 host 192.168.0.2.

### 7.4 Otras configuraciones

- **constants.js:** `globalConst` (alturas header/menu). **env.js:** variables de entorno; `APP_SHELL_API_KEY` para cabecera X-Portal-API-Key.

---

## 8. Código legado y decisiones históricas

### 8.1 Rutas y menú

- **Fuente de verdad:** `APP_CONFIG` en SimpleRouter.jsx (recurso, path derivado por `recursoToPath`). La navegación programática (botones "Volver", links a inicio o recovery) usa rutas directas (ej. `/`, `/recovery`, `/contabilidad/comisiones/tecnicentro`).

### 8.2 Decisiones históricas

- **Permisos por recurso:** La única fuente de verdad es CONTEXTOS desde `/auth/me`, `permissionsValidator.js` (hasAccessToResource, getAvailableCompanies/Lines) y `routeConfig` inyectado por SimpleRouter a cada página.
- **Tres APIs:** Separación por responsabilidades (legacy vs auth/permisos/transacciones vs app shell); no un único BFF.
- **Administración temporal:** En SimpleRouter, recurso `"administracion"` tiene acceso forzado (setPermissionState(true)) con comentario TODO para quitar cuando estén configurados permisos.
- **Rutas alternativas:** Ej. `cartera.registrosbancarios` y `contabilidad.registrosbancarios` permiten acceder al mismo componente.
- **Encriptación de sesión:** XOR + base64 en utils/encryption; clave por env. No es un estándar JWT; permite persistencia sin exponer el token en claro en localStorage.

---

## 9. Puntos de mejora futura (sin implementar)

- **Manejo de errores de API:** Interceptores actuales reintentan por timeout/red; no hay flujo estándar para 401 (renovar sesión o redirigir a login). Valorar interceptor en axiosInstanceNew para 401 y logout + redirect.
- **Tipado:** Introducir TypeScript o al menos JSDoc en servicios y utils para contratos de API y reducción de errores.
- **Tests:** No hay tests automatizados visibles; priorizar auth, permissionsValidator y flujos críticos (login, permisos por recurso).
- **App Shell:** Si `VITE_API_KEY_APP_SHELL` no está definida en el .env, considerar no montar rutas que dependan de esa API o mostrar mensaje claro en UI.
- **Accesibilidad y rendimiento:** Revisar tabla grande (TablaInputsUI, Importaciones) para virtualización o paginación si hay muchos registros.

---

## 10. Resumen ejecutivo para onboarding de un nuevo desarrollador

### Qué es el proyecto

Portal web interno que centraliza acceso a Cartera, Compras (Importaciones, Créditos, Anticipos), Contabilidad (Comisiones, Flujo de Caja, Conversión), Marketing (5W2H, Inventario, Comercial), Reportería (varios reportes), RRHH, Gobierno de Datos y Administración. La autenticación y la autorización por recurso (y por empresa/línea) son el núcleo del diseño.

### Cómo empezar

1. Clonar repo, `npm install`, configurar `.env.development` / `.env.production` con las variables de la sección 7.1 (URLs de API, `VITE_API_KEY_APP_SHELL`, `VITE_ENCRYPTION_KEY`, etc.). Todas se consumen desde `src/config/env.js`.
2. `npm run dev` (puerto 5000; host en vite.config).
3. Entrar por `/login`; el resto de rutas están protegidas por recurso.

### Dónde está cada cosa

- **Rutas y menú:** `src/router/SimpleRouter.jsx` (APP_CONFIG, ProtectedContent, getSidebarItems).
- **Sesión y usuario:** `src/context/authContext.jsx` y `src/services/authService.js` (API 2).
- **Permisos por recurso:** `src/utils/permissionsValidator.js`; se usan en SimpleRouter y en páginas que reciben `routeConfig`.
- **Llamadas HTTP:** `src/services/*`; 3 instancias en `src/config/axiosConfig.js`; variables de entorno en `src/config/env.js`.
- **Layout:** `src/components/layout/TemplatePaginas.jsx`, `Sidebar.jsx`, `Header.jsx`.
- **Páginas:** `src/pages/Areas/` por dominio; cada página recibe `routeConfig`, `availableCompanies`, `availableLines` vía props (inyectadas por SimpleRouter).

### Las 3 APIs

1. **VITE_API_URL** → Cartera, Compras, Contabilidad, Importaciones, Administración (parte), Recovery, Créditos, Transacciones (actualizar banco).
2. **VITE_API_URL_NEW** → Login, /auth/me, 5W2H, Transacciones cartera, Desbloqueo, BAT bancos, Permisos/Roles/Usuarios-rol-contexto, Tipos de usuario.
3. **VITE_API_URL_APP_SHELL** → Usuarios/vendedores app shell (cabecera `X-Portal-API-Key` con `VITE_API_KEY_APP_SHELL`; en código se usa `APP_SHELL_API_KEY` desde `env.js`).

### Flujo típico al añadir una pantalla

1. Añadir entrada en `APP_CONFIG` en SimpleRouter (path opcional, title, icon, component, recurso, recursosAlternativos si aplica).
2. El componente de página debe esperar `routeConfig`, `availableCompanies`, `availableLines` y opcionalmente usar `routeConfig.rolDelRecurso` y `routeConfig.availableCompanies` para permisos y datos.
3. Si se consumen APIs, reutilizar la instancia Axios adecuada desde `config/axiosConfig.js` y, si hace falta, crear o ampliar un servicio en `services/`.

### Contacto / autor

Desarrollador principal: **Diego Barbecho** (GitHub: [diegobarpdev](https://github.com/diegobarpdev)). Para decisiones de negocio y permisos en backend, coordinar con el equipo que mantiene las 3 APIs.

---

*Documento generado a partir del análisis del repositorio. Última revisión sugerida ante cambios en rutas, APIs o permisos.*
