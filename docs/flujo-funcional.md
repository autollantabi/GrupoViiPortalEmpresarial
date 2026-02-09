# Flujos funcionales principales

Este documento describe, paso a paso, los flujos principales del sistema: login, recuperación de contraseña, navegación protegida, gestión de canjes y otros flujos relevantes.

---

## 1. Flujo de login

1. **Usuario accede a la aplicación** (p. ej. raíz `/` o cualquier ruta protegida).
2. **Router (SimpleRouter):** Si la ruta es protegida y no hay sesión válida, el usuario es redirigido a `/login` (comportamiento esperado según la lógica de rutas protegidas y AuthContext).
3. **Pantalla de login (`LoginPage`):** El usuario introduce correo y contraseña.
4. **Envío del formulario:** Se llama a `authService_login` (o equivalente en authService) contra la **API nueva** (`VITE_API_URL_NEW`), normalmente `POST /auth/login` con `{ correo, contrasena }`.
5. **Respuesta del backend:** Si es correcta, la API devuelve un token de sesión (en el código se usa `idSession`).
6. **Frontend:**
   - Se guarda `idSession` en memoria y se persiste encriptado en `localStorage` (clave fija; encriptación con `utils/encryption.js` y `VITE_ENCRYPTION_KEY`).
   - Se configura la cabecera `id-session` en `axiosInstanceNew` mediante `setAxiosIdSession(idSession)`.
   - Se llama a `fetchUserMe()` → `GET /auth/me` contra la API nueva para obtener el usuario con `CONTEXTOS`, `EMPRESAS`, `LINEAS`, `ROLES`, etc.
   - Los datos del usuario se guardan en el estado global del `AuthContext` (`user`).
7. **Redirección:** Tras login y carga de usuario, el usuario es redirigido (normalmente a `/` o a la ruta solicitada). El sidebar se genera según `user.CONTEXTOS` y `getSidebarItems`.

**Resumen:** Login → idSession encriptado en localStorage → cabecera id-session en API nueva → /auth/me → user en contexto → redirección y menú según permisos.

---

## 2. Flujo de recuperación de contraseña

1. **Usuario en `/login`** accede al enlace de recuperación de contraseña (ruta `/recovery`).
2. **Pantalla de recuperación (`PasswordRecovery`):** Flujo típico en varios pasos (solicitud de token, verificación OTP, nueva contraseña), según implementación en `pages/auth/PasswordRecovery.jsx`.
3. **Servicios:** Se usan endpoints de la API (por ejemplo `recoveryService` para API principal o endpoints de la API nueva como `/reset-password/request`, `/reset-password/verify-otp`, `/reset-password/resPss`; ver [apis.md](apis.md)).
4. **Resultado:** Tras completar el flujo, el usuario puede volver a `/login` e iniciar sesión con la nueva contraseña.

**Nota:** Los pasos exactos (pantallas, campos, endpoints) dependen del componente PasswordRecovery y de los contratos de la API; para detalle se debe revisar el código y la documentación del backend.

---

## 3. Flujo de navegación y acceso por recurso

1. **Usuario ya autenticado** navega por la aplicación (sidebar o URL directa).
2. **Router:** Para cada ruta protegida, SimpleRouter renderiza un wrapper que usa `ProtectedContent` con el `recurso` (y opcionalmente `recursosAlternativos`) definidos en `Routes.js` para esa ruta.
3. **ProtectedContent:**
   - Comprueba `isAuthenticated` y existencia de `user` (y `user.CONTEXTOS`).
   - Llama a `hasAccessToResource(userContexts, recurso)` (y, si aplica, a recursos alternativos). La lógica está en `utils/permissionsValidator.js` (notación de puntos, herencia, recursos bloqueados).
   - Si no tiene acceso: no se renderiza el contenido de la ruta (o se muestra mensaje/redirección según implementación).
   - Si tiene acceso: obtiene `availableCompanies` y `availableLines` con `getAvailableCompanies` y `getAvailableLines` (combinando todos los recursos que dan acceso).
   - Calcula `rolDelRecurso` a partir de user.CONTEXTOS y user.ROLES.
   - Construye `routeConfig` (recurso, recursosAlternativos, rolDelRecurso, availableCompanies, availableLines) e inyecta `routeConfig`, `availableCompanies` y `availableLines` al componente de la página mediante `React.cloneElement`.
4. **Layout:** Se renderiza TemplatePaginas (Sidebar + Header + área de contenido). El Sidebar muestra solo ítems para los que el usuario tiene permiso (getSidebarItems(userContexts)).
5. **Página:** El componente de la página recibe las props inyectadas y las usa para filtros (empresa/línea), permisos de edición (p. ej. rol "jefatura" → "E", resto → "C" en tablas) y llamadas a servicios.

**Resumen:** Ruta protegida → verificación de recurso → empresas/líneas y rol → inyección a la página → sidebar filtrado por permisos.

