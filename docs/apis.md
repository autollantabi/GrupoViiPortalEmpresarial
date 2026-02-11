# Integración con APIs externas

El proyecto consume **dos APIs** mediante **dos instancias de Axios** definidas en `src/config/axiosConfig.js`. Las URLs se leen de `src/config/env.js` (variables `VITE_*` en `.env.development` / `.env.production`).

---

## Resumen por instancia

| Instancia            | Variable URL       | Cabecera        | Uso principal |
|----------------------|-------------------|-----------------|---------------|
| `axiosInstance`     | `VITE_API_URL`    | —               | Cartera, Compras, Contabilidad, Importaciones, Recovery, Créditos, Transacciones |
| `axiosInstanceNew`  | `VITE_API_URL_NEW`| `id-session` (tras login) | Auth, 5W2H, Transacciones cartera, Desbloqueo, BAT, Administración (permisos/roles/URC), Usuarios nuevos |

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
- `appShell_Service.js` — Club Shell Maxx: usuarios/info, usuarios (CRUD), canjes (estados y historial). **Portal Mayorista:** usuarios, usuarios-permitidos/app-shell (habilitar/quitar permiso).

### Endpoints representativos

- Auth: `/auth/login`, `/auth/me`, `/reset-password/*`.
- 5W2H: `/5w2h/cabecera`, `/5w2h/detalle`, `/5w2h/detalle/cabecera/:id`.
- Cartera: `/transacciones`, `/transacciones/:id`, `/cartera/bash/bancos/`, `/cartera/desbloqueo`, uploads de archivos transferencias.
- Administración: `/usuarios/`, `/permisos`, `/roles`, `/permisos-rol`, `/usuarios-rol-contexto`.
- Usuarios: `/usuarios/tipoUsuario/`, etc.
- **Club Shell Maxx** (misma base URL API 2): `GET /club-shell-maxx/canjes/estados-canjes`, `GET /club-shell-maxx/canjes/todos-con-estados`, `POST /club-shell-maxx/canjes/estado-historial-canje`, `GET /club-shell-maxx/usuarios`, `GET /club-shell-maxx/usuarios/info`, `POST /club-shell-maxx/usuarios` (crear vendedor).
- **Portal Mayorista** (misma base URL API 2): `GET /portal-mayorista/usuarios` (lista con ID_USER, NAME_USER, EMAIL, ACCESS_APP_SHELL, etc.), `POST /portal-mayorista/usuarios-permitidos/app-shell` (body: `{ "email": "..." }`), `DELETE /portal-mayorista/usuarios-permitidos/app-shell/{email}` (email en path, codificado).

### Datos y riesgos

- **Login:** envía `correo`, `contrasena`; respuesta incluye `idSession`. `/auth/me` devuelve usuario con CONTEXTOS, EMPRESAS, LINEAS, ROLES, etc.
- **Riesgos:** Toda la sesión depende de esta API. Si `id-session` no se envía o expira, las llamadas fallan; el interceptor no renueva token automáticamente.

---

*Para requisitos de entorno y errores comunes al conectar con las APIs, ver [setup.md](setup.md).*
