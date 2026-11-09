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
| `GET /autocomplete?q=[&lat&lon]` | Sugerencias mientras se escribe (desde 3 letras, con pausa de 400 ms) | Geocoding API; cada sugerencia ya trae coordenadas y desglose |

No se usa Places API: el autocompletado sale de la misma Geocoding API, así que no hay que habilitar nada más en la clave. Devuelve varias coincidencias solo cuando el texto es ambiguo. Si Buscar no encuentra el cruce, la pantalla ofrece estas sugerencias ("¿Quiso decir…?").

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

## Parroquia
Google casi nunca trae la parroquia en Ecuador, y las parroquias **urbanas** de una ciudad las define cada municipio por ordenanza (el INEC y la CONALI solo manejan la oficial, que en una ciudad es la cabecera cantonal). Por eso el backend ubica el punto en polígonos, sin PostGIS, y toma la parroquia en este orden:

1. **Límite urbano del municipio** (`src/data/parroquias_urbanas.json` en el backend). Cada polígono lleva su `fuente`, que el front muestra al pasar el cursor sobre el campo.
2. La que trae Google, si la trae.
3. **Parroquia oficial** del Ministerio de Gobierno (`src/data/parroquias.json`, 1050 parroquias, febrero de 2026). Origen: Portal de Datos Abiertos, dataset "Organización Territorial Parroquial".

Cantones con límite urbano municipal: Quito, Guayaquil, Cuenca, Portoviejo, Riobamba, Loja, Latacunga, Ibarra, Rumiñahui, Otavalo y Antonio Ante. Loja viene de una capa de la UTPL cuyo origen es la ordenanza del GAD. Ambato, Machala y Azogues se descartaron por dudas sobre su capa. En el resto del país sale la parroquia oficial; los campos que no se conocen se muestran con un guion.

Para sumar un cantón: convertir la capa del municipio a WGS84, simplificarla (~3 m) y agregar sus polígonos a `parroquias_urbanas.json` con `cod_canton`, `canton`, `parroquia` y `fuente`. No hace falta tocar código. El `npm run build` copia `src/data` a `dist`.

## Errores
Si la clave falta, es inválida o se agotó la cuota, el backend responde **502** y lo registra en el log con el estado de Google (`REQUEST_DENIED`, `OVER_QUERY_LIMIT`…).

## Permiso
Crear el recurso `mapaconsulta` en el backend (permisos/roles); sin eso no aparece en el menú.

## Sobre la precisión
La pantalla indica la precisión (alta/media/baja) y permite corregir el punto a mano. Alta: un cruce, o un predio que Google marca como exacto (`ROOFTOP`). Media: un número estimado entre dos puntos de la calle (`RANGE_INTERPOLATED`), una calle sin numeración, o un punto marcado con clic (devuelve la dirección más cercana, no la del punto). Baja: el resto.
