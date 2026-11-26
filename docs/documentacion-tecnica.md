# Módulo «Documentación Técnica» (frontend)

Módulo de uso de TI con ocho pestañas: **Diccionario**, **DWH mapping**, **Caracterización**, **Calidad**, **Completitud**, **Horario Automatizaciones**, **Líneas** y **Vendedor**. El portal es
solo frontend: los datos los sirve el backend de la API 2 (`v1-portal-empresarial-back-new`) bajo `/documentacion-tecnica/*`, a través de
`axiosInstanceNew` (ver [apis.md](apis.md)). La guía del backend está en `docs/documentacion-tecnica.md` de ese repositorio.

---

## 1. Estructura

```
src/pages/Areas/DocumentacionTecnica/
├─ index.js                  rutasDocumentacionTecnica: grupo del menú + una entrada por pestaña
├─ <seccion>/                diccionario/ dwh_mapping/ caracterizacion/ calidad/ completitud/ horarios/
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

## 3b. Cómo una pestaña hereda el estilo del portal

Las pestañas **no definen colores ni fuentes**: los toman del tema del portal a través de `estilos/RaizDoc.jsx`. Ese componente lee
`theme.colors.*` (el `ThemeProvider` del portal, claro u oscuro) y lo publica como variables CSS dentro de su contenedor. Una pantalla
que solo usa esas variables se ve igual que las demás y cambia sola con el tema.

| Variable | Para qué se usa |
|---|---|
| `--bg`, `--panel`, `--sub-fondo`, `--detalle-fondo` | Fondo de la pantalla, de tarjetas/paneles, de cabeceras y de zonas secundarias |
| `--texto`, `--titulo`, `--suave` | Texto normal, títulos y texto de apoyo (la variante `--suave` ya cumple contraste 4,5:1) |
| `--borde`, `--hover` | Líneas, bordes y fondo al pasar el mouse |
| `--acento`, `--marca`, `--acento-fondo`, `--acento-texto`, `--acento-boton`, `--sobre-acento` | Naranja de marca: bordes y rellenos, fondo suave, texto sobre claro/oscuro, botón y texto sobre el botón |
| `--ok` / `--ok-fondo`, `--aviso` / `--aviso-fondo`, `--error` / `--error-fondo` | Estados: bien, por revisar, por corregir (texto y fondo) |
| `--e-correcto`, `--e-inconsistente`, `--e-sin-clasificar`, `--e-no-verificable`, `--e-no-evaluable` | Semáforo de calidad |
| `--fuente`, `--fuente-titulo`, `--fuente-mono` (clase `.mono`) | Tipografía del portal (Nunito Sans) y monoespaciada |

Reglas para que una pantalla nueva «se vea del portal»:

1. Envolver todo en `<RaizDoc>` y dentro un `styled.div` con los estilos de la pantalla; si lleva filtros, tablas o pestañas, incluir
   `${estilosDatos}` (botón `.boton`, aviso `.aviso`, títulos `.titulo-fila`, etc.).
2. Usar **solo** variables `var(--…)` para colores. Un color fijo solo se justifica cuando distingue categorías (por ejemplo, los tres
   colores de capa DWH/DF/MS de Horario Automatizaciones, que se declaran como variables locales `--c-dwh`, `--c-df`, `--c-ms`).
3. Usar los componentes del portal (`ButtonUI`, `LoaderUI`, `SelectUI`/`SelectSimple`) y `toast` de `react-toastify` para avisos.
4. Lo que no existe como componente compartido (barras de línea de tiempo, «pastillas», etiquetas de hora) se escribe con estilos propios
   en el mismo lenguaje visual: bordes redondeados, fondo `--panel`, borde `--borde`, acento `--acento`.
5. Textos en lenguaje natural para el usuario («Todo en orden», «cosas por revisar»), no en jerga técnica.

## 4. Receta: agregar una pestaña nueva

Ejemplo: «Linaje».

1. **Backend primero** (ver su guía): ruta, servicio y permiso `documentaciontecnica.linaje`.
2. Cree `linaje/servicios.js` y `linaje/DocTecLinaje.jsx` siguiendo el patrón de §3 (la más sencilla de copiar es Caracterización).
3. En `index.js`: importe el componente y agregue
   `{ title: "Linaje", component: DocTecLinaje, recurso: "documentaciontecnica.linaje" }` a `rutasDocumentacionTecnica`.
4. No hace falta tocar `Routes.js`, el menú ni los permisos del portal: la ruta y el menú se generan solos.
5. Asigne el recurso a quien deba verlo (o use la raíz) desde «Asignaciones importantes».

## 4. bis. Menú «Gobierno de Datos» (submenús)

El módulo se llama ahora «Gobierno de Datos» y el menú tiene grupos: Documentación (Diccionario, DWH mapping, Horario
Automatizaciones), Caracterización › Productos, Calidad › Productos, Completitud › Productos y Parametrización Mapping ›
Productos › Líneas / Vendedor. Los submenús salen de los puntos del recurso (`documentaciontecnica.calidad.productos`). El título de
cada grupo se declara en `index.js` con un item `rootOnly` cuyo recurso tiene varios niveles (así llevan tildes); `SimpleRouter.jsx`
(`titulosGrupos`) lo usa y, si no hay, capitaliza el nombre del nivel.

Cada pantalla que cambió de lugar se declara con el ayudante `movida(...)` de `index.js`: crea la ruta nueva (recurso nuevo, el
antiguo como `recursosAlternativos`) **y** una ruta antigua oculta (`hideInSidebar`) para que sigan funcionando los enlaces y
permisos anteriores. Para añadir «Socios» basta una entrada con su recurso (`documentaciontecnica.calidad.socios`, etc.): aparece
sola en su grupo.

## 4. ter. Calidad › Socios

`calidad/DocTecCalidadSocios.jsx` (+ `calidad/serviciosSocios.js`) usa el mismo estilo de Completitud: indicadores, filtros por
empresa y tipo de socio, y debajo del resumen (misma pantalla, sin pestañas) la tabla de identificaciones con variantes: cada nombre
distinto va en su columna (Variante A, B, C…) con las empresas que lo usan; «Actualizar datos» y CSV. Recurso `documentaciontecnica.calidad.socios`. Pendiente: historial/evolución y más
reglas (formato de cédula/RUC, nombres en minúsculas).

## 4. quater. Calidad › Productos (26-nov-2026)

`calidad/DocTecCalidad.jsx`. Atributos, estados y cifras llegan del backend (ver su guía).

- **Vista general** (`VistaGeneral`): aparece cuando el resumen trae `vista_general` (sin filtros o solo Empresa). Tabla por
  empresa con Calidad, Llantas, Lubricantes y SKU; «N/A» si no hay productos. El nombre de la empresa abre el detalle de
  llantas (o lubricantes si no tiene llantas) y cada cifra abre esa empresa y línea.
- El filtro `grupo` se muestra como **Línea de Negocio**.
- En el resumen, «Cód. Proveedor» va con los atributos de arriba, no en «Unidades de Medida».
- La evolución semanal es solo de llantas.

Calidad › Socios (además de lo del punto 4. ter): las barras muestran consistencia (100 − % con variantes) y el buscador tiene un
desplegable de sugerencias que no cambia la tabla hasta elegir una o pulsar Enter.

## 4a. Pestaña «Líneas» (copia de una pantalla de otra área)

`lineas/DocTecLineas.jsx` es una **copia** de «Monitoreo de Líneas» (`pages/Areas/Negocio/Linea/Linea.jsx`): mismos endpoints
(`/dwh-postgres/linea-negocio-parametros`, vía `postgresService`) y misma apariencia. Se duplicó para que TI la use sin acceso al área
Negocio. La única diferencia: puede editar quien tenga el permiso 2 en `negocio.linea` **o** el recurso `documentaciontecnica.parametrizacion.productos.lineas` (o el antiguo `documentaciontecnica.lineas`)
(o la raíz `documentaciontecnica`). Si cambia la original, hay que replicar el cambio en la copia.

`vendedor/DocTecVendedor.jsx` es del mismo modo una copia de «Vendedor» (`pages/Areas/Negocio/Vendedor/Vendedor.jsx`), recurso
`documentaciontecnica.vendedor`. Usa `/dwh-postgres/vendedores-parametros`, `linea-negocio-parametros` y `categoria-parametros`
(crear). La original no distingue permisos de edición, así que la copia tampoco: quien ve la pestaña, edita.

## 4b. Patrón de pestaña editable (ejemplo: Horario Automatizaciones)

Las primeras cinco pestañas solo leen. Horario Automatizaciones además **edita y guarda**; use ese patrón (`horarios/DocTecHorarios.jsx`) cuando
una pestaña nueva deba permitir cambios:

- **Borrador en pantalla.** Se carga el contenido del servidor (`base`) y se edita una copia (`borrador`). «Guardar cambios» se activa solo
  si el borrador difiere de `base`; «Descartar cambios» vuelve a `base`.
- **Se guarda completo.** Un solo `PUT` con todo el contenido y la `revision` que se leyó. Si otra persona guardó antes, el backend responde
  `409` y la pantalla muestra su mensaje; el usuario recarga y reaplica.
- **Alertas sin duplicar reglas.** Las reglas viven **solo en el backend**. Mientras se edita, la pantalla llama (con una espera de 400 ms) a
  `POST …/validar` con el borrador y muestra las alertas devueltas. Un `400` significa estructura inválida (se muestra y se bloquea guardar);
  las alertas de negocio no bloquean.
- **Restaurar.** Un botón vuelve a la propuesta inicial del backend (con confirmación).
- **Interacciones de edición fáciles:** nombre editable pulsándolo, horas como etiquetas editables en el sitio, botones «pastilla» que se
  activan con un clic para las dependencias, y opciones poco usadas escondidas en «Más opciones».

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
| Una pestaña sale vacía o con error **solo en local** (Líneas, Horario Automatizaciones…) | El backend local que se esté usando no monta las rutas de esa pestaña (404 en la consola). Con el backend completo no pasa; con un servidor mínimo de pruebas hay que montar sus rutas (ver §6b) |
| Calidad dice «todavía no hay datos» | Falta pulsar «Actualizar datos» la primera vez; si ya se hizo, revisar que el backend persista su carpeta de resultados |

## 6b. Verla en local sin iniciar sesión

El portal exige login real, y el login necesita el SQL Server del backend. Para ver las pantallas en local hay dos caminos:

- **Con el backend completo** y su `.env` (login real): lo habitual en desarrollo del equipo.
- **Sin login**, con el `vite.config.js` local (está en `.gitignore`, no se sube): tiene un modo que simula un usuario de TI con los recursos
  `documentaciontecnica.*` y muestra el menú completo. **Al crear una pestaña nueva hay que agregar su recurso** a la lista
  `__CONTEXTOS_SIMULADOS` de ese archivo; si no, la pestaña no aparece en el menú. Las llamadas a la API necesitan un backend que responda
  (con sesión simulada o real) en la URL de `VITE_API_URL_NEW`.

En modo local el menú lateral aparece colapsado: pase el mouse sobre la barra izquierda para desplegar «Documentación Técnica».

## 6c. Probar en local con un servidor mínimo (trampa conocida)

Cuando no se puede levantar el backend completo (por ejemplo, falta el SQL Server de catálogos del DWH que pide `/auth/me`), se usa un
servidor de pruebas mínimo que monta solo auth y las rutas del módulo. **Cada pestaña nueva necesita que se monten sus rutas ahí**; si no,
la pestaña sale vacía o con error en local aunque en producción funcione. Ya pasó con **Líneas** (`/dwh-postgres/linea-negocio-parametros`)
y **Horario Automatizaciones** (`/documentacion-tecnica/horarios`). Al agregar una pestaña: montar su ruta en ese servidor y probarla con
una llamada directa (sin sesión debe responder 403, no 404). Recordar también que, con la base real conectada, lo que se edite en local se
guarda de verdad.

## 7. Cosas que no hay que hacer

- No volver a poner un servidor propio dentro del módulo ni una instancia de Axios aparte: todo pasa por `axiosInstanceNew`.
- No dejar lógica de negocio o consultas a bases de datos en el frontend.
- No usar colores o fuentes fijos en las pantallas (ver §3b).
- No copiar en el frontend las reglas de validación del negocio: viven en el backend y la pantalla solo muestra su resultado.

## Calidad › Socios con el formato de Productos (26-nov-2026)

Reemplaza las tarjetas y barras anteriores: filtros generales, índice (consistencia sobre comparables), lista de atributos (hoy solo
Nombre: % correcto y por revisar; sin tabla por empresa) y «Detalle: Nombre» (estado Correcto/Inconsistente, gráfico de 2, 3 y 4 o más
variantes, tabla de comparables con estado). Las identificaciones de una sola empresa no se usan. No se muestran otros datos
personales. La tabla admite `estado=CORRECTO|INCONSISTENTE`; el CSV sigue siendo solo de las que tienen variantes.
Respaldo del diseño anterior: `proyectos/_respaldos/socios_2026-11-26_antes_formato_productos`.

## Calidad › Socios: atributo Identificación (26-nov-2026)

La regla al revés: un mismo nombre (texto exacto) en más de una empresa debe tener una sola identificación; la cédula y
su RUC (cédula + `001`) cuentan como una (`evaluarPorNombre` en `sociosCalidadCalculo.ts`). El índice general de Socios es
el promedio simple de Nombre e Identificación. La API admite `atributo=identificacion` en `identificaciones` y `exportar`.
Medido: Nombre 78,5 % (735 de 3.426), Identificación 99,5 % (16 de 3.015), índice 89,0.

Cambio posterior (26-nov): Identificación cuenta también los nombres repetidos dentro de una misma empresa; su universo es
nombres en más de una empresa o con más de una identificación. Nombre no cambia.
