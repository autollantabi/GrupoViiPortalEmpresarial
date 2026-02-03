# Portal Empresarial GrupoVii

## Descripción general

**Portal Empresarial** es una aplicación web (SPA) que centraliza el acceso a múltiples áreas de negocio del grupo empresarial: Cartera, Compras (Importaciones, Créditos, Anticipos), Contabilidad (Comisiones, Flujo de Caja, Conversión de archivos), Marketing (5W2H, Inventario, Comercial), Reportería (reportes por empresa/línea), RRHH (Documentación), Gobierno de Datos y Administración de Usuarios. Incluye además el módulo **App Shell** (gestión de canjes, usuarios/vendedores).

La aplicación exige **autenticación** (login con correo/contraseña) y **autorización por recurso**: el menú y el acceso a cada pantalla dependen de los permisos del usuario, con notación de puntos (ej. `contabilidad.comisiones.tecnicentro`). Las empresas y líneas disponibles se calculan por recurso desde el backend.

## Problema que resuelve

- **Fragmentación de sistemas:** Unifica en un solo portal el acceso a Cartera, Compras, Contabilidad, Marketing, Reportería, RRHH y Administración.
- **Control de acceso:** Autorización por recurso y por alcance (empresas/líneas), sin exponer funcionalidad no permitida.
- **Experiencia unificada:** Un único login, tema claro/oscuro persistente y navegación por sidebar según permisos.

## Tipo de aplicación

- **Aplicación web** (Single Page Application — SPA).
- **Frontend único:** Consume tres APIs HTTP (principal, nueva/auth, App Shell) mediante Axios; no incluye backend propio.

## Stack tecnológico

| Tecnología           | Uso principal                          |
|----------------------|----------------------------------------|
| React 18             | UI, hooks, contexto                    |
| Vite 6               | Build, dev server, alias, proxy        |
| react-router-dom 6   | Rutas (createBrowserRouter)            |
| styled-components 6  | Estilos por componente                 |
| Axios                | Tres instancias para tres APIs         |
| react-toastify       | Notificaciones                        |
| react-select         | Selects avanzados                     |
| Bootstrap 5          | Estilos base (parcial)                 |
| Tailwind CSS         | Utilidades (config presente)            |
| xlsx                 | Exportación a Excel                    |

## Casos de uso principales

1. **Login y recuperación de contraseña:** Autenticación y sesión persistente (token encriptado en `localStorage`).
2. **Navegación por recurso:** Acceso a pantallas según permisos; sidebar dinámico desde `APP_CONFIG` y contextos del usuario.
3. **Cartera:** Registros bancarios, historial, carga de transferencias, desbloqueo de clientes, gestión de cheques.
4. **Compras:** Importaciones (CRUD, documentos, bodega, nacionalización), créditos, anticipos, reportes.
5. **Contabilidad:** Conversión de archivos bancos, flujo de caja, comisiones (Mayoristas, Tecnicentro, Lubricantes).
6. **Marketing:** 5W2H, inventario, comercial, facturación.
7. **Reportería:** Reportes por tipo (Comercial, Cobranzas, Tecnicentro, Coordenadas, Importaciones, etc.).
8. **App Shell:** Gestión de canjes (estados, historial) y usuarios/vendedores del app shell.
9. **Administración:** Gestión de usuarios, permisos, roles y contextos (acceso temporal sin restricción de recurso; ver documentación técnica).

## Guía rápida de ejecución

1. **Requisitos:** Node.js (LTS recomendado), npm.
2. **Instalación:**  
   `git clone <url-repositorio>` → `cd PortalEmpresarial` → `npm install`
3. **Variables de entorno:** Crear `.env.development` (y `.env.production` para producción) con las variables indicadas en **[docs/setup.md](docs/setup.md)**. Todas se consumen desde `src/config/env.js`.
4. **Ejecutar en desarrollo:**  
   `npm run dev`  
   La aplicación se sirve en el host y puerto configurados en `vite.config.js` (por defecto `http://192.168.0.68:5000`).
5. **Login:** Ruta `/login`. El resto de rutas están protegidas por autenticación y recurso.

Para requisitos detallados, variables de entorno, errores frecuentes y solución de problemas, consultar **[docs/setup.md](docs/setup.md)**.

## Documentación técnica

La documentación está **segmentada** en varios archivos. Punto de entrada: **[docs/indice.md](docs/indice.md)**.

| Documento | Contenido |
|-----------|-----------|
| [docs/indice.md](docs/indice.md) | Índice de la documentación y guía de la estructura (plantilla para otros proyectos) |
| [docs/setup.md](docs/setup.md) | Requisitos, variables de entorno, pasos locales, errores comunes |
| [docs/arquitectura.md](docs/arquitectura.md) | Arquitectura, carpetas, árbol, módulos, cómo añadir una pantalla |
| [docs/apis.md](docs/apis.md) | Integración con las 3 APIs: endpoints, servicios, cabeceras |
| [docs/flujo-funcional.md](docs/flujo-funcional.md) | Flujos principales (login, permisos, canjes, auth/autorización) |
| [docs/guia-proyecto.md](docs/guia-proyecto.md) | Onboarding: qué es el proyecto, cómo empezar, dónde está cada cosa |
| [docs/decisiones-tecnicas.md](docs/decisiones-tecnicas.md) | Justificación de tecnologías y trade-offs |
| [docs/despliegue.md](docs/despliegue.md) | Build, ambientes, consideraciones de producción |
| [docs/pendientes.md](docs/pendientes.md) | Mejoras, deuda técnica, suposiciones |

## Estructura relevante del código

```
src/
├── config/          # env.js, axiosConfig.js, constants.js
├── context/         # authContext, ThemeContext, SidebarContext
├── router/          # SimpleRouter.jsx, Routes.js (APP_CONFIG, rutas protegidas)
├── pages/           # auth/, home/, Areas/ (Cartera, Compras, Marketing, AppShell, etc.)
├── components/      # layout/, common/, UI/Components
├── services/        # Llamadas HTTP (3 APIs)
└── utils/           # encryption, permissionsValidator, theme, colors, Utils
```

## Las tres APIs

El proyecto usa **tres instancias de Axios** (`src/config/axiosConfig.js`):

1. **VITE_API_URL** — Cartera, Compras, Contabilidad, Importaciones, Recovery, Créditos, Transacciones.
2. **VITE_API_URL_NEW** — Login, `/auth/me`, 5W2H, Transacciones cartera, Desbloqueo, Permisos/Roles/Usuarios.
3. **VITE_API_URL_APP_SHELL** — Canjes (estados, historial), usuarios/vendedores del app shell (cabecera `X-Portal-API-Key`).

Detalle de endpoints y servicios en [docs/apis.md](docs/apis.md).

## Colaboradores

- **Diego Barbecho** (GitHub: [diegobarpdev](https://github.com/diegobarpdev)) — Desarrollador Frontend

---

*Para entender, ejecutar y mantener el proyecto sin ayuda adicional, se recomienda empezar por [docs/indice.md](docs/indice.md), [docs/setup.md](docs/setup.md) y [docs/guia-proyecto.md](docs/guia-proyecto.md).*
