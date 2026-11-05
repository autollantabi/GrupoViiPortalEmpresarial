# Mapa de consulta

Pantalla `/mapaconsulta` (recurso `mapaconsulta`): mapa de Google Maps + búsqueda de dirección. Devuelve provincia, cantón, ciudad, parroquia, comunidad/barrio, calle, número y coordenadas. Clic o arrastre del marcador = consulta inversa del punto. Acepta cruces de calles: `Junín y 5 de Junio`, `Ayacucho / Bernardo Darquea, Riobamba`.

Código front: `src/pages/Areas/MapaConsulta/`, `src/services/geocodingService.js`.
Código back (repo `v1-portal-empresarial-back-new`): `routes/routesGeocodificacion.ts`, `controllers/Geocodificacion.ts`, `services/GeocodificacionService.ts`.

## Arquitectura
Las **búsquedas** (geocodificación) pasan por el backend (`/api/v1/geocodificacion/*`, protegido por la sesión) con una clave que vive solo en su `.env`. El **mapa visual** lo dibuja el navegador con Maps JavaScript API, con otra clave (la de navegador siempre es visible en el cliente, por eso se restringe por dominio). No requiere instalar nada extra en el servidor.

| Endpoint | Qué hace | Google |
|---|---|---|
| `GET /search?q=` | Búsqueda por texto | Geocoding API (`address`) |
| `GET /reverse?lat&lon` | Qué hay en un punto | Geocoding API (`latlng`) |
| `GET /cruces?calleA&calleB[&ciudad][&lat&lon]` | Cruce de dos calles | Geocoding API (`A & B, ciudad`); solo se aceptan resultados de tipo `intersection` |

El backend traduce la respuesta de Google a la forma que usa el front (`address.state`, `county`, `city`, `city_district`, `road`…). Con `lat&lon` (centro del mapa) Google prioriza los cruces de esa zona. Se cachean 10 min las respuestas, compartidas entre usuarios: se paga por consulta.

## Variables
Backend (`.env`, ver `.env.example`):
| Variable | Default | Uso |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | — | Clave de Google Cloud con **Geocoding API** habilitada |
| `GEOCODING_COUNTRY` | `EC` | País al que se limitan las búsquedas |

Recomendado para la clave: restricción por **IP del servidor** (no por referrer, porque la usa el backend) y restringida a Geocoding API; definir un tope de cuota/presupuesto en Google Cloud.

Front (`.env.development` / `.env.production`):
| Variable | Uso |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Clave de **Maps JavaScript API**, distinta a la del backend. Restringir por **HTTP referrer** (dominios del portal) y solo a Maps JavaScript API. Vite la incrusta al compilar: debe estar definida al hacer el build |

Se necesitan dos claves porque las restricciones son incompatibles: la del backend va por IP del servidor y la del navegador por dominio.

## Errores
Si la clave falta, es inválida o se agotó la cuota, el backend responde **502** y lo registra en el log con el estado de Google (`REQUEST_DENIED`, `OVER_QUERY_LIMIT`…).

## Permiso
Crear el recurso `mapaconsulta` en el backend (permisos/roles); sin eso no aparece en el menú.

## Sobre la precisión
La pantalla indica la precisión (alta/media/baja) y permite corregir el punto a mano. Google marca como exacto (`ROOFTOP`) solo los predios que conoce; las calles sin numeración devuelven un punto sobre la vía.
