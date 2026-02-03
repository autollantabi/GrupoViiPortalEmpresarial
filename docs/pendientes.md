# Pendientes, deuda técnica y suposiciones

Este documento recoge mejoras técnicas sugeridas, deuda técnica detectada y partes del proyecto que no están claras o se documentan como suposiciones.

---

## 1. Mejoras técnicas sugeridas

| Mejora | Descripción | Prioridad sugerida |
|--------|-------------|---------------------|
| Interceptor 401 en API nueva | Añadir en `axiosInstanceNew` un interceptor de respuesta que, ante 401, limpie sesión (logout), elimine token del localStorage y redirija a `/login`. Actualmente los reintentos son por timeout/red; no hay flujo estándar para sesión expirada. | Alta |
| Tests automatizados | Introducir tests (p. ej. Vitest + React Testing Library) para: login, permissionsValidator (hasAccessToResource, getAvailableCompanies, getAvailableLines), flujos críticos de canjes y rutas protegidas. No hay tests visibles en el repositorio. | Alta |
| Tipado estático | Valorar migración a TypeScript o al menos JSDoc en servicios y utils para contratos de API y reducción de errores en tiempo de desarrollo. | Media |
| Mensaje de error cuando falta API Key App Shell | Si `VITE_API_KEY_APP_SHELL` no está definida, las rutas que consumen App Shell fallan. Valorar no montar esas rutas o mostrar un mensaje claro en la UI en lugar de solo un `console.warn`. | Media |
| Virtualización o paginación en tablas grandes | TablaInputsUI e Importaciones pueden cargar muchos registros. Valorar virtualización (p. ej. react-window) o paginación en servidor para mejorar rendimiento. | Media |
| Documentación de contratos de API | Mantener un documento o OpenAPI con los contratos de las tres APIs (endpoints, body, respuestas) para que frontend y backend estén alineados. | Baja |

---

## 2. Deuda técnica detectada

| Área | Detalle |
|------|---------|
| Administración sin restricción por recurso | En SimpleRouter, el recurso `administracion` tiene un acceso forzado con comentario "TODO: Remover esta condición después de configurar los permisos". Hasta entonces, cualquier usuario autenticado con acceso a esa ruta puede entrar. |
| Tailwind y Material Tailwind | `tailwind.config.js` usa `require("@material-tailwind/react/utils/withMT")`. El paquete `@material-tailwind/react` no aparece en `package.json`. Si no está instalado, el build o el dev pueden fallar. Opciones: instalar la dependencia o simplificar la config de Tailwind (sin withMT). |
| Descripción en package.json | La descripción sigue indicando "This project was bootstrapped with Create React App"; el proyecto usa Vite. Conviene actualizar la descripción. |
| postbuild no portable | El script postbuild asume Linux, nginx y rutas concretas. En Windows/macOS o en otro servidor fallará. No hay documentación de despliegue alternativo (CI/CD, Docker, etc.) en el repositorio. |
| Referencia a hooks en alias | `vite.config.js` define el alias `hooks` apuntando a `src/hooks`. No existe la carpeta `src/hooks` en la estructura listada; si no se usa, el alias puede eliminarse o crearse la carpeta cuando se necesite. |

---

## 3. Suposiciones y partes no claras

| Tema | Suposición o duda |
|------|-------------------|
| Estructura exacta de `/auth/me` | La documentación técnica indica que la respuesta incluye USUARIO, EMPRESAS, LINEAS, PERMISOS, ROLES, CONTEXTOS. La forma exacta (mayúsculas/minúsculas, campos anidados) puede variar por versión del backend; el código usa tanto MAYÚSCULAS como minúsculas en varios sitios (ej. CONTEXTOS vs data). |
| Comportamiento de la API principal ante 401 | No está documentado en el código si la API principal (axiosInstance) devuelve 401 ni si hay que enviar algún token; los interceptores actuales no manejan 401 de forma específica. |
| Origen de APP_CONFIG / RoutesConfig | La fuente de verdad de rutas es `router/Routes.js` (RoutesConfig). No hay evidencia en el repo de que exista otra fuente (p. ej. backend) que genere esta configuración; se asume que es estática y versionada. |
| Gobierno de Datos y RRHH | En la documentación técnica se mencionan áreas como Gobierno de Datos (Maestros) y RRHH (Documentación). En la estructura actual de `pages/Areas` no aparece una carpeta "Gobierno de Datos"; sí existe RRHH. Puede haber refactor o rutas no mapeadas en el análisis. |
| Valor por defecto de ENCRYPTION_KEY | En `env.js` se usa `"default-encryption-key-change-in-env"` si no se define `VITE_ENCRYPTION_KEY`. Se asume que en producción siempre se debe definir una clave propia; no está comprobado automáticamente. |
| Uso de Bootstrap vs styled-components vs Tailwind | El proyecto mezcla Bootstrap (parcial), styled-components (muchos componentes UI) y Tailwind (config presente). No hay una guía de estilo que indique cuándo usar cada uno; se asume que styled-components es el estándar para componentes nuevos y Bootstrap para utilidades o legacy. |

---

## 4. Cómo usar este documento

- **Mejoras técnicas:** Priorizar según impacto y esfuerzo; pueden convertirse en tareas en el backlog.
- **Deuda técnica:** Planificar su resolución (p. ej. quitar el acceso forzado a administración cuando existan permisos, corregir Tailwind o postbuild).
- **Suposiciones:** Contrastar con el código y con el equipo de backend; actualizar la documentación cuando se aclaren.

Al resolver un punto de este documento, se recomienda actualizar o eliminar la entrada correspondiente y, si aplica, reflejar el cambio en [arquitectura.md](arquitectura.md), [setup.md](setup.md) o [despliegue.md](despliegue.md).
