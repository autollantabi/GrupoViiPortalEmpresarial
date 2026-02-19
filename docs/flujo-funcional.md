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
   - Si tiene acceso: obtiene `availableCompanies`, `availableLines` y `availableCanales` con `getAvailableCompanies`, `getAvailableLines` y `getAvailableCanales` (combinando todos los recursos que dan acceso).
   - Calcula `rolDelRecurso` a partir de user.CONTEXTOS y user.ROLES.
   - Construye `routeConfig` (recurso, recursosAlternativos, rolDelRecurso, availableCompanies, availableLines, availableCanales) e inyecta `routeConfig`, `availableCompanies`, `availableLines` y `availableCanales` al componente de la página mediante `React.cloneElement`.
4. **Layout:** Se renderiza TemplatePaginas (Sidebar + Header + área de contenido). El Sidebar muestra solo ítems para los que el usuario tiene permiso (getSidebarItems(userContexts)).
5. **Página:** El componente de la página recibe las props inyectadas y las usa para filtros (empresa/línea/canal), permisos de edición (p. ej. rol "jefatura" → "E", resto → "C" en tablas) y llamadas a servicios.

**Resumen:** Ruta protegida → verificación de recurso → empresas/líneas/canales y rol → inyección a la página → sidebar filtrado por permisos.

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
- **Empresas/líneas/canales:** `getAvailableCompanies(userContexts, recurso, user.EMPRESAS)`, `getAvailableLines(..., user.LINEAS)` y `getAvailableCanales(userContexts, recurso)` agregan empresas, líneas y canales (desde ALCANCE.CANALES) de los contextos que tienen acceso al recurso.
- **Rol por recurso:** `rolDelRecurso` se obtiene en SimpleRouter buscando en user.CONTEXTOS y user.ROLES el rol del recurso (o alternativos) y se incluye en `routeConfig`.

### 5.3 Permisos en tabla (TablaInputsUI)

- Prop `permisos`: array de `{ empresa, permiso: "E"|"C" }`.
- Doble clic: si `permisos` tiene entrada para `item.EMPRESA` con `permiso === "E"` se activa edición; si es "C" solo consulta o flujo alternativo.
- Varias páginas construyen este array desde `availableCompanies` + `routeConfig.rolDelRecurso` (ej. jefatura → "E", resto → "C").

### 5.4 Datos del usuario (post login)

Tras login se llama a `/auth/me` (API 2). La respuesta se guarda en `user` con estructura tipo: `USUARIO`, `EMPRESAS`, `LINEAS`, `PERMISOS`, `ROLES`, `CONTEXTOS`. `CONTEXTOS` es un array de contextos (recurso, rol, alcance por empresas/líneas/canales — ALCANCE.EMPRESAS, ALCANCE.LINEAS, ALCANCE.CANALES —, bloqueados, herencia). En varios sitios se usa `user.data` como alias de `CONTEXTOS`.

---

## 6. Flujos adicionales (resumen)

- **Reportería:** El usuario elige tipo de reporte, empresa, línea (recurso) y canal si aplica (según routeConfig y permisos). Los reportes se definen en formato lista `[{ url, rol, linea, empresa, canal? }]`. TemplateReporteria filtra por empresas/líneas/canales permitidos e inyecta iframes según el reporte seleccionado.
- **Importaciones:** Filtros por empresa/fechas → tabla de importaciones; edición/creación mediante ventanas modales y múltiples servicios (general, transacción, bodega, nacionalización, etc.); permisos por rol (ventas, bodega, jefatura) definen columnas y permisos.
- **Registros bancarios (Cartera):** Filtros por empresa y fechas → carga de transacciones desde API nueva; permisos por recurso; recurso alternativo `contabilidad.registrosbancarios` permite el mismo componente.
- **Comisiones Tecnicentro:** Reportes y categorías de productos; categorías usan API principal; permisos de edición por rol "jefatura" y empresas con AUTOLLANTA.
- **Administración:** Acceso temporal sin restricción por recurso (TODO en SimpleRouter para quitar cuando estén configurados permisos). Incluye gestión de usuarios, permisos, roles y contextos.
- **Usuarios App (Club Shell):** Pantalla AS_UsuariosApp (recurso appshell.usuariosapp). Lista de usuarios del club shell con filtro global por texto, filtro por rol y orden por fecha de creación. Muestra asociaciones: si el usuario es INFLUENCIADOR la asociación es con un Manager; si es MANAGER, con un Vendedor (chips de tipo, nombre y email; o "Asociación con manager/vendedor pendiente" si ASSOCIATED es vacío). Solo consulta (crear/editar en Administración → Usuarios App Shell).
- **Gestión de canjes (App Shell):** AS_GestionCanjes (recurso appshell.gestioncanjes). Lista de canjes con estados; el usuario puede cambiar el estado de un canje (flujo tipo pipeline) con confirmación. Endpoints: estados de canjes, canjes con historial, actualizar estado.
- **Hab Shell Form (App Shell):** AS_HabShellForm (recurso appshell.habshellform). Lista de usuarios del portal mayorista (GET /portal-mayorista/usuarios). Por usuario se muestra nombre, email y fecha de registro; si ACCESS_APP_SHELL es true se muestra "Ya tiene sección habilitada" y botón "Quitar permiso" (DELETE por email); si no, botón "Habilitar sección" (POST con body { email }). Confirmación antes de habilitar o quitar. Orden por createdAt; búsqueda por nombre o correo.

