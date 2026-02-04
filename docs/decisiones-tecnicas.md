# Decisiones técnicas

Este documento recoge la justificación de las tecnologías elegidas, alternativas que se pueden inferir del contexto y trade-offs importantes del proyecto.

---

## 1. Justificación de tecnologías elegidas

### 1.1 React 18

- **Uso:** UI, hooks, contexto global (Auth, Theme, Sidebar).
- **Justificación:** Permite componentes reutilizables, estado local y global mediante contextos, y un ecosistema amplio de librerías. La versión 18 aporta mejoras de concurrencia y renderizado.
- **Alternativas no adoptadas en el código:** Vue, Angular, Svelte. No se evidencia en el repositorio una comparativa formal; la elección de React es coherente con un proyecto SPA empresarial ya existente.

### 1.2 Vite 6

- **Uso:** Servidor de desarrollo, build, alias de rutas, proxy para APIs.
- **Justificación:** Sustituye a Create React App (CRA) en proyectos modernos: arranque y HMR más rápidos, build con Rollup, configuración explícita en `vite.config.js`. El `package.json` indica que el proyecto fue iniciado con CRA pero migrado a Vite (descripción y scripts actuales).
- **Alternativa:** CRA (legacy). Vite reduce tiempos de build y mejora la experiencia de desarrollo.

### 1.3 react-router-dom 6

- **Uso:** Rutas con `createBrowserRouter`, rutas protegidas, generación dinámica del sidebar desde configuración.
- **Justificación:** Estándar de facto para enrutado en React; la versión 6 ofrece data routers y APIs más declarativas.
- **Nota:** No hay uso visible de loaders/actions de React Router en el análisis; las rutas se generan desde `Routes.js` y SimpleRouter.

### 1.4 styled-components 6

- **Uso:** Estilos por componente, temas (ThemeContext), componentes UI (ButtonUI, CardUI, etc.).
- **Justificación:** CSS-in-JS con soporte de temas y props dinámicas; evita conflictos de clases globales y permite reutilizar componentes con estilos encapsulados.
- **Alternativas:** Tailwind (parcialmente presente en el proyecto), CSS Modules, Emotion. El proyecto combina styled-components con Bootstrap (parcial) y Tailwind (config presente).

### 1.5 Axios (2 instancias)

- **Uso:** Dos clientes HTTP: API principal, API nueva (auth/permisos/transacciones).
- **Justificación:** Separar por responsabilidad y por cabeceras (id-session en API nueva). Axios permite interceptores (reintentos por timeout/red en el código) y configuración por instancia.
- **Alternativas:** fetch nativo, ky, got. Axios sigue siendo habitual en proyectos empresariales por interceptores y API uniforme.

### 1.6 Encriptación de sesión (utils/encryption.js)

- **Uso:** Encriptar/desencriptar el `id-session` antes de guardarlo en `localStorage`.
- **Justificación:** No exponer el token en claro en el almacenamiento del navegador; la clave viene de `VITE_ENCRYPTION_KEY`.
- **Trade-off:** La implementación (XOR + base64 u otra según el código) no es un estándar tipo JWT firmado; es una capa de ofuscación. Para mayor seguridad, el backend debería validar y rotar tokens; el frontend solo persiste lo que devuelve el backend.

### 1.7 Permisos por recurso (notación de puntos)

- **Uso:** Recursos como `importaciones.compras.reportes`, `cartera.registrosbancarios`. Herencia (acceso a recurso padre implica acceso a hijos); recursos bloqueados para restringir hijos.
- **Justificación:** Un solo modelo de permisos para menú y rutas; empresas y líneas disponibles se calculan por recurso desde `user.CONTEXTOS`.
- **Alternativa:** Permisos por rol sin jerarquía de recursos. La notación de puntos permite una jerarquía flexible sin hardcodear pantallas por rol.

---

## 2. Alternativas consideradas (inferidas del contexto)

