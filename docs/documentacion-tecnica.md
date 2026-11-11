# Módulo «Documentación Técnica» (frontend)

Módulo de uso de TI con cinco pestañas: **Diccionario**, **DWH mapping**, **Caracterización**, **Calidad** y **Completitud**. El portal es
solo frontend: los datos los sirve el backend de la API 2 (`v1-portal-empresarial-back-new`) bajo `/documentacion-tecnica/*`, a través de
`axiosInstanceNew` (ver [apis.md](apis.md)). La guía del backend está en `docs/documentacion-tecnica.md` de ese repositorio.

---

## 1. Estructura

```
src/pages/Areas/DocumentacionTecnica/
├─ index.js                  rutasDocumentacionTecnica: grupo del menú + una entrada por pestaña
├─ <seccion>/                diccionario/ dwh_mapping/ caracterizacion/ calidad/ completitud/
│  ├─ DocTec<Seccion>.jsx    la pantalla
│  └─ servicios.js           llamadas al backend (axiosInstanceNew)
├─ estilos/RaizDoc.jsx       contenedor raíz: traduce el tema del portal a variables CSS (--bg, --acento, --borde…)
└─ comunes/
   ├─ estilosDatos.js        CSS compartido de Completitud y Calidad (filtros, pestañas, tablas, semáforo)
   ├─ FiltroMultiple.jsx     filtro de selección múltiple con búsqueda
   └─ SelectSimple.jsx       lista de una sola elección sobre el SelectUI del portal
```

Se registra en `src/router/Routes.js` con `...rutasDocumentacionTecnica`.

## 2. Cómo aparece una pestaña en el menú

- Cada entrada de `index.js` lleva `recurso: "documentaciontecnica.<seccion>"`. La ruta se genera sola: `/documentaciontecnica/<seccion>`
  (el punto del recurso se vuelve `/`).
- La entrada con `rootOnly: true` solo da nombre e icono al grupo del menú.
- El menú lateral **se arma con los permisos del usuario** (`CONTEXTOS` de `/auth/me`): si el usuario no tiene el recurso, no ve el grupo ni
  puede entrar. Quien tiene la raíz `documentaciontecnica` ve todas las pestañas.

## 3. Cómo se escribe una pantalla

**Servicio (`servicios.js`).** Un archivo por sección, una función por llamada, con el prefijo `DocTec_`:

```js
import { axiosInstanceNew } from "config/axiosConfig";
const BASE = "/documentacion-tecnica/linaje";

export async function DocTec_ObtenerLinaje() {
  const res = await axiosInstanceNew.get(BASE);
  return res.data.data;            // el backend responde { status, message, data }
}
```

- Los errores **se propagan** (no se atrapan en el servicio): la pantalla distingue «sin datos» de «la API falló».
- En la pantalla, el mensaje de error se lee de `e.response?.data?.message`.
- Para descargar un CSV se pide con Axios (`responseType: "blob"`) y no con un enlace, para que viaje la cabecera `id-session`.
- Los filtros múltiples se envían repetidos: `?empresa=A&empresa=B` (`URLSearchParams.append`).

**Pantalla (`DocTec<Seccion>.jsx`).**
- Envuélvala en `<RaizDoc>` (aporta el tema claro/oscuro y la tipografía del portal) y, dentro, en un `styled.div` con sus estilos;
  si usa filtros, tablas y pestañas, incluya `${estilosDatos}`.
- Estados: cargando → `<LoaderUI text="Cargando…" />`; error → un mensaje con el `message` del backend; datos → la pantalla.
- Use los componentes del portal: `ButtonUI` (variante `outlined` para acciones secundarias), `InputUI`, `SelectUI` (o `SelectSimple` para un
  valor de texto), `LoaderUI` y `toast` de `react-toastify` para avisos (por ejemplo, el resultado de «Actualizar»).
- Colores: use las variables de `RaizDoc` (`var(--acento)`, `var(--borde)`, `var(--e-correcto)`…), nunca colores fijos, para que
  funcione el tema oscuro. La tipografía es la del portal (Nunito Sans).
- Lo que no tiene equivalente compartido (tablas, diagramas, pestañas, selección múltiple) queda con estilos propios del módulo.

## 4. Receta: agregar una pestaña nueva

Ejemplo: «Linaje».

1. **Backend primero** (ver su guía): ruta, servicio y permiso `documentaciontecnica.linaje`.
2. Cree `linaje/servicios.js` y `linaje/DocTecLinaje.jsx` siguiendo el patrón de §3 (la más sencilla de copiar es Caracterización).
3. En `index.js`: importe el componente y agregue
   `{ title: "Linaje", component: DocTecLinaje, recurso: "documentaciontecnica.linaje" }` a `rutasDocumentacionTecnica`.
4. No hace falta tocar `Routes.js`, el menú ni los permisos del portal: la ruta y el menú se generan solos.
5. Asigne el recurso a quien deba verlo (o use la raíz) desde «Asignaciones importantes».

## 5. Variables de entorno

No tiene variables propias. Usa `VITE_API_URL_NEW` (API 2), que **debe terminar en `/api/v1`** (por ejemplo
`http://192.168.0.68:3004/api/v1`). Se retiró `VITE_API_URL_DOC`.

## 6. Si algo no se ve

| Síntoma | Causa más probable |
|---|---|
| Entra al portal pero no aparece «Documentación Técnica» | El usuario no tiene el recurso `documentaciontecnica`; asignarlo y volver a iniciar sesión |
| La pantalla carga pero muestra un error / 404 en la consola | El backend desplegado todavía no incluye las rutas del módulo |
| 403 en las llamadas | Sesión sin el recurso de esa sección |
| El login no avanza en local | `VITE_API_URL_NEW` sin `/api/v1`, o el backend local no puede leer los catálogos del DWH de SQL Server (`DWH_*`) que pide `/auth/me` |
| Calidad dice «todavía no hay datos» | Falta pulsar «Actualizar datos» la primera vez; si ya se hizo, revisar que el backend persista su carpeta de resultados |

## 7. Cosas que no hay que hacer

- No volver a poner un servidor propio dentro del módulo ni una instancia de Axios aparte: todo pasa por `axiosInstanceNew`.
- No dejar lógica de negocio o consultas a bases de datos en el frontend.
- No usar colores o fuentes fijos en las pantallas.