- **MDM CRUD (Master Data Management):** MDM_Crud (recurso mdm.crud). Gestión de grupos de ingreso de ítems maestros. El flujo completo se describe en la sección 7 a continuación.

Los detalles de cada pantalla (campos, validaciones, endpoints concretos) se encuentran en el código de cada página y en los servicios correspondientes; la documentación de la API backend es la fuente de verdad para contratos de endpoints.

---

## 7. MDM CRUD — Gestión de datos maestros

### 7.1 Propósito

El módulo **MDM_Crud** (`src/pages/Areas/MDM/MDM_Crud/MDM_Crud.jsx`) permite crear, gestionar y exportar **grupos de ingreso de ítems maestros** para diferentes líneas de negocio. El formulario de creación de ítems es **dinámico y config-driven**: los campos, las opciones de cada select, las validaciones y la generación de la descripción del ítem cambian automáticamente según la línea seleccionada.

### 7.2 Líneas de negocio soportadas

| Línea           | Tipo de formulario | Campos del ítem |
|-----------------|--------------------|-----------------|
| LLANTAS         | `llantas`          | Tipo (Americana/Milimétrica/Decimal), Ancho, Altura/Serie, Rin, Diseño, Lona/Robustez, Carga, Velocidad |
| LLANTAS MOTO    | `llantas`          | Mismos campos que LLANTAS pero con rangos diferenciados |
| LUBRICANTES     | `lubricantes`      | Marca, Modelo, Tipo, Viscosidad (opcional), Empaque |

### 7.3 Empresas por línea

| Línea           | Empresas disponibles |
|-----------------|----------------------|
| LLANTAS         | AUTOLLANTA, MAXXIMUNDO, STOX, AUTOMAX |
| LLANTAS MOTO    | MAXXIMUNDO |
| LUBRICANTES     | MAXXIMUNDO |

### 7.4 Flujo funcional

1. **Crear grupo de ingreso:** El usuario hace clic en "Crear grupo de ingreso"; se crea un grupo borrador (id temporal `draft`).
2. **Asignar línea y empresa:** Se selecciona la línea de negocio y la empresa (las opciones de empresa dependen de la línea). Se presiona "Continuar" para confirmar.
3. **Agregar ítems:** Se despliega un formulario inline ("+ Agregar ítem") cuyo contenido varía según la línea:
   - **LLANTAS / LLANTAS MOTO:** Se elige Tipo, y a partir de éste se generan las opciones dinámicas de Ancho, Altura/Serie, Rin, Lona, Carga. Diseño es campo de texto libre. Velocidad es un select con letras predefinidas. Si el tipo es "Decimal", el campo Altura/Serie no se muestra.
   - **LUBRICANTES:** Se selecciona Marca (SHELL, PENNZOIL, AC DELCO) y se completan Modelo (solo letras), Tipo (alfanumérico), Viscosidad (formato XWX, opcional) y Empaque (formato X*XM, ej: 1*4GAL).
4. **Validación en tiempo real:** Cada campo muestra errores de validación al perder el foco (touched). Al intentar agregar un ítem con errores, se notifica por toast los campos con error.
5. **Descripción automática:** Al agregar el ítem, se genera automáticamente una cadena `descripcionConVariables`:
   - **Llantas:** Según el tipo: `"Altura x Ancho R-Rin Diseño LonaPR Carga Velocidad"` (Americana), `"Ancho/Altura R-Rin Diseño LonaPR Carga Velocidad"` (Milimétrica), `"Ancho R-Rin Diseño LonaPR Carga Velocidad"` (Decimal).
   - **Lubricantes:** Concatenación de `"Marca Modelo Tipo Viscosidad Empaque"`.
