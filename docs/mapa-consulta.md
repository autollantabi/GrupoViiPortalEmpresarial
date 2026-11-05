# Mapa de consulta

Pantalla `/mapaconsulta` (recurso `mapaconsulta`): mapa Leaflet + búsqueda de dirección. Devuelve provincia, cantón, ciudad, parroquia, comunidad/barrio, calle, número y coordenadas. Clic o arrastre del marcador = consulta inversa del punto. Acepta cruces de calles: `Junín y 5 de Junio`, `Ayacucho / Bernardo Darquea, Riobamba`.

Código front: `src/pages/Areas/MapaConsulta/`, `src/services/geocodingService.js`.
Código back (repo `v1-portal-empresarial-back-new`): `routes/routesGeocodificacion.ts`, `controllers/Geocodificacion.ts`, `services/GeocodificacionService.ts`.

## Arquitectura
El navegador **no habla con OSM**: todo pasa por el backend (`/api/v1/geocodificacion/*`, protegido por la sesión).

| Endpoint | Qué hace | Fuente |
|---|---|---|
| `GET /search?q=` | Búsqueda por texto | API HTTP de Nominatim |
| `GET /reverse?lat&lon` | Qué hay en un punto | API HTTP de Nominatim |
| `GET /cruces?calleA&calleB[&ciudad][&lat&lon]` | Puntos donde se cortan dos calles, en todo el país | **Base de datos** de Nominatim (PostGIS) |

Los cruces se consultan en la base porque la búsqueda de texto de Nominatim devuelve solo fragmentos de cada calle, no su geometría completa: calcular el cruce con eso falla según qué tramo devuelva. Con `lat&lon` (centro del mapa) los más cercanos salen primero. El backend cachea 10 min las respuestas, compartidas entre usuarios.

## Nominatim local (Ecuador)
En el **repo del backend**: `docker compose -f docker/nominatim/docker-compose.yml up -d` — la primera vez descarga e importa (~10 min). Listo cuando `curl http://localhost:8080/status` responde `OK`. Importar con `IMPORT_STYLE: full` (con `address` muchas calles dejan de poder buscarse). `REPLICATION_URL` lo mantiene al día con las ediciones de OSM.

## Variables
Backend (`.env`, ver `.env.example`):
| Variable | Default | Uso |
|---|---|---|
| `NOMINATIM_URL` | `http://localhost:8080` | API HTTP de Nominatim |
| `NOMINATIM_COUNTRY` | `ec` | País de las búsquedas |
| `NOMINATIM_DB_HOST` / `_PORT` / `_USER` / `_NAME` | `localhost` / `5433` / `nominatim` / `nominatim` | Base de Nominatim |
| `NOMINATIM_DB_PASSWORD` | — | Es `NOMINATIM_PASSWORD` del compose. Usar un usuario de solo lectura en producción |

Front: `VITE_MAP_TILES_URL` (mapa base; por defecto los mosaicos públicos de OSM, aptos solo para uso ligero).

## Permiso
Crear el recurso `mapaconsulta` en el backend (permisos/roles); sin eso no aparece en el menú.

## Sobre la precisión
Un OSM local usa los mismos datos que el público: si una calle conserva su nombre antiguo en OSM, aquí también. Hay que corregirla en openstreetmap.org; el servidor local la recoge solo por la replicación. La pantalla indica la precisión (alta/media/baja) y permite corregir el punto a mano.