- **Un solo backend (BFF):** No adoptado. El proyecto consume dos APIs distintas (legacy, nueva/auth). Un BFF unificaría contratos y cabeceras pero añadiría una capa más; la decisión actual mantiene el frontend como único orquestador.
- **State manager global (Redux, Zustand):** No adoptado de forma explícita. El estado global se limita a AuthContext, ThemeContext y SidebarContext. Para el tamaño actual del proyecto, los contextos son suficientes; un state manager podría valorarse si crece la complejidad de estado compartido.
- **TypeScript:** No adoptado. El proyecto es JavaScript (JSX). TypeScript reduciría errores de tipos y mejoraría el autocompletado; la migración tendría coste y no está documentada como decisión explícita.
- **Tests automatizados:** No hay tests visibles en el repositorio (coverage, Jest, Vitest). Se infiere que no se priorizó en la fase actual; se recomienda para auth, permissionsValidator y flujos críticos (ver [pendientes.md](pendientes.md)).

---

## 3. Trade-offs importantes

| Área | Decisión | Trade-off |
|------|----------|-----------|
| Dos APIs | Mantener dos clientes Axios con URLs y cabeceras distintas. | Ventaja: separación clara por dominio y por backend. Desventaja: más configuración (env), más documentación y posible duplicación de lógica de errores. |
| Administración sin restricción de recurso | En SimpleRouter, recurso `administracion` tiene acceso forzado (TODO para quitar cuando estén configurados permisos). | Ventaja: permite configurar permisos sin bloquear a los administradadores. Desventaja: riesgo de acceso amplio hasta que se configure el recurso en backend. |
| Recursos alternativos | Rutas como Registros Bancarios accesibles por `cartera.registrosbancarios` o `contabilidad.registrosbancarios`. | Ventaja: mismo componente para dos contextos de negocio. Desventaja: lógica de permisos y empresas/líneas debe combinar ambos recursos. |
| Build en carpeta `build/` | `vite.config.js` usa `outDir: "build"` (en lugar de `dist`). | Ventaja: compatibilidad con scripts o documentación que esperan `build/`. Desventaja: difiere del valor por defecto de Vite (`dist`). |
| postbuild en Linux/nginx | Script postbuild copia a `/var/www/html/portalEmpresarial/` y recarga nginx. | Ventaja: despliegue directo en un servidor Linux con nginx. Desventaja: no portable a Windows/macOS; en entornos distintos hay que desactivar o adaptar el script. |
| Interceptores Axios | Reintentos automáticos por timeout/red (hasta 3 veces). | Ventaja: mayor resiliencia ante fallos puntuales. Desventaja: no hay flujo estándar documentado para 401 (renovar sesión o redirigir a login); podría añadirse en el interceptor de axiosInstanceNew. |

---

## 4. Configuraciones que afectan decisiones

- **Host y puerto fijos en Vite:** `server.host: "192.168.0.68"`, `server.port: 5000`, `strictPort: true`. Adecuado para un entorno de red concreto; en otros entornos puede requerir cambio o uso de variables.
- **Proxy en desarrollo:** `/apid1` y `/apid2` reescriben a `localhost:3002` y `localhost:3004`. Permite usar el mismo origen en el navegador durante el desarrollo; las variables `VITE_API_URL` y `VITE_API_URL_NEW` pueden apuntar a esas rutas proxy o a URLs completas según el entorno.
- **Alias de rutas:** `components/`, `config/`, `pages/`, `router/`, `services/`, `utils/`, `assets/`, `hooks/`. Facilitan imports cortos y coherentes; cualquier nuevo alias debe mantenerse en `vite.config.js` y, si aplica, en `jsconfig.json`.

---

*Este documento refleja decisiones y trade-offs deducidos del código y la configuración. Para decisiones de negocio o de producto, conviene contrastar con el equipo que mantiene el proyecto.*
