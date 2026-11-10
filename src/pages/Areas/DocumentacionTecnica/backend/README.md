# API de «Documentación Técnica» (backend)

API en Node (sin framework) que sirve al módulo `src/pages/Areas/DocumentacionTecnica` del Portal Empresarial. El frontend **solo depende de su
contrato** (rutas y formato JSON, descritos en la cabecera de cada `*/ruta.js`): esta API puede reemplazarse por otra que cumpla el mismo contrato sin
tocar el frontend.

## Qué hace

| Sección | Rutas | De dónde salen los datos |
|---|---|---|
| Diccionario SAP | `/diccionario/`, `POST /diccionario/actualizar/` | Definiciones: `diccionario/datos/tablas.json` (escritas a mano). Valores reales: SAP HANA con el botón «Actualizar desde SAP». |
| DWH mapping | `/dwh-mapping/` | `dwh_mapping/datos/tablas_dwh.json` |
| Caracterización | `/caracterizacion/` | `caracterizacion/datos/*.json` (definiciones) |
| Calidad | `/calidad/*`, `POST /calidad/actualizar/` | Se calcula desde PostgreSQL (`core.dim_item`) con `calidad/motor.js` al pulsar «Actualizar datos». |
| Completitud | `/completitud/*` | PostgreSQL (`COMPLETITUD_FUENTE=postgres`) con las reglas de `completitud/datos/config.json`. |
| Salud | `/salud/` (pública), `/salud/db/`, `/salud/hana/` | Pruebas de conexión; nunca devuelven datos de conexión. |

**Definiciones vs. datos:** los JSON de `datos/` son *definiciones* (documentación y reglas escritas a mano). Los *cálculos* (Calidad, Completitud, valores del
Diccionario) se generan solos desde las bases; no hay que migrar ningún JSON de catálogo. Los catálogos reales (`calidad/datos/calidad.json`,
`completitud/datos/corte.json`) **no se suben al repositorio**: sin ellos Calidad dice «sin datos» hasta la primera actualización y Completitud pide la
fuente PostgreSQL.

## Ponerla en marcha

```bash
npm ci                 # instala pg y @sap/hana-client (el conector oficial de SAP)
cp .env.example .env   # y completar (ver abajo). backend/.env NO se versiona
npm start              # http://localhost:3010/api/documentacion/
```

En desarrollo, el `vite.config.js` local del portal puede montarla dentro del mismo servidor (un plugin que hace
`server.middlewares.use(apiSimulada)`), con `VITE_API_URL_DOC=/api/documentacion`. En producción, `api.js` del módulo usa `/api/documentacion`: hay que
enviar esa ruta a esta API (ejemplo, **sin probar**, para nginx: `location /api/documentacion/ { proxy_pass http://127.0.0.1:3010; }` y el proceso con `pm2 start
index.js --name doc-tecnica`).

## Variables de entorno (`.env` o del sistema; las del sistema tienen prioridad)

| Variable | Para qué |
|---|---|
| `PORTAL_API_URL` | Base de la API de autenticación del portal (la de `VITE_API_URL_NEW`), sin `/auth/me`. |
| `DOC_AUTH` | `portal` exige sesión; `ninguna` no valida (**solo desarrollo local**). Sin definirla: `portal` si hay `PORTAL_API_URL` o `NODE_ENV=production`. |
| `DOC_SESION_CACHE_S` | Segundos que se recuerda una sesión validada (60 por defecto). |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL (Calidad y Completitud). Usuario de **solo lectura**. |
| `COMPLETITUD_FUENTE`, `COMPLETITUD_CACHE_MIN` | `postgres` para leer en vivo; minutos de caché. |
| `HANA_HOST`, `HANA_PORT`, `HANA_USER`, `HANA_PASSWORD`, `HANA_SCHEMA`, `HANA_ENCRYPT` | SAP HANA (Diccionario). Usuario de **solo lectura**. |

## Seguridad

- **Sesión del portal** (`sesion.js`): cada petición (salvo `/salud/`) debe traer la cabecera `id-session`. La API le pregunta al portal quién es
  (`GET {PORTAL_API_URL}/auth/me`) y aplica **la misma regla que el portal** (`hasAccessToResource`): un contexto da acceso si su `RECURSO` coincide o es
  padre con herencia y no está bloqueado. Cada sección exige su recurso: `documentaciontecnica.diccionario`, `.dwhmapping`, `.caracterizacion`, `.calidad`,
  `.completitud`; las rutas de salud y las desconocidas exigen `documentaciontecnica`.
- Respuestas: **401** sin sesión válida, **403** sin permiso, **503** si el portal no responde (se cierra por defecto: sin poder validar no se deja pasar).
- Solo se envían `SELECT` a PostgreSQL y a SAP (de una instrucción). Los errores no incluyen servidor, usuario ni contraseña.
- Del proveedor solo viaja el nombre del principal; nunca su código ni su RUC. Los campos sensibles (`CardCode`) no se consultan.
- Los `POST` solo se aceptan desde la misma página (si el navegador manda otro `Origin`, 403) y pasan por la misma validación de sesión.

## Pruebas

```bash
node pruebas/sesion.mjs                 # sesión y permisos, con un portal simulado (11 pruebas)
node pruebas/diccionario_hana.mjs       # lectura de SAP con una SAP simulada (14 pruebas)
node pruebas/calidad_contra_django.mjs <ruta-a-calidad.json>   # motor de Calidad contra lo que calculó Django (necesita esa foto; no viaja en el repositorio)
```

## Estado y pendientes

- Probado con el SAP real y con la base real de PostgreSQL (ver `docs/HISTORIAL.md` del proyecto original). **La validación de sesión se probó con un portal
  simulado, no con el `/auth/me` real**: el formato esperado es el que lee `authService_me` del portal (`response.data.data || response.data`, con `CONTEXTOS`).
- El historial semanal de Calidad se guarda en `calidad/datos/calidad_vivo.json` (provisional): en producción debería ir a una base.
- Para una carga semanal automática, una tarea programada puede llamar a `POST /calidad/actualizar/` (con una sesión de servicio) los viernes.