---

## 4. Flujo de cierre de sesión

1. **Usuario** hace clic en "Cerrar sesión" (o equivalente) en el Sidebar o Header.
2. **AuthContext:** Se ejecuta `logout()` (o la función equivalente expuesta por el contexto).
3. **Acciones típicas:** Eliminar el token del localStorage, llamar a `removeAxiosIdSession()` para quitar la cabecera `id-session` de axiosInstanceNew, limpiar el estado `user` y `idSession`.
4. **Redirección:** El usuario queda no autenticado; al intentar acceder a rutas protegidas será redirigido a `/login` (según la lógica del router y ProtectedContent).

---

## 5. Autenticación, autorización y permisos (detalle)

### 5.1 Autenticación y sesión

1. Usuario envía correo/contraseña → `authService_login` (API 2) → respuesta con `idSession`.
2. `idSession` se encripta con `encryption.encrypt` y se guarda en `localStorage` bajo clave fija.
3. `setAxiosIdSession(idSession)` configura cabecera `id-session` en `axiosInstanceNew`.
4. Se llama a `fetchUserMe()` → GET `/auth/me` → se guarda en `user` (CONTEXTOS, EMPRESAS, LINEAS, etc.).
5. En carga de app, `authContext` lee token encriptado del `localStorage`, desencripta, setea id-session y llama a `/auth/me`; si falla, limpia sesión.

### 5.2 Autorización por recurso

- **Cálculo de acceso:** `hasAccessToResource(userContexts, recurso)` compara recurso solicitado con cada `context.RECURSO` (exacto o prefijo con herencia); respeta `BLOQUEADO` / `RECURSOS_BLOQUEADOS`. Lógica en `utils/permissionsValidator.js`.
- **Empresas/líneas:** `getAvailableCompanies(userContexts, recurso, user.EMPRESAS)` y `getAvailableLines(..., user.LINEAS)` agregan empresas/líneas de los contextos que tienen acceso al recurso.
- **Rol por recurso:** `rolDelRecurso` se obtiene en SimpleRouter buscando en user.CONTEXTOS y user.ROLES el rol del recurso (o alternativos) y se incluye en `routeConfig`.

### 5.3 Permisos en tabla (TablaInputsUI)

- Prop `permisos`: array de `{ empresa, permiso: "E"|"C" }`.
- Doble clic: si `permisos` tiene entrada para `item.EMPRESA` con `permiso === "E"` se activa edición; si es "C" solo consulta o flujo alternativo.
- Varias páginas construyen este array desde `availableCompanies` + `routeConfig.rolDelRecurso` (ej. jefatura → "E", resto → "C").

### 5.4 Datos del usuario (post login)

Tras login se llama a `/auth/me` (API 2). La respuesta se guarda en `user` con estructura tipo: `USUARIO`, `EMPRESAS`, `LINEAS`, `PERMISOS`, `ROLES`, `CONTEXTOS`. `CONTEXTOS` es un array de contextos (recurso, rol, alcance por empresas/líneas, bloqueados, herencia). En varios sitios se usa `user.data` como alias de `CONTEXTOS`.

---

## 6. Flujos adicionales (resumen)

- **Reportería:** El usuario elige tipo de reporte, empresa/línea (según routeConfig y permisos); TemplateReporteria puede cargar iframes o contenido según el reporte.
- **Importaciones:** Filtros por empresa/fechas → tabla de importaciones; edición/creación mediante ventanas modales y múltiples servicios (general, transacción, bodega, nacionalización, etc.); permisos por rol (ventas, bodega, jefatura) definen columnas y permisos.
- **Registros bancarios (Cartera):** Filtros por empresa y fechas → carga de transacciones desde API nueva; permisos por recurso; recurso alternativo `contabilidad.registrosbancarios` permite el mismo componente.
- **Comisiones Tecnicentro:** Reportes y categorías de productos; categorías usan API principal; permisos de edición por rol "jefatura" y empresas con AUTOLLANTA.
- **Administración:** Acceso temporal sin restricción por recurso (TODO en SimpleRouter para quitar cuando estén configurados permisos). Incluye gestión de usuarios, permisos, roles y contextos.
- **Usuarios App (Club Shell):** Pantalla AS_UsuariosApp (recurso appshell.usuariosapp). Lista de usuarios del club shell con filtro global por texto, filtro por rol y orden por fecha de creación. Solo consulta (crear/editar en Administración → Usuarios App Shell).

Los detalles de cada pantalla (campos, validaciones, endpoints concretos) se encuentran en el código de cada página y en los servicios correspondientes; la documentación de la API backend es la fuente de verdad para contratos de endpoints.

---

*Este documento refleja los flujos tal como se deducen del código analizado. Ante cambios en rutas, servicios o componentes, conviene actualizar esta descripción.*