6. **Gestión de ítems:** Los ítems se listan con checkbox individual y checkbox "seleccionar todos". Se puede exportar todo el grupo o solo los ítems seleccionados a archivo `.txt`.
7. **Guardar grupo:** Se presiona "Guardar grupo" (requiere al menos 1 ítem). El borrador obtiene un id permanente y pasa a la lista de grupos guardados.
8. **Grupos guardados:** Desde la vista general se pueden: editar (volver a agregar ítems), eliminar (con confirmación) o exportar a TXT cada grupo.

### 7.5 Configuración centralizada (`LINEA_CONFIG`)

Toda la configuración de rangos, pasos y tipo de formulario se centraliza en el objeto `LINEA_CONFIG`. Esto permite agregar nuevas líneas de negocio con solo añadir una entrada al objeto, sin modificar la lógica del componente.

```
LINEA_CONFIG = {
  LLANTAS: {
    formType: "llantas",
    ancho: { Americana: {min,max,step}, Milimetrica: {…}, Decimal: {…} },
    altura: { Americana: {…}, Milimetrica: {…} },
    rin: {min,max,step},
    lona: {min,max,step},
    carga: { tipo: "formato" },        // opciones: 2-30, 4/2, 6/4, …, 30/28
  },
  "LLANTAS MOTO": {
    formType: "llantas",
    // …rangos distintos…
    carga: { tipo: "rango", min: 14, max: 98, step: 1 },
  },
  LUBRICANTES: {
    formType: "lubricantes",            // sin rangos; campos propios
  },
}
```

La variable `config?.formType` determina si se renderizan los campos de llantas (`"llantas"`) o de lubricantes (`"lubricantes"`). Las opciones de los selects se generan dinámicamente con `generarOpciones(min, max, step)`.

### 7.6 Validaciones

| Campo        | Línea          | Regla |
|--------------|----------------|-------|
| Tipo         | Llantas        | Requerido (Americana, Milimétrica o Decimal) |
| Ancho        | Llantas        | Requerido, dentro del rango según tipo y línea |
| Altura/Serie | Llantas        | Requerido (excepto tipo Decimal), rango según tipo y línea |
| Rin          | Llantas        | Requerido, rango según línea |
| Diseño       | Llantas        | Requerido (texto libre alfanumérico) |
| Lona         | Llantas        | Requerido, rango según línea |
| Carga        | Llantas        | Requerido; formato `X` o `X/X` (LLANTAS) o entero en rango (LLANTAS MOTO) |
| Velocidad    | Llantas        | Requerido, una letra: Y,G,R,H,L,Q,W,F,J,M,P,V,S,I,K,T,N |
| Marca        | Lubricantes    | Requerido (SHELL, PENNZOIL, AC DELCO) |
| Modelo       | Lubricantes    | Requerido, solo caracteres alfabéticos |
| Tipo (Lub)   | Lubricantes    | Requerido (alfanumérico) |
| Viscosidad   | Lubricantes    | Opcional; si se ingresa, formato `XWX` (ej: 5W30, 10W40) |
| Empaque      | Lubricantes    | Requerido, formato `X*XM` (ej: 1*4GAL) |

### 7.7 Patrones de diseño aplicados

| Patrón                        | Aplicación |
|-------------------------------|------------|
| **Config-driven UI**          | `LINEA_CONFIG` centraliza rangos, tipos de formulario y reglas; el componente no tiene lógica hardcoded por línea. |
| **DRY (Don't Repeat Yourself)** | Función `renderCampo` reutilizable genera `SelectUI` o `InputUI` con label, validación y error; evita duplicar JSX. |
| **Generación dinámica de opciones** | `generarOpciones(min, max, step)` y `generarCargasFormato()` crean las opciones de los selects a partir de la config. |
| **Validación modular**        | Funciones de validación independientes (`validarAncho`, `validarCarga`, `validarModelo`, etc.) reciben config como parámetro, facilitando testing y extensibilidad. |
| **Touched fields**            | Errores de validación solo se muestran para campos que el usuario ya tocó (`touchedFields`), mejorando la experiencia de usuario. |
| **Exportación a TXT**         | `exportarItemsATxt()` genera y descarga un `.txt` con las descripciones de los ítems; soporta exportar grupo completo o selección parcial. |

---

*Este documento refleja los flujos tal como se deducen del código analizado. Ante cambios en rutas, servicios o componentes, conviene actualizar esta descripción.*
