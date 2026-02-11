# Guía del proyecto — Onboarding y referencia rápida

Este documento es el **resumen ejecutivo** para que un desarrollador nuevo entienda el proyecto, sepa cómo empezar y dónde está cada cosa. Incluye también decisiones históricas y código legado relevantes. Puede usarse como **plantilla de “guía del proyecto”** en otros repositorios.

---

## 1. Qué es el proyecto

Portal Empresarial es un **portal web interno** (SPA) que centraliza el acceso a Cartera, Compras (Importaciones, Créditos, Anticipos), Contabilidad (Comisiones, Flujo de Caja, Conversión), Marketing (5W2H, Inventario, Comercial), Reportería (varios reportes), RRHH, Gobierno de Datos y Administración.

La **autenticación** y la **autorización por recurso** (y por empresa/línea) son el núcleo del diseño: el menú y el acceso a cada pantalla dependen de los permisos del usuario.

---

## 2. Cómo empezar

1. Clonar el repositorio, ejecutar `npm install`.
2. Configurar `.env.development` (y `.env.production` para producción) con las variables indicadas en [setup.md](setup.md). Todas se consumen desde `src/config/env.js`.
3. Ejecutar `npm run dev` (puerto y host en `vite.config.js`; por defecto `http://192.168.0.68:5000`).
4. Entrar por `/login`; el resto de rutas están protegidas por recurso.

---

## 3. Dónde está cada cosa

| Qué buscas | Dónde está |
|------------|------------|
| Rutas y menú | `src/router/SimpleRouter.jsx`, `src/router/Routes.js` (RoutesConfig, ProtectedContent, getSidebarItems). |
| Sesión y usuario | `src/context/authContext.jsx`, `src/services/authService.js` (API 2). |
| Permisos por recurso | `src/utils/permissionsValidator.js`; se usan en SimpleRouter y en páginas que reciben `routeConfig`. |
| Llamadas HTTP | `src/services/*`; 2 instancias en `src/config/axiosConfig.js`; variables de entorno en `src/config/env.js`. |
| Layout | `src/components/layout/TemplatePaginas.jsx`, `Sidebar.jsx`, `Header.jsx`. |
| Páginas | `src/pages/Areas/` por dominio; cada página recibe `routeConfig`, `availableCompanies`, `availableLines` (inyectadas por SimpleRouter). |
| Detalle de APIs | [apis.md](apis.md). |
| Cómo añadir una pantalla | [arquitectura.md](arquitectura.md) — sección “Cómo añadir una nueva pantalla”. |

---

## 4. Las dos APIs

1. **VITE_API_URL** → Cartera, Compras, Contabilidad, Importaciones, Administración (parte), Recovery, Créditos, Transacciones (actualizar banco).
2. **VITE_API_URL_NEW** → Login, `/auth/me`, 5W2H, Transacciones cartera, Desbloqueo, BAT bancos, Permisos/Roles/Usuarios-rol-contexto, Tipos de usuario, Club Shell Maxx (usuarios, canjes), Portal Mayorista (usuarios, permisos app-shell por email).

Detalle en [apis.md](apis.md).

---

## 5. Flujo típico al añadir una pantalla

1. Añadir entrada en la configuración de rutas (`src/router/Routes.js`): path opcional, title, icon, component, recurso, recursosAlternativos si aplica.
2. El componente de página debe recibir `routeConfig`, `availableCompanies`, `availableLines` y opcionalmente usar `routeConfig.rolDelRecurso` y empresas/líneas para permisos y datos.
3. Si se consumen APIs, reutilizar la instancia Axios adecuada desde `src/config/axiosConfig.js` y crear o ampliar un servicio en `src/services/`. Ver [apis.md](apis.md) y [arquitectura.md](arquitectura.md).

---

## 6. Decisiones históricas y código legado

- **Permisos por recurso:** La fuente de verdad es CONTEXTOS desde `/auth/me`, `permissionsValidator.js` (hasAccessToResource, getAvailableCompanies/Lines) y `routeConfig` inyectado por SimpleRouter a cada página.
- **Dos APIs:** Separación por responsabilidades (legacy vs auth/permisos/transacciones); no hay un único BFF.
- **Administración temporal:** En SimpleRouter, el recurso `"administracion"` tiene acceso forzado (setPermissionState(true)) con comentario TODO para quitar cuando estén configurados permisos en backend.
- **Rutas alternativas:** Ej. `cartera.registrosbancarios` y `contabilidad.registrosbancarios` permiten acceder al mismo componente.
- **Encriptación de sesión:** Implementación en `utils/encryption.js` (clave por env). No es un estándar JWT; permite persistencia sin exponer el token en claro en localStorage.
- **Fuente de verdad de rutas:** La configuración de rutas está en `Routes.js` (path derivado por `recursoToPath` cuando no se indica). La navegación programática (botones “Volver”, links) usa rutas directas (ej. `/`, `/recovery`, `/contabilidad/comisiones/tecnicentro`).

---

## 7. Contacto / autor

Desarrollador principal: **Diego Barbecho** (GitHub: [diegobarpdev](https://github.com/diegobarpdev)). Para decisiones de negocio y permisos en backend, coordinar con el equipo que mantiene las dos APIs.

---

*Para requisitos detallados y errores comunes, ver [setup.md](setup.md). Para flujos paso a paso, ver [flujo-funcional.md](flujo-funcional.md).*
