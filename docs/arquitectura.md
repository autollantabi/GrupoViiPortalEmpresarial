# Arquitectura del sistema

Este documento describe la arquitectura general del Portal Empresarial, las carpetas principales, la separación de responsabilidades y los patrones de diseño utilizados.

---

## 1. Arquitectura general

El proyecto es una **Single Page Application (SPA)** de frontend que consume **dos APIs HTTP** distintas. No incluye backend propio; toda la lógica de negocio persistente y autenticación reside en servicios externos.

### 1.1 Flujo de alto nivel

```
index.jsx
  → ReactDOM.createRoot, Bootstrap/Toastify CSS
  → App.jsx
      → AuthContextProvider
      → ThemeProvider
      → RouterProvider (router desde SimpleRouter)
          → Rutas públicas: /login, /recovery
          → Ruta raíz "/": Portal (solo autenticación)
          → Rutas protegidas: ProtectedWrapper(recurso, recursosAlternativos)
              → ProtectedContent
                  → Verifica isAuthenticated, user, hasAccessToResource
                  → Obtiene availableCompanies, availableLines (getAvailableCompanies/Lines)
                  → Calcula rolDelRecurso
                  → React.cloneElement(children, { routeConfig, availableCompanies, availableLines })
              → LayoutContent → TemplatePaginas (Sidebar + Header + children)
                  → Página concreta (Importaciones, GestionCanjes, Reportería, etc.)
```

### 1.2 Capas principales

