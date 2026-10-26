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
- `xcoinService.js` — Gestión de canjes XCoin: listar canjes, estados y actualizar estado.
- `postgresService.js` — Consultas a PostgreSQL para datos maestros (marcas, unidades, vendedores, líneas de negocio) y comunicados del calendario (feriados, festividades). (Reemplaza al anterior `LineaNegocio.js`).
- `mdmService.js` — Gestión de ítems maestros en el MDM (creación, edición, parseo de descripciones, carga de imágenes a Cloudflare, flujos de aprobación y rechazo por rol) y conexión con DWH.

### Endpoints representativos

- Auth: `/auth/login`, `/auth/me`, `/reset-password/*`.
- 5W2H: `/5w2h/cabecera`, `/5w2h/detalle`, `/5w2h/detalle/cabecera/:id`.
- Cartera: `/transacciones`, `/transacciones/:id`, `/cartera/bash/bancos/`, `/cartera/desbloqueo`, uploads de archivos transferencias.
- Administración: `/usuarios/`, `/permisos`, `/roles`, `/permisos-rol`, `/usuarios-rol-contexto`.
- Usuarios: `/usuarios/tipoUsuario/`, etc.
- **Club Shell Maxx** (misma base URL API 2): `GET /club-shell-maxx/canjes/estados-canjes`, `GET /club-shell-maxx/canjes/todos-con-estados`, `POST /club-shell-maxx/canjes/estado-historial-canje`, `GET /club-shell-maxx/usuarios`, `GET /club-shell-maxx/usuarios/info`, `POST /club-shell-maxx/usuarios` (crear vendedor).
- **Portal Mayorista** (misma base URL API 2): `GET /portal-mayorista/usuarios` (lista con ID_USER, NAME_USER, EMAIL, ACCESS_APP_SHELL, etc.), `POST /portal-mayorista/usuarios-permitidos/app-shell` (body: `{ "email": "..." }`), `DELETE /portal-mayorista/usuarios-permitidos/app-shell/{email}` (email en path, codificado).
- **XCoin** (misma base URL API 2): `GET /x-coin/canjes` (lista de canjes), `GET /x-coin/canjes/estados` (mapeo de estados), `POST /x-coin/canjes/estado/{idCanje}` (body: `{ "NEW_STATUS": "...", "COMMENT": "..." }`).
- **Postgres DWH:** `GET /dwh-postgres/comunicados`, `GET /dwh-postgres/codigo-marca`, `GET /mdm/tipos-unidades/:companyName`, `GET /dwh-postgres/vendedores-parametros`, `POST/DELETE /dwh-postgres/categoria-parametros`, etc.
- **MDM:** `GET/POST/PATCH /mdm/items`, `POST /mdm/parse-llantas/:lineaNegocio`, `POST /mdm/upload-cloudflare`, `POST /mdm/items/upload-images/:lineaNegocio`, `GET /mdm/itemsDWH/linea-negocio/:lineaNegocio`, `GET /mdm/items-caracteristicas`, etc.

### Datos y riesgos

- **Login:** envía `correo`, `contrasena`; respuesta incluye `idSession`. `/auth/me` devuelve usuario con CONTEXTOS, EMPRESAS, LINEAS, ROLES, etc.
- **Riesgos:** Toda la sesión depende de esta API. Si `id-session` no se envía o expira, las llamadas fallan; el interceptor no renueva token automáticamente.

---

## Módulo RRHH · Colaboradores (`/rrhh/*`, API 2)

