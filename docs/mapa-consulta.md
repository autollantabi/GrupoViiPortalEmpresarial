# Mapa de consulta

Pantalla `/mapaconsulta` (recurso `mapaconsulta`): mapa Leaflet + búsqueda de dirección. Devuelve provincia, cantón, ciudad, parroquia, comunidad/barrio, calle, número y coordenadas. Clic o arrastre del marcador = consulta inversa del punto exacto.

Código: `src/pages/Areas/MapaConsulta/`, `src/services/geocodingService.js`.

## Permiso
Crear el recurso `mapaconsulta` en el backend (permisos/roles) y asignarlo; sin eso no aparece en el menú.

## Variables (`.env.*`)
| Variable | Default | Uso |
|---|---|---|
| `VITE_GEOCODER_URL` | `https://nominatim.openstreetmap.org` | Servidor Nominatim |
| `VITE_MAP_TILES_URL` | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Mapa base |
| `VITE_GEOCODER_COUNTRY` | `ec` | Limita la búsqueda al país |

El servidor público de OSM **no es apto para producción** (política de uso: ~1 req/s, sin autocompletado, y las direcciones de clientes salen a un tercero). Para producción usar una instancia local.

## Nominatim local (Ecuador)
```yaml
services:
  nominatim:
    image: mediagis/nominatim:4.4
    ports: ["8080:8080"]
    environment:
      PBF_URL: https://download.geofabrik.de/south-america/ecuador-latest.osm.pbf
      REPLICATION_URL: https://download.geofabrik.de/south-america/ecuador-updates/
      NOMINATIM_PASSWORD: cambiar
    volumes: [nominatim-data:/var/lib/postgresql/14/main]
    shm_size: 1gb
volumes:
  nominatim-data:
```
Importación inicial: unos 30–60 min. Luego `VITE_GEOCODER_URL=http://<host>:8080` (si el portal va por HTTPS, publicarlo detrás de nginx con HTTPS y CORS). Para tiles propios usar un tile server (p. ej. `overv/openstreetmap-tile-server`) y apuntar `VITE_MAP_TILES_URL`.

## Sobre la precisión
Un OSM local no mejora la precisión: usa los mismos datos. En Ecuador la cobertura de números de casa es baja fuera de zonas urbanas grandes; la pantalla indica la precisión (alta/media/baja) y permite corregir el punto a mano. Parroquia y cantón dependen de cómo estén mapeados los límites administrativos en OSM (en Quito la parroquia llega en `city_district`).