| Capa            | Ubicación principal      | Responsabilidad |
|-----------------|--------------------------|------------------|
| Entrada         | `index.jsx`, `App.jsx`   | Montaje de React, proveedores globales (Auth, Theme), router, Toast |
| Enrutado        | `router/SimpleRouter.jsx`, `router/Routes.js` | Definición de rutas, protección por recurso, generación del sidebar |
| Layout          | `components/layout/`    | TemplatePaginas, Sidebar, Header |
| Páginas         | `pages/`                 | Pantallas por área (auth, home, Areas/*) |
| Componentes UI  | `components/UI/Components/` | Componentes reutilizables (botones, tablas, modales, selects, etc.) |
| Servicios       | `services/`              | Llamadas HTTP a las dos APIs |
| Configuración   | `config/`                | env, axios (2 instancias), constantes |
| Contexto        | `context/`               | Auth, Theme, Sidebar |
| Utilidades      | `utils/`                 | Permisos, encriptación, temas, colores, helpers |

---

## 2. Descripción de carpetas principales

### 2.1 Raíz del proyecto

| Elemento           | Descripción |
|--------------------|-------------|
| `package.json`    | Dependencias, scripts (dev, build, preview, pm2Dev, postbuild). |
| `vite.config.js`  | Plugins (React), server (host, port, proxy), resolve (alias), build (outDir: `build`). |
| `index.html`      | Punto de entrada HTML; script tipo módulo para el bundle. |
| `app.config.json` | Configuración para PM2/serve (frontend). |
| `jsconfig.json`   | Configuración de JavaScript (paths/alias para el IDE). |
| `tailwind.config.js` | Configuración de Tailwind (incluye referencia a Material Tailwind; ver [pendientes.md](pendientes.md)). |
| `public/`         | Archivos estáticos servidos tal cual (favicon, logos, manifest, robots.txt, ARCHIVO_BASE.xlsx, etc.). |
| `.env.development` / `.env.production` | Variables de entorno (no versionados; ver [setup.md](setup.md)). |

### 2.2 src/

| Carpeta/archivo   | Descripción |
|-------------------|-------------|
| `App.jsx`         | Envuelve la app en AuthContextProvider, ThemeProvider, RouterProvider y ToastUI. |
| `index.jsx`       | createRoot, importación de estilos globales (index.css, Bootstrap, Toastify), render de App. |
| `index.css`       | Estilos globales. |
| `config/`         | env.js (variables VITE_*), axiosConfig.js (2 instancias Axios + interceptores + id-session), constants.js (globalConst para alturas header/menu). |
| `context/`        | authContext.jsx (sesión, user, login, logout, fetchUserMe), ThemeContext.jsx (tema claro/oscuro), SidebarContext.jsx (estado expandido del sidebar). |
| `router/`         | SimpleRouter.jsx (createBrowserRouter, getRoutesConfig, getSidebarItems, ProtectedContent, inyección de routeConfig), Routes.js (RoutesConfig: lista de rutas con path, title, icon, component, recurso, recursosAlternativos, public, rootOnly). |
| `pages/`          | auth (LoginPage, PasswordRecovery), home (Portal), NotFound; Areas (Administracion, AppShell, Cartera, Compras, Contabilidad, Marketing, Reporteria, RRHH, etc.). |
| `components/layout/` | TemplatePaginas (Sidebar + Header + área de contenido), Sidebar.jsx (items desde getSidebarItems), Header.jsx. |
| `components/common/` | FormComponents.jsx (formularios reutilizables). |
| `components/UI/Components/` | ButtonUI, CardUI, SelectUI, InputUI, ModalUI, ModalConfirmacionUI, TablaInfoUI, TablaInputsUI, ExportarAExcelUI, TooltipUI, LoaderUI, ToastUI, ToggleThemeButtonUI, IconsUI, etc. |
| `services/`       | authService, administracionService, appShell_Service, carteraService, carteraDesbloqueoClientesService, contabilidadService, creditosService, importacionesService, marketingService, recoveryService, transaccionesService, usuariosService; cartera/cargarTransferencias.js, cartera/ejecutarbancos.js. |
| `utils/`           | permissionsValidator.js (hasAccessToResource, getAvailableCompanies, getAvailableLines), encryption.js (encrypt/decrypt para id-session), theme.js (lightTheme, darkTheme), colors.js, Utils.js (transformarDataAValueLabel, obtenerAniosDesde2020). |
| `assets/`         | fonts, images (svg, webp_png_jpeg), styles (Loaders, StyledComponents). |

### 2.3 Áreas bajo pages/Areas

Cada área agrupa uno o más módulos/pantallas, alineados con el recurso en Routes.js:

- **Administracion:** EleccionAccion, GestionUsuarios, MantenimientoPermisos, MantenimientoPermisosNuevos, UsuariosAppShell, etc.
- **AppShell:** AS_GestionCanjes (gestión de canjes con historial de estados), AS_UsuariosApp (lista de usuarios del club shell con filtro por texto y por rol; asociaciones Manager/Vendedor/Influenciador en chips), AS_HabShellForm (habilitar o quitar permiso de formulario mayorista en App Shell por usuario, vía portal-mayorista).
- **Cartera:** CargarTransferencias, RegistrosBancarios, RegistrosBancariosHistorial, DesbloqueoClientes, GestionCheques.
- **Compras:** Reportes, Importaciones (Filtros, Tabla, VentanaEdicion), Creditos, Anticipos.
- **Contabilidad:** ConversionArchivosBancos, FlujoDeCaja, Comisiones (Mayoristas, Tecnicentro, Lubricantes).
- **Marketing:** MK_ReporteInventario, ComercialMarketing, FacturacionMarketing, Marketing.5w2h.
- **Reporteria:** TemplateReporteria y reportes por tipo (Comercial, Cobranzas, Tecnicentro, Coordenadas, Importaciones, etc.).
- **RRHH:** Documentacion, Videos.

---

## 3. Separación de responsabilidades

### 3.1 Router y protección

- **Routes.js:** Fuente de verdad de la lista de rutas (path, title, icon, component, recurso, recursosAlternativos, public, rootOnly). No contiene lógica de permisos.
- **SimpleRouter.jsx:** Genera el router de react-router-dom; para cada ruta protegida usa ProtectedContent que:
  - Verifica autenticación y acceso al recurso (y recursos alternativos) con `hasAccessToResource`.
  - Obtiene empresas y líneas disponibles con `getAvailableCompanies` y `getAvailableLines`.
  - Calcula `rolDelRecurso` a partir de user.CONTEXTOS y user.ROLES.
  - Inyecta en el hijo: `routeConfig` (recurso, recursosAlternativos, rolDelRecurso, availableCompanies, availableLines), `availableCompanies`, `availableLines`.
- **getSidebarItems(userContexts):** Filtra rutas por recurso (y alternativos), agrupa por raíz y construye jerarquía anidada para el sidebar.

### 3.2 Autenticación y sesión

- **authContext.jsx:** Mantiene estado global (isAuthenticated, user, idSession, isLoading). Expone login, logout, fetchUserMe, fetchUserData. Persiste id-session encriptado en localStorage.
- **authService.js:** Llama a la API nueva (login, /auth/me, recuperación de contraseña). No decide redirecciones; eso lo hace el contexto o el router.
- **axiosConfig.js:** Tras el login, setAxiosIdSession(idSession) configura la cabecera `id-session` en axiosInstanceNew; removeAxiosIdSession la elimina en logout.

### 3.3 Permisos

- **permissionsValidator.js:** Lógica pura de permisos: hasAccessToResource (notación de puntos, herencia, recursos bloqueados), getAvailableCompanies, getAvailableLines. No conoce React ni el router.
- **SimpleRouter (ProtectedContent):** Usa permissionsValidator y user.CONTEXTOS para decidir si mostrar la ruta y qué empresas/líneas inyectar.

### 3.4 Servicios HTTP

- Cada servicio en `services/` usa una de las dos instancias de Axios (axiosInstance, axiosInstanceNew) según la API que corresponda.
- Los servicios devuelven objetos normalizados (p. ej. { success, data, message }) y capturan errores; no manejan redirecciones ni toasts de forma centralizada (cada página puede hacerlo).

### 3.5 Páginas

- Reciben por props `routeConfig`, `availableCompanies`, `availableLines` (inyectadas por SimpleRouter).
- Usan servicios para cargar y guardar datos; pueden usar `routeConfig.rolDelRecurso` y empresas/líneas para filtros y permisos de edición (p. ej. TablaInputsUI con permisos E/C por empresa).

---

## 4. Patrones de diseño utilizados

| Patrón / práctica        | Dónde se aplica |
|--------------------------|------------------|
| **Provider (Context)**   | AuthContext, ThemeProvider, SidebarProvider envuelven la aplicación o parte del árbol. |
| **Configuración centralizada** | Routes.js como única fuente de rutas; env.js para variables de entorno; axiosConfig para instancias HTTP. |
| **Composición**           | TemplatePaginas compone Sidebar + Header + children; las páginas componen componentes UI y layout. |
| **Inyección de props**   | ProtectedContent inyecta routeConfig, availableCompanies, availableLines al hijo mediante cloneElement. |
| **Servicios por dominio**| services/ organizado por dominio (auth, cartera, appShell, importaciones, etc.) en lugar de un único cliente. |
| **Múltiples instancias de cliente HTTP** | Dos Axios con bases y cabeceras distintas (API principal, API nueva con id-session). |
| **Rutas protegidas**      | Wrapper que verifica autenticación y recurso antes de renderizar el contenido; en caso contrario redirección o mensaje. |
| **Sidebar dinámico**      | Menú generado a partir de RoutesConfig y permisos (getSidebarItems), sin hardcodear ítems por rol. |

No se identifica en el código un uso explícito de patrones como Repository, Redux ni otros state managers globales más allá de los contextos ya citados.

---

## 5. Estructura de carpetas (árbol)

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
│   ├── assets/             # Recursos estáticos de la app
│   │   ├── fonts/          # MuseoSansCyrl-500.woff
│   │   ├── images/         # svg, webp_png_jpeg
│   │   └── styles/         # Loaders, StyledComponents (ContenedorPadre)
│   ├── components/
│   │   ├── common/         # FormComponents.jsx
│   │   ├── layout/         # Header, Sidebar, TemplatePaginas
│   │   └── UI/Components/  # ButtonUI, CardUI, SelectUI, ModalUI, TablaInfoUI, TooltipUI, etc.
│   ├── config/             # axiosConfig.js, constants.js, env.js
│   ├── context/            # authContext, SidebarContext, ThemeContext
│   ├── pages/              # auth/, home/, NotFound, Areas/ (Administracion, AppShell, Cartera, ...)
│   ├── router/             # SimpleRouter.jsx, Routes.js
│   ├── services/           # authService, appShell_Service, carteraService, importacionesService, etc.
│   └── utils/              # colors, encryption, permissionsValidator, theme, Utils
├── docs/                   # Documentación técnica segmentada
├── .env.development / .env.production
├── app.config.json, index.html, jsconfig.json, package.json, tailwind.config.js, vite.config.js
```

---

## 6. Módulos principales y responsabilidades

### 6.1 Router y protección (`SimpleRouter.jsx`, `Routes.js`)

- **Routes.js (RoutesConfig):** Fuente de verdad de rutas: `{ path?, title, icon, component, recurso, recursosAlternativos?, public?, rootOnly? }`. Path se deriva de `recurso` (puntos → barras) si no se indica.
- **ProtectedContent:** Usa `user.CONTEXTOS`, `hasAccessToResource`, `getAvailableCompanies`, `getAvailableLines`; construye `routeConfig` e inyecta al hijo.
- **getSidebarItems(userContexts):** Filtra por recurso (y alternativos), agrupa por raíz y construye jerarquía anidada para el sidebar.

### 6.2 Layout

- **TemplatePaginas:** Sidebar + Header + área de contenido; animación fade-in.
- **Sidebar:** Items desde `getSidebarItems`; expandible por hover; Toggle tema y Cerrar sesión abajo.
- **Header:** Cabecera de la aplicación.

### 6.3 Páginas por área

| Área           | Componentes principales |
|----------------|-------------------------|
| Administración | EleccionAccion, GestionUsuarios, MantenimientoPermisos, MantenimientoPermisosNuevos, UsuariosAppShell |
| AppShell       | AS_GestionCanjes (canjes), AS_UsuariosApp (usuarios club shell: lista, filtro global y por rol, orden por fecha de creación) |
| Cartera        | CargarTransferencias, RegistrosBancarios, RegistrosBancariosHistorial, DesbloqueoClientes, GestionCheques |
| Compras        | Reportes, Importaciones (filtros, tabla, ventana edición), Creditos, Anticipos |
| Contabilidad   | ConversionArchivosBancos, ReporteFlujoCaja, Comisiones (Mayoristas, Tecnicentro, Lubricantes) |
| Marketing      | MK_ReporteInventario, ComercialMarketing, FacturacionMarketing, Marketing.5w2h |
| Reportería     | TemplateReporteria; reportes por tipo (Comercial, Cobranzas, Tecnicentro, Coordenadas, etc.) |
| RRHH           | Documentacion, Videos |

### 6.4 Componentes UI y utilidades

- **TablaInputsUI, TablaInfoUI:** Tablas con filtros, permisos por empresa (E/C).
- **SelectUI, InputUI, ButtonUI, ModalUI, ModalConfirmacionUI, ExportarAExcelUI, TooltipUI, LoaderUI, ToastUI, IconsUI.**
- **permissionsValidator.js:** `hasAccessToResource`, `getAvailableCompanies`, `getAvailableLines`.
- **encryption.js:** Encriptación/desencriptación del token de sesión (`VITE_ENCRYPTION_KEY`).
- **Utils.js:** `transformarDataAValueLabel`, `obtenerAniosDesde2020`.

---

## 7. Integración con las dos APIs

Resumen: API 1 (`VITE_API_URL`) — Cartera, Compras, Contabilidad, Importaciones, Recovery, Créditos, Transacciones. API 2 (`VITE_API_URL_NEW`) — Auth, 5W2H, Transacciones cartera, Desbloqueo, Permisos/Roles/URC.

**Detalle de endpoints, servicios y cabeceras:** [apis.md](apis.md).

---

## 8. Cómo añadir una nueva pantalla

1. **Añadir entrada en la configuración de rutas** (`src/router/Routes.js`): `{ title, icon, component, recurso, recursosAlternativos? }`. Si no se especifica `path`, se genera desde `recurso` (puntos → barras).
2. **El componente de página** debe recibir (inyectados por SimpleRouter): `routeConfig`, `availableCompanies`, `availableLines`. Opcionalmente usar `routeConfig.rolDelRecurso` y empresas/líneas para filtros y permisos (p. ej. edición vs consulta).
3. **Llamadas HTTP:** Reutilizar la instancia Axios adecuada desde `src/config/axiosConfig.js` y crear o ampliar un servicio en `src/services/` según la API que corresponda (ver [apis.md](apis.md)).

---

*Este documento refleja el estado del repositorio en el momento del análisis. Ante cambios en rutas, contextos o servicios, conviene actualizar esta descripción.*
