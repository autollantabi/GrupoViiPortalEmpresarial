# Integración con APIs externas

El proyecto consume **tres APIs** mediante **tres instancias de Axios** definidas en `src/config/axiosConfig.js`. Las URLs y claves se leen de `src/config/env.js` (variables `VITE_*` en `.env.development` / `.env.production`).

---

## Resumen por instancia

| Instancia               | Variable URL              | Cabecera / clave              | Uso principal |
|-------------------------|---------------------------|--------------------------------|---------------|
| `axiosInstance`        | `VITE_API_URL`            | —                              | Cartera, Compras, Contabilidad, Importaciones, Recovery, Créditos, Transacciones |
| `axiosInstanceNew`     | `VITE_API_URL_NEW`        | `id-session` (tras login)      | Auth, 5W2H, Transacciones cartera, Desbloqueo, BAT, Administración (permisos/roles/URC), Usuarios nuevos |
| `axiosInstanceAppShell`| `VITE_API_URL_APP_SHELL`   | `X-Portal-API-Key` (env)       | Canjes (estados, historial), Usuarios/vendedores App Shell |

---

## API 1 — Principal (legacy / multipropósito)

- **Propósito:** Backend principal para cartera, compras, contabilidad, administración (módulos/roles/usuarios), importaciones, recovery, créditos, etc.
- **Variable de entorno:** `VITE_API_URL` (en `env.js`: `API_URL`).
- **Instancia:** `axiosInstance` (timeout 300000 ms).
- **Cabeceras:** Sin cabecera especial de autenticación en el código (depende del backend).

### Servicios que la usan

- `contabilidadService.js` — bancos, flujo caja, comisiones Tecnicentro/Mayoristas, categorías/subcategorías, productos.
- `carteraService.js` — empresas cartera, cheques, vendedores, bancos (también usa API 2 para transacciones).
- `importacionesService.js` — empresas, proveedores, marcas, clientes, navieras, transportistas, aduanero, CRUD importaciones, documentos, bodega, nacionalización, factura proveedor, carga BAT, etc.
- `administracionService.js` — parte: modulo, rol, usuario, empresas (también usa API 2 para permisos/roles/usuarios-rol-contexto).
- `usuariosService.js` — usuario, actualizar contraseña, por correo (tipo usuario usa API 2).
- `recoveryService.js` — recovery/token, recovery/obtenertoken.
- `creditosService.js` — creditos/creditosproveedores.
- `transaccionesService.js` — transaccion/actualizar/banco, fecha.
- `cartera/cargarTransferencias.js` — algunas rutas; principalmente usa API 2 para subir archivos.

### Endpoints representativos (no exhaustivos)

- GET/POST: `/bancos`, `/empresas`, `/usuario/`, `/modulo/`, `/rol/`, `/recovery/*`, `/cheques/*`, `/vendedor/*`, `/importaciones/*`, `/producto/categoria/subCategoria/`, `/promocion/*`, `/creditos/creditosproveedores/`, `/transaccion/actualizar/banco`.
- POST `/recovery/token/:correo`, GET `/recovery/obtenertoken/:correo`.

### Datos y riesgos

- **Datos:** JSON; formularios multipart en importaciones (documentos). Respuestas suelen traer `data` o estructura similar.
- **Riesgos:** API muy amplia; parte administración tiene código comentado o rutas no usadas. Recovery usa esta API; auth login/me usa API 2.

---

## API 2 — Nueva (Auth, sesión, permisos, transacciones)

- **Propósito:** Autenticación, usuario actual, permisos/roles/contextos, transacciones bancarias, 5W2H Marketing, cartera (desbloqueo, carga archivos transferencias), BAT bancos.
- **Variable de entorno:** `VITE_API_URL_NEW` (en `env.js`: `API_URL_NEW`).
- **Instancia:** `axiosInstanceNew` (timeout 300000 ms).
- **Cabecera:** `id-session` (se establece tras login con `setAxiosIdSession`; se elimina en logout con `removeAxiosIdSession`).

### Servicios que la usan

- `authService.js` — POST `/auth/login`, GET `/auth/me`, POST `/reset-password/request`, `/reset-password/verify-otp`, `/reset-password/resPss`.
- `marketingService.js` — GET/POST/PUT/PATCH/DELETE `/5w2h/cabecera`, `/5w2h/detalle/*`.
- `carteraService.js` — GET transacciones, PATCH `/transacciones/:id`, PATCH transacciones batch.
- `cartera/ejecutarbancos.js` — POST `/cartera/bash/bancos/`.
- `cartera/cargarTransferencias.js` — POST para Bolivariano y Pichincha (carga archivos).
- `carteraDesbloqueoClientesService.js` — GET/POST `/cartera/desbloqueo`.
- `administracionService.js` — POST `/usuarios/`, GET/POST/PUT/DELETE `/permisos`, `/roles`, `/permisos-rol`, `/usuarios-rol-contexto`.
- `usuariosService.js` — GET/POST/PUT/DELETE `/usuarios/tipoUsuario/`, y otros endpoints de usuarios nuevos.

### Endpoints representativos

- Auth: `/auth/login`, `/auth/me`, `/reset-password/*`.
- 5W2H: `/5w2h/cabecera`, `/5w2h/detalle`, `/5w2h/detalle/cabecera/:id`.
- Cartera: `/transacciones`, `/transacciones/:id`, `/cartera/bash/bancos/`, `/cartera/desbloqueo`, uploads de archivos transferencias.
- Administración: `/usuarios/`, `/permisos`, `/roles`, `/permisos-rol`, `/usuarios-rol-contexto`.
- Usuarios: `/usuarios/tipoUsuario/`, etc.

### Datos y riesgos

- **Login:** envía `correo`, `contrasena`; respuesta incluye `idSession`. `/auth/me` devuelve usuario con CONTEXTOS, EMPRESAS, LINEAS, ROLES, etc.
- **Riesgos:** Toda la sesión depende de esta API. Si `id-session` no se envía o expira, las llamadas fallan; el interceptor no renueva token automáticamente.

---

## API 3 — App Shell

- **Propósito:** Gestión de canjes (estados, historial) y de usuarios/vendedores del app shell.
- **Variable de entorno:** `VITE_API_URL_APP_SHELL` (en `env.js`: `API_URL_APP_SHELL`).
- **Instancia:** `axiosInstanceAppShell` (timeout 300000 ms).
- **Cabecera:** `X-Portal-API-Key` con valor de `VITE_API_KEY_APP_SHELL` (en `env.js`: `APP_SHELL_API_KEY`).

### Servicios que la usan

- `appShell_Service.js`:
  - GET `/canjes/estados-canjes` — listar estados de canjes.
  - GET `/canjes/todos-con-estados` — listar canjes con historial de estados.
  - POST `/canjes/estado-historial-canje` — actualizar estado de un canje (body: `{ canjeId, estadoId }`).
  - GET `/usuarios/` — listar usuarios.
  - POST `/usuarios/` — crear vendedor (name, lastname, card_id, email, phone, roleId, birth_date).

### Datos y riesgos

- **Datos:** Entrada/salida JSON. Si `VITE_API_KEY_APP_SHELL` no está definida, el backend puede responder "API KEY requerida".
- **Riesgos:** Sin la variable la integración falla; las rutas que consumen App Shell requieren la clave configurada.

---

*Para requisitos de entorno y errores comunes al conectar con las APIs, ver [setup.md](setup.md).*