Control de personal, portado del proyecto Intranet «Control de Personal»
(C#/.NET 8) al backend `v1-portal-empresarial-back-new`. Los datos viven en el
esquema `portal_empresarial` de la PostgreSQL que ya usa el back. Lo consume
`src/services/colaboradoresService.js` con `axiosInstanceNew`.

### Permisos: dos niveles de acceso

Mismo patrón que XCoin con `xcoin.admin` / `xcoin.viewer`:

| Recurso | Qué permite |
|---|---|
| `rrhh.colaboradores` | Gestión completa: crear, editar, dar de baja, reingresar, eliminar, abrir la ficha y ver la bitácora |
| `rrhh.colaboradores.consulta` | Solo el listado de colaboradores **activos**: sin abrir fichas, sin editar y sin ver bajas |

Quien tenga el recurso raíz `rrhh` obtiene la gestión completa por herencia de
prefijo. Quien tenga **solo** `rrhh.colaboradores.consulta` no la obtiene, porque
la herencia va de padre a hijo y nunca al revés.

**La regla se aplica en el servidor**, no solo en la pantalla: los endpoints de
escritura, la ficha individual y la bitácora responden **403** a quien es de
consulta, y el listado le fuerza `estado=Activo` aunque pida otra cosa en la
query. El front lo refleja escondiendo botones, quitando la columna Estado y
dejando las filas no clicables, pero eso es UX: quien decide es el back
(`src/config/permisosRrhh.ts`).

`GET /rrhh/empleados` devuelve además **`puedeGestionar`** dentro de `data`. Ése es
el valor que manda en la pantalla: si el front dedujera el permiso por su cuenta y
las dos reglas divergieran, mostraría acciones que el API va a rechazar.

### Endpoints

Los marcados con 🔒 exigen `rrhh.colaboradores`; el resto acepta también consulta.

| Verbo | Ruta | Qué hace |
|---|---|---|
| GET | `/rrhh/resumen` | Tablero: totales, ingresos y bajas del mes, desglose por empresa, últimos 10 movimientos |
| GET | `/rrhh/empleados` | Listado paginado + `puedeGestionar`. Query: `buscar`, `estado`, `empresaId`, `cargoId`, `ciudadId`, `areaId`, `lineaId`, `page`, `pageSize`. A quien es de consulta se le fuerza `estado=Activo` |
| GET 🔒 | `/rrhh/empleados/:id` | Ficha completa (29 campos) con auditoría e historial de movimientos |
| POST 🔒 | `/rrhh/empleados` | Alta. Devuelve **201** |
| PUT 🔒 | `/rrhh/empleados/:id` | Edición de datos. No toca estado ni salida |
| POST 🔒 | `/rrhh/empleados/:id/baja` | Da de baja |
| POST 🔒 | `/rrhh/empleados/:id/reingreso` | Reingresa |
| DELETE 🔒 | `/rrhh/empleados/:id` | Borrado lógico. **Requiere cuerpo** con `motivo` (mín. 5 caracteres) |
| GET 🔒 | `/rrhh/empleados/:id/auditoria` | Bitácora de cambios de la ficha |
| GET | `/rrhh/catalogos/{empresas,cargos,ciudades,areas,lineas}` | Catálogos con conteo de fichas activas |
| GET | `/rrhh/catalogos/motivos-salida` | Motivos vigentes, con `requiereDetalle` |
| GET | `/rrhh/catalogos/{estados,tipos-movimiento}` | Constantes de dominio |

### Particularidades de este contrato

- **Devuelve camelCase**, no MAYÚSCULAS como otros módulos de la API 2. Es un
  acuerdo explícito: las pantallas vienen portadas del Intranet y ya estaban
  escritas contra camelCase.
- **Las fechas de negocio son strings `AAAA-MM-DD`.** Si alguna llegara como
  datetime, el `value` de un `<input type="date">` la rechaza en silencio: el
  campo aparece vacío y guardar el formulario **borra la fecha**. El servicio
  recorta a 10 caracteres como red de seguridad.
- **Los catálogos se crean al paso.** Cargo, área, línea y ciudad se envían por
  NOMBRE (`cargoNombre`, `areaNombre`, `lineaNombre`, `ciudadNombre`) y el
  backend crea la fila si no existe. Por eso el formulario usa un combobox de
  texto libre y no un select.
- **El DELETE lleva cuerpo:** `axiosInstanceNew.delete(url, { data: { motivo } })`.
  Como segundo argumento plano, axios lo interpreta como config y el cuerpo se pierde.
- **El orden de las claves de `datosAnteriores` / `datosNuevos` es contrato.** La
  pantalla de bitácora empareja «antes» y «ahora» por posición del arreglo, no por
  nombre. Reordenarlas no da error: muestra el valor de otro campo.
- **Los errores traen el mensaje de negocio en `message`** y están escritos para
  mostrarse en pantalla tal cual («ya tiene una ficha en MAXXIMUNDO CIA LTDA»,
  «complétela en la ficha antes de dar de baja»).

---

*Para requisitos de entorno y errores comunes al conectar con las APIs, ver [setup.md](setup.md).*
